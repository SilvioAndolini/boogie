package service

import (
	"context"
	"fmt"
	"time"

	"github.com/boogie/backend/internal/repository"
)

type DisponibilidadResult struct {
	Disponible bool
	Conflicto  *Conflicto
}

type Conflicto struct {
	Tipo             string
	ReservaID        string
	FechaBloqueadaID string
}

type DisponibilidadRepository interface {
	FindConflictingReserva(ctx context.Context, propiedadID string, entrada, salida time.Time) (string, error)
	FindFechaBloqueada(ctx context.Context, propiedadID string, entrada, salida time.Time) (string, error)
	GetPropiedadBasica(ctx context.Context, propiedadID string) (id, titulo string, precio float64, moneda, propietarioID string, err error)
	ListFechasOcupadas(ctx context.Context, propiedadID string) ([]repository.FechaOcupadaRow, []repository.FechaOcupadaRow, error)
	ExistsSolapamiento(ctx context.Context, propiedadID string, entrada, salida time.Time) (bool, error)
}

type ReservaDisponibilidad struct {
	repo DisponibilidadRepository
}

func NewReservaDisponibilidad(repo DisponibilidadRepository) *ReservaDisponibilidad {
	return &ReservaDisponibilidad{repo: repo}
}

func (r *ReservaDisponibilidad) Verificar(ctx context.Context, propiedadID string, fechaEntrada, fechaSalida time.Time) (*DisponibilidadResult, error) {
	reservaID, err := r.repo.FindConflictingReserva(ctx, propiedadID, fechaEntrada, fechaSalida)
	if err != nil {
		return nil, fmt.Errorf("checking reserva conflicts: %w", err)
	}
	if reservaID != "" {
		return &DisponibilidadResult{
			Disponible: false,
			Conflicto: &Conflicto{
				Tipo:      "RESERVA_EXISTENTE",
				ReservaID: reservaID,
			},
		}, nil
	}

	bloqueadaID, err := r.repo.FindFechaBloqueada(ctx, propiedadID, fechaEntrada, fechaSalida)
	if err != nil {
		return nil, fmt.Errorf("checking blocked dates: %w", err)
	}
	if bloqueadaID != "" {
		return &DisponibilidadResult{
			Disponible: false,
			Conflicto: &Conflicto{
				Tipo:             "FECHA_BLOQUEADA",
				FechaBloqueadaID: bloqueadaID,
			},
		}, nil
	}

	return &DisponibilidadResult{Disponible: true}, nil
}

func (r *ReservaDisponibilidad) ObtenerPropiedad(ctx context.Context, propiedadID string) (id, titulo string, precio float64, moneda, propietarioID string, err error) {
	return r.repo.GetPropiedadBasica(ctx, propiedadID)
}

type FechaOcupada struct {
	Inicio time.Time `json:"inicio"`
	Fin    time.Time `json:"fin"`
	Estado string    `json:"estado"`
}

func (r *ReservaDisponibilidad) ObtenerFechasOcupadas(ctx context.Context, propiedadID string) ([]FechaOcupada, error) {
	reservas, bloqueadas, err := r.repo.ListFechasOcupadas(ctx, propiedadID)
	if err != nil {
		return nil, err
	}

	var results []FechaOcupada
	for _, f := range reservas {
		results = append(results, FechaOcupada{Inicio: f.Inicio, Fin: f.Fin, Estado: f.Estado})
	}
	for _, f := range bloqueadas {
		results = append(results, FechaOcupada{Inicio: f.Inicio, Fin: f.Fin, Estado: f.Estado})
	}

	if results == nil {
		results = []FechaOcupada{}
	}
	return results, nil
}

func (r *ReservaDisponibilidad) HaySolapamiento(ctx context.Context, propiedadID string, fechaEntrada, fechaSalida time.Time) (bool, error) {
	return r.repo.ExistsSolapamiento(ctx, propiedadID, fechaEntrada, fechaSalida)
}
