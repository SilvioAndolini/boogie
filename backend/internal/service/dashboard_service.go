package service

import (
	"context"
	"fmt"

	"github.com/boogie/backend/internal/repository"
)

type DashboardService struct {
	repo *repository.DashboardRepo
}

func NewDashboardService(repo *repository.DashboardRepo) *DashboardService {
	return &DashboardService{repo: repo}
}

type DashboardData struct {
	Gastos            []repository.GastoMantenimiento `json:"gastos"`
	FechasBloqueadas  []repository.FechaBloqueada     `json:"fechasBloqueadas"`
	PreciosEspeciales []repository.PrecioEspecial     `json:"preciosEspeciales"`
	Reservas          []repository.ReservaDashboard   `json:"reservas"`
	Amenidades        []string                        `json:"amenidades"`
	KPIs              DashboardKPIs                   `json:"kpis"`
	IngresosByMonth   map[string]float64              `json:"ingresosByMonth"`
	GastosByMonth     map[string]float64              `json:"gastosByMonth"`
	Ocupadas          []Ocupada                       `json:"ocupadas"`
}

type DashboardKPIs struct {
	TotalIngresos       float64 `json:"totalIngresos"`
	TotalGastos         float64 `json:"totalGastos"`
	TotalGastosVes      float64 `json:"totalGastosVes"`
	Balance             float64 `json:"balance"`
	TotalReservas       int     `json:"totalReservas"`
	ReservasActivas     int     `json:"reservasActivas"`
	ReservasConfirmadas int     `json:"reservasConfirmadas"`
	TotalNoches         int     `json:"totalNoches"`
	TarifaPromedio      float64 `json:"tarifaPromedio"`
}

type Ocupada struct {
	FechaEntrada string  `json:"fecha_entrada"`
	FechaSalida  string  `json:"fecha_salida"`
	Estado       string  `json:"estado"`
	Huesped      *string `json:"huesped,omitempty"`
}

func (s *DashboardService) GetDashboard(ctx context.Context, propiedadID, userID string) (*DashboardData, error) {
	isOwner, err := s.repo.IsPropietario(ctx, propiedadID, userID)
	if err != nil {
		return nil, fmt.Errorf("error al verificar propiedad")
	}
	if !isOwner {
		return nil, fmt.Errorf("no eres propietario de esta propiedad")
	}

	gastos, err := s.repo.GetGastos(ctx, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener gastos: %w", err)
	}
	fechasBloqueadas, err := s.repo.GetFechasBloqueadas(ctx, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener fechas bloqueadas: %w", err)
	}
	preciosEspeciales, err := s.repo.GetPreciosEspeciales(ctx, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener precios especiales: %w", err)
	}
	reservas, err := s.repo.GetReservasDashboard(ctx, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener reservas: %w", err)
	}
	amenidades, err := s.repo.GetAmenidades(ctx, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener amenidades: %w", err)
	}

	var totalIngresos, totalGastos, totalGastosVes float64
	var totalNoches int
	reservasActivas := 0
	reservasConfirmadas := 0
	ingresosByMonth := map[string]float64{}
	gastosByMonth := map[string]float64{}

	activeStates := map[string]bool{"CONFIRMADA": true, "EN_CURSO": true, "COMPLETADA": true}

	for _, r := range reservas {
		if activeStates[r.Estado] {
			totalIngresos += r.MontoTotal
		}
		if r.Estado == "CONFIRMADA" || r.Estado == "EN_CURSO" {
			reservasActivas++
		}
		if r.Estado == "CONFIRMADA" {
			reservasConfirmadas++
		}
		if activeStates[r.Estado] {
			totalNoches += r.Noches
			if len(r.FechaEntrada) >= 7 {
				key := r.FechaEntrada[:7]
				ingresosByMonth[key] += r.MontoTotal
			}
		}
	}

	for _, g := range gastos {
		if g.Moneda == "USD" {
			totalGastos += g.Monto
		} else if g.Moneda == "VES" {
			totalGastosVes += g.Monto
		}
		fechaStr := g.Fecha.Format("2006-01-02")
		if len(fechaStr) >= 7 {
			key := fechaStr[:7]
			if g.Moneda == "USD" {
				gastosByMonth[key] += g.Monto
			}
		}
	}

	var ocupadas []Ocupada
	for _, r := range reservas {
		var huesped *string
		if r.Huesped != nil {
			name := fmt.Sprintf("%s %s", r.Huesped.Nombre, r.Huesped.Apellido)
			huesped = &name
		}
		ocupadas = append(ocupadas, Ocupada{
			FechaEntrada: r.FechaEntrada,
			FechaSalida:  r.FechaSalida,
			Estado:       r.Estado,
			Huesped:      huesped,
		})
	}
	if ocupadas == nil {
		ocupadas = []Ocupada{}
	}

	tarifaPromedio := float64(0)
	if totalNoches > 0 {
		tarifaPromedio = totalIngresos / float64(totalNoches)
	}

	return &DashboardData{
		Gastos:            gastos,
		FechasBloqueadas:  fechasBloqueadas,
		PreciosEspeciales: preciosEspeciales,
		Reservas:          reservas,
		Amenidades:        amenidades,
		KPIs: DashboardKPIs{
			TotalIngresos:       totalIngresos,
			TotalGastos:         totalGastos,
			TotalGastosVes:      totalGastosVes,
			Balance:             totalIngresos - totalGastos,
			TotalReservas:       len(reservas),
			ReservasActivas:     reservasActivas,
			ReservasConfirmadas: reservasConfirmadas,
			TotalNoches:         totalNoches,
			TarifaPromedio:      tarifaPromedio,
		},
		IngresosByMonth: ingresosByMonth,
		GastosByMonth:   gastosByMonth,
		Ocupadas:        ocupadas,
	}, nil
}

func (s *DashboardService) CrearGasto(ctx context.Context, propiedadID, userID, descripcion string, monto float64, moneda, categoria, fecha string) (*repository.GastoMantenimiento, error) {
	isOwner, err := s.repo.IsPropietario(ctx, propiedadID, userID)
	if err != nil {
		return nil, fmt.Errorf("error al verificar propiedad")
	}
	if !isOwner {
		return nil, fmt.Errorf("no eres propietario de esta propiedad")
	}
	if descripcion == "" || monto <= 0 || categoria == "" {
		return nil, fmt.Errorf("todos los campos son requeridos")
	}
	if moneda == "" {
		moneda = "USD"
	}
	return s.repo.InsertGasto(ctx, propiedadID, descripcion, monto, moneda, categoria, fecha)
}

func (s *DashboardService) EliminarGasto(ctx context.Context, gastoID, propiedadID, userID string) error {
	isOwner, err := s.repo.IsPropietario(ctx, propiedadID, userID)
	if err != nil {
		return fmt.Errorf("error al verificar propiedad")
	}
	if !isOwner {
		return fmt.Errorf("no eres propietario de esta propiedad")
	}
	return s.repo.DeleteGasto(ctx, gastoID, propiedadID)
}
