package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	bizerrors "github.com/boogie/backend/internal/domain/errors"
	"github.com/boogie/backend/internal/domain/models"
	"github.com/boogie/backend/internal/domain/util"
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
	CuponCodigo       string
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
	disponSvc *ReservaDisponibilidad
	cuponSvc  *CuponService
	comisionH float64
	comisionA float64
}

func NewReservaService(repo *repository.ReservaRepo, disponSvc *ReservaDisponibilidad, comisionH, comisionA float64) *ReservaService {
	return &ReservaService{
		repo:      repo,
		disponSvc: disponSvc,
		comisionH: comisionH,
		comisionA: comisionA,
	}
}

func (s *ReservaService) WithCuponService(svc *CuponService) *ReservaService {
	s.cuponSvc = svc
	return s
}

type CrearConPagoInput struct {
	PropiedadID       string
	HuespedID         string
	FechaEntrada      time.Time
	FechaSalida       time.Time
	CantidadHuespedes int
	NotasHuesped      *string
	Monto             float64
	Moneda            enums.Moneda
	MetodoPago        enums.MetodoPagoEnum
	Referencia        string
	ComprobanteURL    *string
	BancoEmisor       *string
	TelefonoEmisor    *string
	StoreItems        []repository.StoreItemInput
	CuponCodigo       string
}

func (s *ReservaService) CrearConPago(ctx context.Context, input *CrearConPagoInput) (*CrearReservaResult, error) {
	result, err := s.Crear(ctx, &CrearReservaInput{
		PropiedadID:       input.PropiedadID,
		HuespedID:         input.HuespedID,
		FechaEntrada:      input.FechaEntrada,
		FechaSalida:       input.FechaSalida,
		CantidadHuespedes: input.CantidadHuespedes,
		NotasHuesped:      input.NotasHuesped,
		CuponCodigo:       input.CuponCodigo,
	})
	if err != nil {
		return nil, err
	}

	_, err = s.repo.InsertPagoManual(ctx, &repository.NuevoPago{
		ReservaID:      result.Reserva.ID,
		UsuarioID:      input.HuespedID,
		Monto:          input.Monto,
		Moneda:         input.Moneda,
		MetodoPago:     input.MetodoPago,
		Referencia:     input.Referencia,
		ComprobanteURL: input.ComprobanteURL,
		BancoEmisor:    input.BancoEmisor,
		TelefonoEmisor: input.TelefonoEmisor,
	})
	if err != nil {
		return nil, fmt.Errorf("error al registrar pago: %w", err)
	}

	if len(input.StoreItems) > 0 {
		storeRepo := repository.NewStoreItemRepo(s.repo.Pool())
		if err := storeRepo.InsertBatch(ctx, input.StoreItems); err != nil {
			slog.Error("[reserva/crear-con-pago] store items error", "error", err)
		}
	}

	return result, nil
}

