package service

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/boogie/backend/internal/domain/models"
)

type UbicacionesService struct {
	httpClient *http.Client
	cache      *CacheService
}

func NewUbicacionesService() *UbicacionesService {
	return &UbicacionesService{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		cache: GetCache(),
	}
}

var photonTipos = map[string]string{
	"city":          "Ciudad",
	"town":          "Ciudad",
	"village":       "Pueblo",
	"suburb":        "Zona",
	"district":      "Zona",
	"neighbourhood": "Barrio",
	"quarter":       "Barrio",
	"locality":      "Localidad",
	"county":        "Municipio",
	"state":         "Estado",
	"island":        "Isla",
	"country":       "País",
}

var photonInvalidValues = map[string]bool{
	"motorway_junction": true, "motorway_link": true, "residential": true,
	"park": true, "hotel": true, "restaurant": true, "marketplace": true,
	"house": true, "yes": true, "secondary": true, "tertiary": true,
	"primary": true, "trunk": true, "unclassified": true, "service": true,
	"footway": true, "pedestrian": true,
}

var nominatimTipos = map[string]string{
	"city": "Ciudad", "town": "Ciudad", "village": "Pueblo",
	"suburb": "Zona", "neighbourhood": "Barrio", "quarter": "Barrio",
	"locality": "Localidad", "state": "Estado", "island": "Isla",
}

type photonFeature struct {
	Properties map[string]interface{} `json:"properties"`
	Geometry   struct {
		Coordinates []float64 `json:"coordinates"`
	} `json:"geometry"`
}

type photonResponse struct {
	Features []photonFeature `json:"features"`
}

type nominatimResult struct {
	PlaceID     int               `json:"place_id"`
	DisplayName string            `json:"display_name"`
	Lat         string            `json:"lat"`
	Lon         string            `json:"lon"`
	Type        string            `json:"type"`
	Class       string            `json:"class"`
	Address     map[string]string `json:"address"`
}

func (s *UbicacionesService) Search(q string) ([]models.LocationSuggestion, error) {
	if len(q) < 2 {
		return []models.LocationSuggestion{}, nil
	}

	key := "ubicaciones:" + q
	ttl := 1 * time.Hour

	var results []models.LocationSuggestion
	err := s.cache.GetOrFetchInto(key, ttl, &results, func() (interface{}, error) {
		return s.searchAll(q)
	})
	if err != nil {
		return nil, err
	}
	return results, nil
}

func (s *UbicacionesService) searchAll(q string) ([]models.LocationSuggestion, error) {
	results, err := s.searchPhoton(q)
	if err != nil {
		slog.Warn("Photon search failed", "error", err)
	}

	if len(results) > 0 {
		return results, nil
	}

	results, err = s.searchNominatim(q)
	if err != nil {
		slog.Warn("Nominatim search failed", "error", err)
		return nil, fmt.Errorf("geocoding services unavailable")
	}

	return results, nil
}

func (s *UbicacionesService) searchPhoton(q string) ([]models.LocationSuggestion, error) {
	apiURL := fmt.Sprintf(
		"https://photon.komoot.io/api/?q=%s&limit=10&lat=10.5&lon=-66.9&bbox=-73.5,0.5,-59,13",
		url.QueryEscape(q),
	)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("photon request: %w", err)
	}
	req.Header.Set("User-Agent", "Boogie/1.0 (contacto@boogie.com.ve)")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("photon status: %d", resp.StatusCode)
	}

	var data photonResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	seen := make(map[string]bool)
	var results []models.LocationSuggestion

	for _, f := range data.Features {
		props := f.Properties
		countryCode, _ := props["countrycode"].(string)
		if countryCode != "VE" {
			continue
		}

		osmValue, _ := props["osm_value"].(string)
		if photonInvalidValues[osmValue] {
			continue
		}

		osmKey, _ := props["osm_key"].(string)
		tipo := photonTipos[osmValue]
		if tipo == "" {
			switch osmKey {
			case "place":
				tipo = "Lugar"
			case "boundary":
				tipo = "Zona"
			default:
				continue
			}
		}

		nombre, _ := props["name"].(string)
		if nombre == "" {
			continue
		}

		if len(f.Geometry.Coordinates) < 2 {
			continue
		}

		detalle := buildPhotonDetalle(props, nombre)
		key := fmt.Sprintf("%s-%.2f-%.2f", nombre, f.Geometry.Coordinates[1], f.Geometry.Coordinates[0])
		if seen[key] {
			continue
		}
		seen[key] = true

		osmID, _ := props["osm_id"].(string)
		if osmID == "" {
			osmID = nombre
		}

		results = append(results, models.LocationSuggestion{
			ID:      fmt.Sprintf("ph-%s", osmID),
			Nombre:  nombre,
			Detalle: detalle,
			Tipo:    tipo,
			Lat:     f.Geometry.Coordinates[1],
			Lng:     f.Geometry.Coordinates[0],
		})

		if len(results) >= 8 {
			break
		}
	}

	return results, nil
}

