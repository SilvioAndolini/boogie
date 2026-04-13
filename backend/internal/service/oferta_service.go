package service

import (
	"context"
	"fmt"
	"time"

	"github.com/boogie/backend/internal/repository"
)

type OfertaService struct {
	repo *repository.OfertaRepo
}

func NewOfertaService(repo *repository.OfertaRepo) *OfertaService {
	return &OfertaService{repo: repo}
}

type CrearOfertaInput struct {
	PropiedadID       string
	HuespedID         string
	FechaEntrada      time.Time
	FechaSalida       time.Time
	CantidadHuespedes int
	PrecioOfertado    float64
	Moneda            string
	Mensaje           *string
}

func (s *OfertaService) Crear(ctx context.Context, input *CrearOfertaInput) (string, error) {
	precio, moneda, capacidad, estanciaMin, estanciaMax, propietarioID, err := s.repo.GetPropiedadPrecio(ctx, input.PropiedadID)
	if err != nil {
		return "", fmt.Errorf("propiedad no disponible")
	}

	if propietarioID == input.HuespedID {
		return "", fmt.Errorf("no puedes ofertar en tu propia propiedad")
	}

	noches := int(time.Date(input.FechaSalida.Year(), input.FechaSalida.Month(), input.FechaSalida.Day(), 0, 0, 0, 0, time.UTC).
		Sub(time.Date(input.FechaEntrada.Year(), input.FechaEntrada.Month(), input.FechaEntrada.Day(), 0, 0, 0, 0, time.UTC)).Hours() / 24)
	if noches < 1 {
		noches = 1
	}

	if input.CantidadHuespedes > capacidad {
		return "", fmt.Errorf("máximo %d huéspedes", capacidad)
	}
	if noches < estanciaMin {
		return "", fmt.Errorf("estancia mínima de %d noches", estanciaMin)
	}
	if estanciaMax != nil && noches > *estanciaMax {
		return "", fmt.Errorf("estancia máxima de %d noches", *estanciaMax)
	}

	precioOriginal := precio * float64(noches)

	if input.PrecioOfertado > precioOriginal*1.1 {
		return "", fmt.Errorf("la oferta no puede superar el precio original ($%.2f)", precioOriginal)
	}
	if input.PrecioOfertado < precioOriginal*0.3 {
		return "", fmt.Errorf("la oferta es demasiado baja (mínimo 30%% del precio original)")
	}

	exists, err := s.repo.ExistsActive(ctx, input.PropiedadID, input.HuespedID)
	if err != nil {
		return "", fmt.Errorf("error al verificar oferta existente")
	}
	if exists {
		return "", fmt.Errorf("ya tienes una oferta activa para esta propiedad")
	}

	monedas := input.Moneda
	if monedas == "" {
		monedas = moneda
	}

	oferta := &repository.Oferta{
		PropiedadID:       input.PropiedadID,
		HuespedID:         input.HuespedID,
		FechaEntrada:      input.FechaEntrada,
		FechaSalida:       input.FechaSalida,
		Noches:            noches,
		CantidadHuespedes: input.CantidadHuespedes,
		PrecioOriginal:    precioOriginal,
		PrecioOfertado:    input.PrecioOfertado,
		Moneda:            monedas,
		Mensaje:           input.Mensaje,
	}
	return s.repo.Crear(ctx, oferta)
}

func (s *OfertaService) Responder(ctx context.Context, ofertaID, userID, accion string, motivoRechazo *string) error {
	oferta, err := s.repo.GetByID(ctx, ofertaID)
	if err != nil {
		return fmt.Errorf("oferta no encontrada")
	}
	if oferta.Estado != "PENDIENTE" {
		return fmt.Errorf("esta oferta ya fue respondida")
	}

	propietarioID, err := s.repo.GetPropietarioID(ctx, oferta.PropiedadID)
	if err != nil || propietarioID != userID {
		return fmt.Errorf("solo el anfitrión puede responder")
	}

	if accion != "ACEPTADA" && accion != "RECHAZADA" {
		return fmt.Errorf("acción inválida")
	}

	return s.repo.Responder(ctx, ofertaID, accion, motivoRechazo)
}

func (s *OfertaService) GetRecibidas(ctx context.Context, userID string) ([]repository.OfertaConPropiedad, error) {
	ofertas, err := s.repo.GetRecibidas(ctx, userID)
	if err != nil {
		return nil, err
	}
	if ofertas == nil {
		ofertas = []repository.OfertaConPropiedad{}
	}
	return ofertas, nil
}

func (s *OfertaService) GetEnviadas(ctx context.Context, userID string) ([]repository.OfertaConPropiedad, error) {
	ofertas, err := s.repo.GetEnviadas(ctx, userID)
	if err != nil {
		return nil, err
	}
	if ofertas == nil {
		ofertas = []repository.OfertaConPropiedad{}
	}
	return ofertas, nil
}

func (s *OfertaService) GetByID(ctx context.Context, ofertaID, userID string) (*repository.Oferta, error) {
	oferta, err := s.repo.GetByID(ctx, ofertaID)
	if err != nil {
		return nil, fmt.Errorf("oferta no encontrada")
	}
	propietarioID, _ := s.repo.GetPropietarioID(ctx, oferta.PropiedadID)
	if oferta.HuespedID != userID && propietarioID != userID {
		return nil, fmt.Errorf("no tienes permiso para ver esta oferta")
	}
	return oferta, nil
}