func (s *ReservaService) Crear(ctx context.Context, input *CrearReservaInput) (*CrearReservaResult, error) {
	prop, err := s.repo.GetPropiedadForReserva(ctx, input.PropiedadID)
	if err != nil {
		return nil, bizerrors.PropiedadNoEncontrada()
	}

	if prop.Estado != string(enums.EstadoPublicacionPublicada) {
		return nil, bizerrors.PropiedadNoPublicada()
	}

	if prop.PropietarioID == input.HuespedID {
		return nil, bizerrors.PropiedadPropia()
	}

	if input.CantidadHuespedes > prop.Capacidad {
		return nil, bizerrors.CapacidadExcedida(prop.Capacidad)
	}

	noches := int(time.Date(input.FechaSalida.Year(), input.FechaSalida.Month(), input.FechaSalida.Day(), 0, 0, 0, 0, time.UTC).
		Sub(time.Date(input.FechaEntrada.Year(), input.FechaEntrada.Month(), input.FechaEntrada.Day(), 0, 0, 0, 0, time.UTC)).Hours() / 24)
	if noches < prop.EstanciaMinima {
		return nil, bizerrors.EstanciaInvalida(fmt.Sprintf("estancia minima es de %d noches", prop.EstanciaMinima))
	}
	if prop.EstanciaMaxima > 0 && noches > prop.EstanciaMaxima {
		return nil, bizerrors.EstanciaInvalida(fmt.Sprintf("estancia maxima es de %d noches", prop.EstanciaMaxima))
	}

	now := time.Now()
	hoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	entrada := time.Date(input.FechaEntrada.Year(), input.FechaEntrada.Month(), input.FechaEntrada.Day(), 0, 0, 0, 0, input.FechaEntrada.Location())
	if entrada.Before(hoy) {
		return nil, bizerrors.FechaPasada()
	}

	salida := time.Date(input.FechaSalida.Year(), input.FechaSalida.Month(), input.FechaSalida.Day(), 0, 0, 0, 0, input.FechaSalida.Location())
	if !salida.After(entrada) {
		return nil, bizerrors.FechaSalidaInvalida()
	}

	if noches < 1 || noches > 365 {
		return nil, bizerrors.NochesFueraDeRango()
	}

	if s.disponSvc != nil {
		solapado, err := s.disponSvc.HaySolapamiento(ctx, input.PropiedadID, input.FechaEntrada, input.FechaSalida)
		if err != nil {
			return nil, fmt.Errorf("error al verificar disponibilidad: %w", err)
		}
		if solapado {
			return nil, bizerrors.EstadoInvalido("las fechas seleccionadas no estan disponibles")
		}
	}

	reserva, err := s.repo.Crear(ctx, prop, input.HuespedID, input.FechaEntrada, input.FechaSalida, input.CantidadHuespedes, input.NotasHuesped, s.comisionH, s.comisionA)
	if err != nil {
		return nil, fmt.Errorf("error al crear reserva: %w", err)
	}

	if input.CuponCodigo != "" && s.cuponSvc != nil {
		validado, cuponErr := s.cuponSvc.ValidarCupon(ctx, input.CuponCodigo, input.HuespedID, input.PropiedadID, reserva.Subtotal, reserva.Noches)
		if cuponErr != nil {
			slog.Warn("[reserva-service] cupón inválido, reserva creada sin descuento", "codigo", input.CuponCodigo, "error", cuponErr)
		} else {
			nuevoSubtotal := reserva.Subtotal - validado.Descuento
			if nuevoSubtotal < 0 {
				nuevoSubtotal = 0
			}
			nuevaComisionH := util.Round2(nuevoSubtotal * s.comisionH)
			nuevoTotal := util.Round2(nuevoSubtotal + nuevaComisionH)

			if updateErr := s.repo.UpdateCuponDescuento(ctx, reserva.ID, validado.ID, validado.Descuento, nuevoSubtotal, nuevaComisionH, nuevoTotal); updateErr != nil {
				slog.Error("[reserva-service] error al aplicar cupón", "error", updateErr)
			} else {
				reserva.Subtotal = nuevoSubtotal
				reserva.ComisionPlataforma = nuevaComisionH
				reserva.Total = nuevoTotal
				reserva.CuponID = &validado.ID
				reserva.Descuento = validado.Descuento

				if usoErr := s.cuponSvc.RegistrarUso(ctx, validado.ID, input.HuespedID, reserva.ID, validado.Descuento); usoErr != nil {
					slog.Error("[reserva-service] error al registrar uso de cupón", "error", usoErr)
				}
			}
		}
	}

	if err := s.repo.InsertNotificacion(ctx,
		"NUEVA_RESERVA",
		"Nueva reserva recibida",
		fmt.Sprintf("Tienes una nueva reserva para \"%s\"", prop.Titulo),
		prop.PropietarioID,
		"/dashboard/reservas-recibidas",
	); err != nil {
		slog.Error("[reserva-service] notificacion nueva reserva", "error", err)
	}

	return &CrearReservaResult{Reserva: reserva}, nil
}

