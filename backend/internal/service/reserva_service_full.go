package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/domain/models"
	"github.com/boogie/backend/internal/repository"
)

type TransicionEstado string

const (
	TransicionConfirmar TransicionEstado = "confirmar"
	TransicionRechazar  TransicionEstado = "rechazar"
)

type CrearReservaInput struct {
	PropiedadID       string
	HuespedID         string
	FechaEntrada      time.Time
	FechaSalida       time.Time
	CantidadHuespedes int
	NotasHuesped      *string
}

type CrearReservaResult struct {
	Reserva *models.Reserva
}

type CancelarInput struct {
	ReservaID string
	UserID    string
	Motivo    *string
}

type ReservaService struct {
	repo      *repository.ReservaRepo
	comisionH float64
	comisionA float64
}

func NewReservaService(repo *repository.ReservaRepo, comisionH, comisionA float64) *ReservaService {
	return &ReservaService{
		repo:      repo,
		comisionH: comisionH,
		comisionA: comisionA,
	}
}

func (s *ReservaService) Crear(ctx context.Context, input *CrearReservaInput) (*CrearReservaResult, error) {
	prop, err := s.repo.GetPropiedadForReserva(ctx, input.PropiedadID)
	if err != nil {
		return nil, fmt.Errorf("propiedad no encontrada")
	}

	if prop.Estado != string(enums.EstadoPublicacionPublicada) {
		return nil, fmt.Errorf("la propiedad no esta publicada")
	}

	if prop.PropietarioID == input.HuespedID {
		return nil, fmt.Errorf("no puedes reservar tu propia propiedad")
	}

	if input.CantidadHuespedes > prop.Capacidad {
		return nil, fmt.Errorf("capacidad maxima es %d huespedes", prop.Capacidad)
	}

	noches := int(time.Date(input.FechaSalida.Year(), input.FechaSalida.Month(), input.FechaSalida.Day(), 0, 0, 0, 0, time.UTC).
		Sub(time.Date(input.FechaEntrada.Year(), input.FechaEntrada.Month(), input.FechaEntrada.Day(), 0, 0, 0, 0, time.UTC)).Hours() / 24)
	if noches < prop.EstanciaMinima {
		return nil, fmt.Errorf("estancia minima es de %d noches", prop.EstanciaMinima)
	}
	if prop.EstanciaMaxima > 0 && noches > prop.EstanciaMaxima {
		return nil, fmt.Errorf("estancia maxima es de %d noches", prop.EstanciaMaxima)
	}

	now := time.Now()
	hoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	entrada := time.Date(input.FechaEntrada.Year(), input.FechaEntrada.Month(), input.FechaEntrada.Day(), 0, 0, 0, 0, input.FechaEntrada.Location())
	if entrada.Before(hoy) {
		return nil, fmt.Errorf("la fecha de entrada no puede ser en el pasado")
	}

	salida := time.Date(input.FechaSalida.Year(), input.FechaSalida.Month(), input.FechaSalida.Day(), 0, 0, 0, 0, input.FechaSalida.Location())
	if !salida.After(entrada) {
		return nil, fmt.Errorf("la fecha de salida debe ser posterior a la de entrada")
	}

	if noches < 1 || noches > 365 {
		return nil, fmt.Errorf("estancia debe ser entre 1 y 365 noches")
	}

	reserva, err := s.repo.Crear(ctx, prop, input.HuespedID, input.FechaEntrada, input.FechaSalida, input.CantidadHuespedes, input.NotasHuesped, s.comisionH, s.comisionA)
	if err != nil {
		return nil, fmt.Errorf("error al crear reserva: %w", err)
	}

	_ = s.repo.InsertNotificacion(ctx,
		"NUEVA_RESERVA",
		"Nueva reserva recibida",
		fmt.Sprintf("Tienes una nueva reserva para \"%s\"", prop.Titulo),
		prop.PropietarioID,
		"/dashboard/reservas-recibidas",
	)

	return &CrearReservaResult{Reserva: reserva}, nil
}

func (s *ReservaService) ConfirmarORechazar(ctx context.Context, reservaID, userID string, accion TransicionEstado, motivo *string) error {
	detalle, err := s.repo.GetByID(ctx, reservaID)
	if err != nil {
		return fmt.Errorf("reserva no encontrada")
	}

	if detalle.PropietarioID != userID {
		return fmt.Errorf("no tienes permisos para esta accion")
	}

	if detalle.Estado != enums.EstadoReservaPendiente {
		return fmt.Errorf("la reserva no esta en estado PENDIENTE")
	}

	motivoStr := ""
	if motivo != nil {
		motivoStr = *motivo
	}

	switch accion {
	case TransicionConfirmar:
		if err := s.repo.Confirmar(ctx, reservaID); err != nil {
			return err
		}
		_ = s.repo.InsertNotificacion(ctx,
			"RESERVA_CONFIRMADA",
			"Reserva confirmada",
			fmt.Sprintf("Tu reserva para \"%s\" ha sido confirmada", detalle.PropiedadTitulo),
			detalle.HuespedID,
			"/dashboard/mis-reservas",
		)
	case TransicionRechazar:
		if err := s.repo.Rechazar(ctx, reservaID, motivoStr); err != nil {
			return err
		}
		_ = s.repo.InsertNotificacion(ctx,
			"RESERVA_RECHAZADA",
			"Reserva rechazada",
			fmt.Sprintf("Tu reserva para \"%s\" ha sido rechazada", detalle.PropiedadTitulo),
			detalle.HuespedID,
			"/dashboard/mis-reservas",
		)
	default:
		return fmt.Errorf("accion invalida")
	}

	return nil
}