func buildPhotonDetalle(props map[string]interface{}, nombre string) string {
	var parts []string
	addIfDifferent := func(key string) {
		if v, ok := props[key].(string); ok && v != "" && v != nombre {
			parts = append(parts, v)
		}
	}
	addIfDifferent("district")
	addIfDifferent("city")
	addIfDifferent("county")

	if state, ok := props["state"].(string); ok && state != "" {
		found := false
		for _, p := range parts {
			if strings.Contains(p, state) {
				found = true
				break
			}
		}
		if !found {
			parts = append(parts, state)
		}
	}

	return strings.Join(parts, ", ")
}

func (s *UbicacionesService) searchNominatim(q string) ([]models.LocationSuggestion, error) {
	apiURL := fmt.Sprintf(
		"https://nominatim.openstreetmap.org/search?q=%s&countrycodes=ve&format=json&addressdetails=1&limit=8&accept-language=es",
		url.QueryEscape(q),
	)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("nominatim request: %w", err)
	}
	req.Header.Set("User-Agent", "Boogie/1.0 (contacto@boogie.com.ve)")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("nominatim status: %d", resp.StatusCode)
	}

	var data []nominatimResult
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	seen := make(map[string]bool)
	var results []models.LocationSuggestion

	for _, item := range data {
		typeKey := item.Type
		if typeKey == "" {
			typeKey = item.Class
		}

		tipo := nominatimTipos[typeKey]
		if tipo == "" && item.Class != "place" && item.Class != "boundary" {
			continue
		}
		if tipo == "" {
			if item.Class == "place" {
				tipo = "Lugar"
			} else {
				tipo = "Zona"
			}
		}

		parts := strings.Split(item.DisplayName, ",")
		nombre := strings.TrimSpace(parts[0])
		if nombre == "" {
			continue
		}

		detalle := buildNominatimDetalle(item.Address, nombre)

	var lat, lng float64
	_, _ = fmt.Sscanf(item.Lat, "%f", &lat)
	_, _ = fmt.Sscanf(item.Lon, "%f", &lng)

		key := fmt.Sprintf("%s-%.2f-%.2f", nombre, lat, lng)
		if seen[key] {
			continue
		}
		seen[key] = true

		results = append(results, models.LocationSuggestion{
			ID:      fmt.Sprintf("nom-%d", item.PlaceID),
			Nombre:  nombre,
			Detalle: detalle,
			Tipo:    tipo,
			Lat:     lat,
			Lng:     lng,
		})
	}

	return results, nil
}

func buildNominatimDetalle(addr map[string]string, nombre string) string {
	var parts []string

	if v, ok := addr["suburb"]; ok && v != nombre {
		parts = append(parts, v)
	}

	for _, key := range []string{"city", "town", "village"} {
		if v, ok := addr[key]; ok && v != nombre {
			parts = append(parts, v)
			break
		}
	}

	if state, ok := addr["state"]; ok && state != "" {
		found := false
		for _, p := range parts {
			if strings.Contains(p, state) {
				found = true
				break
			}
		}
		if !found {
			parts = append(parts, state)
		}
	}

	return strings.Join(parts, ", ")
}