func (s *ReservaService) ConfirmarORechazar(ctx context.Context, reservaID, userID string, accion TransicionEstado, motivo *string) error {
	detalle, err := s.repo.GetByID(ctx, reservaID)
	if err != nil {
		return bizerrors.ReservaNoEncontrada()
	}

	if detalle.PropietarioID != userID {
		return bizerrors.Permisos("no tienes permisos para esta accion")
	}

	if detalle.Estado != enums.EstadoReservaPendienteConfirm {
		return bizerrors.EstadoInvalido("la reserva no esta pendiente de confirmacion")
	}

	ventanaConfirmacion := 1 * time.Hour
	if detalle.FechaConfirmacion != nil {
		deadline := detalle.FechaConfirmacion.Add(ventanaConfirmacion)
		if time.Now().After(deadline) {
			if err := s.repo.Confirmar(ctx, reservaID); err != nil {
				return err
			}
			return bizerrors.EstadoInvalido("la ventana de 1 hora ha expirado, la reserva fue confirmada automaticamente")
		}
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
		if err := s.repo.InsertNotificacion(ctx,
			"RESERVA_CONFIRMADA",
			"Reserva confirmada",
			fmt.Sprintf("Tu reserva para \"%s\" ha sido confirmada", detalle.PropiedadTitulo),
			detalle.HuespedID,
			"/dashboard/mis-reservas",
		); err != nil {
			slog.Error("[reserva-service] notificacion confirmar", "error", err)
		}

	case TransicionRechazar:
		rechazosMes, err := s.repo.CountRechazosMes(ctx, userID)
		if err != nil {
			slog.Error("[reserva-service] count rechazos", "error", err)
			rechazosMes = 0
		}

		if rechazosMes >= 3 {
			penalty := (rechazosMes - 3 + 1) * 20
			slog.Warn("[reserva-service] anfitrion excedio rechazos mensuales",
				"userID", userID, "rechazos", rechazosMes, "penaltyPct", penalty)
			if err := s.repo.RegistrarPenalizacion(ctx, userID, float64(penalty), fmt.Sprintf("Rechazo #%d del mes - %d%% penalizacion", rechazosMes+1, penalty)); err != nil {
				slog.Error("[reserva-service] registrar penalizacion", "error", err)
			}
		}

		if err := s.repo.Rechazar(ctx, reservaID, motivoStr); err != nil {
			return err
		}

		if err := s.repo.RegistrarRechazo(ctx, userID, reservaID, motivoStr); err != nil {
			slog.Error("[reserva-service] registrar rechazo", "error", err)
		}

		if err := s.repo.InsertNotificacion(ctx,
			"RESERVA_RECHAZADA",
			"Reserva rechazada",
			fmt.Sprintf("Tu reserva para \"%s\" ha sido rechazada", detalle.PropiedadTitulo),
			detalle.HuespedID,
			"/dashboard/mis-reservas",
		); err != nil {
			slog.Error("[reserva-service] notificacion rechazar", "error", err)
		}

		if detalle.FechaConfirmacion != nil {
			slog.Info("[reserva-service] reserva con pago verificado rechazada - requiere reembolso",
				"reservaID", reservaID, "huespedID", detalle.HuespedID)
		}

	default:
		return bizerrors.AccionInvalida("accion invalida")
	}

	return nil
}

func (s *ReservaService) AutoConfirmarExpiradas(ctx context.Context) (int, error) {
	ventana := 1 * time.Hour
	ids, err := s.repo.GetReservasExpiradas(ctx, ventana)
	if err != nil {
		return 0, fmt.Errorf("auto-confirmar expiradas: %w", err)
	}

	confirmadas := 0
	for _, id := range ids {
		if err := s.repo.Confirmar(ctx, id); err != nil {
			slog.Error("[reserva-service] auto-confirmar", "error", err, "reservaID", id)
			continue
		}
		confirmadas++
		slog.Info("[reserva-service] reserva auto-confirmada por expiracion", "reservaID", id)
	}
	return confirmadas, nil
}

