package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/boogie/backend/internal/domain/util"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/repository/admin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CuponAdminRepository interface {
	GetCuponByCodigo(ctx context.Context, codigo string) (*admin.Cupon, error)
	Pool() *pgxpool.Pool
}

type CuponService struct {
	repo CuponAdminRepository
}

func NewCuponService(repo CuponAdminRepository) *CuponService {
	return &CuponService{repo: repo}
}

type CuponValidado struct {
	ID             string   `json:"id"`
	Codigo         string   `json:"codigo"`
	Nombre         string   `json:"nombre"`
	TipoDescuento  string   `json:"tipo_descuento"`
	ValorDescuento float64  `json:"valor_descuento"`
	Moneda         string   `json:"moneda"`
	MaxDescuento   *float64 `json:"max_descuento"`
	Descuento      float64  `json:"descuento"`
	SubtotalNuevo  float64  `json:"subtotal_nuevo"`
}

func (s *CuponService) ValidarCupon(ctx context.Context, codigo, usuarioID, propiedadID string, montoTotal float64, noches int) (*CuponValidado, error) {
	cupon, err := s.repo.GetCuponByCodigo(ctx, codigo)
	if err != nil {
		return nil, fmt.Errorf("cupón no encontrado")
	}

	if !cupon.Activo {
		return nil, fmt.Errorf("cupón inactivo")
	}

	now := time.Now()
	if now.Before(cupon.FechaInicio) || now.After(cupon.FechaFin) {
		return nil, fmt.Errorf("cupón fuera de vigencia")
	}

	if cupon.MaxUsos != nil && cupon.UsosActuales >= *cupon.MaxUsos {
		return nil, fmt.Errorf("cupón ha alcanzado el máximo de usos")
	}

	var vecesUsado int
	_ = s.repo.Pool().QueryRow(ctx,
		`SELECT COUNT(*) FROM cupon_usos WHERE cupon_id = $1 AND usuario_id = $2`,
		cupon.ID, usuarioID,
	).Scan(&vecesUsado)
	if cupon.MaxUsosPorUsuario > 0 && vecesUsado >= cupon.MaxUsosPorUsuario {
		return nil, fmt.Errorf("ya usaste este cupón el máximo de veces permitido")
	}

	if cupon.MinCompra != nil && montoTotal < *cupon.MinCompra {
		return nil, fmt.Errorf("compra mínima de %.2f requerida", *cupon.MinCompra)
	}
	if cupon.MinNoches != nil && noches < *cupon.MinNoches {
		return nil, fmt.Errorf("estancia mínima de %d noches requerida", *cupon.MinNoches)
	}

	var descuento float64
	switch cupon.TipoDescuento {
	case "PORCENTAJE":
		descuento = util.Round2(montoTotal * cupon.ValorDescuento / 100)
		if cupon.MaxDescuento != nil && descuento > *cupon.MaxDescuento {
			descuento = *cupon.MaxDescuento
		}
	case "MONTO_FIJO":
		descuento = cupon.ValorDescuento
		if descuento > montoTotal {
			descuento = montoTotal
		}
	case "NOCHES_GRATIS":
		nochesGratis := int(math.Min(cupon.ValorDescuento, float64(noches)))
		if nochesGratis > 0 && montoTotal > 0 && noches > 0 {
			precioPorNoche := montoTotal / float64(noches)
			descuento = util.Round2(precioPorNoche * float64(nochesGratis))
		}
	default:
		return nil, fmt.Errorf("tipo de descuento no soportado")
	}

	subtotalNuevo := montoTotal - descuento
	if subtotalNuevo < 0 {
		subtotalNuevo = 0
	}

	return &CuponValidado{
		ID:             cupon.ID,
		Codigo:         cupon.Codigo,
		Nombre:         cupon.Nombre,
		TipoDescuento:  cupon.TipoDescuento,
		ValorDescuento: cupon.ValorDescuento,
		Moneda:         cupon.Moneda,
		MaxDescuento:   cupon.MaxDescuento,
		Descuento:      descuento,
		SubtotalNuevo:  subtotalNuevo,
	}, nil
}

func (s *CuponService) RegistrarUsoWithDB(ctx context.Context, db repository.DBTX, cuponID, usuarioID, reservaID string, descuento float64) error {
	_, err := db.Exec(ctx,
		`INSERT INTO cupon_usos (cupon_id, usuario_id, reserva_id, descuento_aplicado, fecha_uso)
		 VALUES ($1, $2, $3, $4, NOW())`,
		cuponID, usuarioID, reservaID, descuento)
	if err != nil {
		return fmt.Errorf("error al registrar uso de cupón: %w", err)
	}

	_, err = db.Exec(ctx,
		`UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`,
		cuponID)
	if err != nil {
		return fmt.Errorf("error al incrementar usos del cupón: %w", err)
	}

	return nil
}

func (s *CuponService) RegistrarUso(ctx context.Context, cuponID, usuarioID, reservaID string, descuento float64) error {
	_, err := s.repo.Pool().Exec(ctx,
		`INSERT INTO cupon_usos (cupon_id, usuario_id, reserva_id, descuento_aplicado, fecha_uso)
		 VALUES ($1, $2, $3, $4, NOW())`,
		cuponID, usuarioID, reservaID, descuento)
	if err != nil {
		return fmt.Errorf("error al registrar uso de cupón: %w", err)
	}

	_, err = s.repo.Pool().Exec(ctx,
		`UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`,
		cuponID)
	if err != nil {
		return fmt.Errorf("error al incrementar usos del cupón: %w", err)
	}

	return nil
}