func (s *ReservaService) Cancelar(ctx context.Context, input *CancelarInput) (*ReembolsoCalculado, error) {
	detalle, err := s.repo.GetByID(ctx, input.ReservaID)
	if err != nil {
		return nil, fmt.Errorf("reserva no encontrada")
	}

	if detalle.Estado != enums.EstadoReservaPendiente && detalle.Estado != enums.EstadoReservaConfirmada {
		return nil, fmt.Errorf("la reserva no se puede cancelar en su estado actual")
	}

	motivoStr := "Sin motivo"
	if input.Motivo != nil && *input.Motivo != "" {
		motivoStr = *input.Motivo
	}

	var reembolso *ReembolsoCalculado

	if detalle.HuespedID == input.UserID {
		if err := s.repo.CancelarHuesped(ctx, input.ReservaID, motivoStr); err != nil {
			return nil, err
		}
		politica := enums.PoliticaCancelacion(detalle.PoliticaCancelacion)
		reembolsoResult := CalcularReembolso(detalle.Total, detalle.ComisionPlataforma, politica, detalle.FechaEntrada)
		reembolso = &reembolsoResult

		_ = s.repo.InsertNotificacion(ctx,
			"RESERVA_CANCELADA",
			"Reserva cancelada por el huesped",
			fmt.Sprintf("La reserva para \"%s\" ha sido cancelada", detalle.PropiedadTitulo),
			detalle.PropietarioID,
			"/dashboard/reservas-recibidas",
		)
	} else if detalle.PropietarioID == input.UserID {
		if err := s.repo.CancelarAnfitrion(ctx, input.ReservaID, motivoStr); err != nil {
			return nil, err
		}

		_ = s.repo.InsertNotificacion(ctx,
			"RESERVA_CANCELADA",
			"Reserva cancelada por el anfitrion",
			fmt.Sprintf("La reserva para \"%s\" ha sido cancelada por el anfitrion", detalle.PropiedadTitulo),
			detalle.HuespedID,
			"/dashboard/mis-reservas",
		)
	} else {
		return nil, fmt.Errorf("no tienes permisos para cancelar esta reserva")
	}

	return reembolso, nil
}

func (s *ReservaService) GetByID(ctx context.Context, reservaID, userID string) (*repository.ReservaDetalle, error) {
	detalle, err := s.repo.GetByID(ctx, reservaID)
	if err != nil {
		return nil, fmt.Errorf("reserva no encontrada")
	}

	if userID != "" && detalle.HuespedID != userID && detalle.PropietarioID != userID {
		return nil, fmt.Errorf("no tienes permisos para ver esta reserva")
	}

	return detalle, nil
}

func (s *ReservaService) ListByHuesped(ctx context.Context, huespedID string, page, perPage int) ([]repository.ReservaConPropiedad, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage
	return s.repo.ListByHuesped(ctx, huespedID, perPage, offset)
}

func (s *ReservaService) ListByPropietario(ctx context.Context, propietarioID, estado string, page, perPage int) ([]repository.ReservaConHuesped, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage
	return s.repo.ListByPropietario(ctx, propietarioID, estado, perPage, offset)
}

func (s *ReservaService) GetStats(ctx context.Context, userID string, esPropietario bool) (*repository.ReservasStats, error) {
	return s.repo.GetStats(ctx, userID, esPropietario)
}

func (s *ReservaService) GetPagos(ctx context.Context, reservaID, userID string) ([]repository.PagoResumen, error) {
	detalle, err := s.repo.GetByID(ctx, reservaID)
	if err != nil {
		return nil, fmt.Errorf("reserva no encontrada")
	}

	if detalle.HuespedID != userID && detalle.PropietarioID != userID {
		return nil, fmt.Errorf("no tienes permisos")
	}

	return s.repo.GetPagosByReserva(ctx, reservaID)
}

func (s *ReservaService) RegistrarPago(ctx context.Context, pago *repository.NuevoPago, userID string) (string, error) {
	detalle, err := s.repo.GetByID(ctx, pago.ReservaID)
	if err != nil {
		return "", fmt.Errorf("reserva no encontrada")
	}

	if detalle.HuespedID != userID {
		return "", fmt.Errorf("solo el huesped puede registrar pagos")
	}

	if !strings.EqualFold(string(detalle.Estado), string(enums.EstadoReservaPendiente)) &&
		!strings.EqualFold(string(detalle.Estado), string(enums.EstadoReservaConfirmada)) {
		slog.Warn("pago registrado para reserva no pendiente/confirmada", "reservaId", pago.ReservaID, "estado", string(detalle.Estado))
	}

	return s.repo.InsertPagoManual(ctx, pago)
}