func (s *ReservaService) Cancelar(ctx context.Context, input *CancelarInput) (*ReembolsoCalculado, error) {
	detalle, err := s.repo.GetByID(ctx, input.ReservaID)
	if err != nil {
		return nil, bizerrors.ReservaNoEncontrada()
	}

	if detalle.Estado != enums.EstadoReservaPendiente && detalle.Estado != enums.EstadoReservaConfirmada {
		return nil, bizerrors.EstadoInvalido("la reserva no se puede cancelar en su estado actual")
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

		if err := s.repo.InsertNotificacion(ctx,
			"RESERVA_CANCELADA",
			"Reserva cancelada por el huesped",
			fmt.Sprintf("La reserva para \"%s\" ha sido cancelada", detalle.PropiedadTitulo),
			detalle.PropietarioID,
			"/dashboard/reservas-recibidas",
		); err != nil {
			slog.Error("[reserva-service] notificacion cancelar huesped", "error", err)
		}
	} else if detalle.PropietarioID == input.UserID {
		if err := s.repo.CancelarAnfitrion(ctx, input.ReservaID, motivoStr); err != nil {
			return nil, err
		}

		if err := s.repo.InsertNotificacion(ctx,
			"RESERVA_CANCELADA",
			"Reserva cancelada por el anfitrion",
			fmt.Sprintf("La reserva para \"%s\" ha sido cancelada por el anfitrion", detalle.PropiedadTitulo),
			detalle.HuespedID,
			"/dashboard/mis-reservas",
		); err != nil {
			slog.Error("[reserva-service] notificacion cancelar anfitrion", "error", err)
		}
	} else {
		return nil, bizerrors.Permisos("no tienes permisos para cancelar esta reserva")
	}

	return reembolso, nil
}

func (s *ReservaService) GetByID(ctx context.Context, reservaID, userID string) (*repository.ReservaDetalle, error) {
	detalle, err := s.repo.GetByID(ctx, reservaID)
	if err != nil {
		return nil, bizerrors.ReservaNoEncontrada()
	}

	if userID != "" && detalle.HuespedID != userID && detalle.PropietarioID != userID {
		return nil, bizerrors.Permisos("no tienes permisos para ver esta reserva")
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
		return nil, bizerrors.ReservaNoEncontrada()
	}

	if detalle.HuespedID != userID && detalle.PropietarioID != userID {
		return nil, bizerrors.Permisos("no tienes permisos")
	}

	return s.repo.GetPagosByReserva(ctx, reservaID)
}

func (s *ReservaService) RegistrarPago(ctx context.Context, pago *repository.NuevoPago, userID string) (string, error) {
	detalle, err := s.repo.GetByID(ctx, pago.ReservaID)
	if err != nil {
		return "", bizerrors.ReservaNoEncontrada()
	}

	if detalle.HuespedID != userID {
		return "", bizerrors.PagoSoloHuesped()
	}

	if !strings.EqualFold(string(detalle.Estado), string(enums.EstadoReservaPendiente)) &&
		!strings.EqualFold(string(detalle.Estado), string(enums.EstadoReservaConfirmada)) {
		slog.Warn("[reserva-service] pago registrado para reserva no pendiente/confirmada", "reservaId", pago.ReservaID, "estado", string(detalle.Estado))
	}

	return s.repo.InsertPagoManual(ctx, pago)
}

func (s *ReservaService) ListByPropiedad(ctx context.Context, propiedadID string, page, perPage int) ([]repository.ReservaConHuesped, int, error) {
	offset := (page - 1) * perPage
	return s.repo.ListByPropiedadID(ctx, propiedadID, perPage, offset)
}

func (s *ReservaService) ListPropiedadesModoReserva(ctx context.Context, propietarioID string) ([]repository.PropiedadModoReserva, error) {
	return s.repo.ListPropiedadesModoReserva(ctx, propietarioID)
}

func (s *ReservaService) UpdateModoReserva(ctx context.Context, propiedadID, propietarioID, modo string) error {
	return s.repo.UpdateModoReserva(ctx, propiedadID, propietarioID, modo)
}
