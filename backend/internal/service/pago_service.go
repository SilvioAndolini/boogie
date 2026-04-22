package service

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PagoRepository interface {
	GetMisPagos(ctx context.Context, userID string) ([]repository.PagoConReserva, error)
	GetByID(ctx context.Context, pagoID string) (*repository.PagoConReserva, error)
	GetReservaOwnerForPago(ctx context.Context, pagoID string) (reservaID, propietarioID, estadoReserva string, err error)
	Verificar(ctx context.Context, pagoID, verificadoPor, estado string, notas *string) error
	ConfirmarReserva(ctx context.Context, reservaID string) error
	ReservaBelongsToUser(ctx context.Context, reservaID, userID string) (bool, error)
	InsertPagoSimple(ctx context.Context, reservaID, usuarioID string, monto float64, moneda enums.Moneda, metodo enums.MetodoPagoEnum, referencia string) (string, error)
	InsertPagoConComprobante(ctx context.Context, reservaID, usuarioID string, monto float64, moneda enums.Moneda, metodo enums.MetodoPagoEnum, referencia string, comprobanteURL *string, bancoEmisor, telefonoEmisor *string) (string, error)
	GetWallet(ctx context.Context, userID string) (*repository.WalletData, error)
	CreateWallet(ctx context.Context, userID string) error
	InsertWalletTransaccion(ctx context.Context, walletID, tipo, descripcion string, montoUSD float64, referenciaID *string) (string, error)
	GetWalletTransacciones(ctx context.Context, walletID string) ([]repository.WalletTransaccion, error)
	VerificarWithDB(ctx context.Context, db repository.DBTX, pagoID, verificadoPor, estado string, notas *string) error
	GetReservaOwnerForPagoWithDB(ctx context.Context, db repository.DBTX, pagoID string) (reservaID, propietarioID, estadoReserva string, err error)
	ConfirmarReservaWithDB(ctx context.Context, db repository.DBTX, reservaID string) error
	Pool() *pgxpool.Pool
}

type PagoService struct {
	pagoRepo PagoRepository
}

func NewPagoService(pagoRepo PagoRepository) *PagoService {
	return &PagoService{pagoRepo: pagoRepo}
}

func (s *PagoService) GetMisPagos(ctx context.Context, userID string) ([]repository.PagoConReserva, error) {
	pagos, err := s.pagoRepo.GetMisPagos(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener pagos: %w", err)
	}
	if pagos == nil {
		pagos = []repository.PagoConReserva{}
	}
	return pagos, nil
}

func (s *PagoService) Verificar(ctx context.Context, pagoID, userID string, aprobado bool, notas *string) error {
	_, err := s.pagoRepo.GetByID(ctx, pagoID)
	if err != nil {
		return fmt.Errorf("pago no encontrado")
	}

	estado := "RECHAZADO"
	if aprobado {
		estado = "VERIFICADO"
	}

	return repository.WithTx(ctx, s.pagoRepo.Pool(), func(tx pgx.Tx) error {
		reservaID, propietarioID, estadoReserva, err := s.pagoRepo.GetReservaOwnerForPagoWithDB(ctx, tx, pagoID)
		if err != nil {
			return fmt.Errorf("reserva no encontrada para este pago")
		}

		if propietarioID != userID {
			return fmt.Errorf("sin permisos para verificar este pago")
		}

		if err := s.pagoRepo.VerificarWithDB(ctx, tx, pagoID, userID, estado, notas); err != nil {
			return fmt.Errorf("error al verificar pago: %w", err)
		}

		if aprobado && (estadoReserva == "PENDIENTE" || estadoReserva == "PENDIENTE_PAGO") {
			if err := s.pagoRepo.ConfirmarReservaWithDB(ctx, tx, reservaID); err != nil {
				return fmt.Errorf("pago verificado pero error al confirmar reserva: %w", err)
			}
		}

		return nil
	})
}

func (s *PagoService) RegistrarPagoSimple(ctx context.Context, reservaID, usuarioID string, monto float64, moneda enums.Moneda, metodo enums.MetodoPagoEnum, referencia string) (string, error) {
	belongs, err := s.pagoRepo.ReservaBelongsToUser(ctx, reservaID, usuarioID)
	if err != nil {
		return "", fmt.Errorf("error al verificar reserva: %w", err)
	}
	if !belongs {
		return "", fmt.Errorf("reserva no encontrada o no pertenece al usuario")
	}

	return s.pagoRepo.InsertPagoSimple(ctx, reservaID, usuarioID, monto, moneda, metodo, referencia)
}

func (s *PagoService) RegistrarPagoConComprobante(ctx context.Context, reservaID, usuarioID string, monto float64, moneda enums.Moneda, metodo enums.MetodoPagoEnum, referencia string, comprobanteURL *string, bancoEmisor, telefonoEmisor *string) (string, error) {
	belongs, err := s.pagoRepo.ReservaBelongsToUser(ctx, reservaID, usuarioID)
	if err != nil {
		return "", fmt.Errorf("error al verificar reserva: %w", err)
	}
	if !belongs {
		return "", fmt.Errorf("reserva no encontrada o no pertenece al usuario")
	}

	refParts := []string{referencia}
	if bancoEmisor != nil && *bancoEmisor != "" {
		refParts = append(refParts, fmt.Sprintf("Banco: %s", *bancoEmisor))
	}
	if telefonoEmisor != nil && *telefonoEmisor != "" {
		refParts = append(refParts, fmt.Sprintf("Tel: %s", *telefonoEmisor))
	}
	referenciaCompleta := strings.Join(refParts, " | ")

	return s.pagoRepo.InsertPagoConComprobante(ctx, reservaID, usuarioID, monto, moneda, metodo, referenciaCompleta, comprobanteURL, bancoEmisor, telefonoEmisor)
}

type WalletService struct {
	pagoRepo PagoRepository
}

func NewWalletService(pagoRepo PagoRepository) *WalletService {
	return &WalletService{pagoRepo: pagoRepo}
}

func (s *WalletService) GetWallet(ctx context.Context, userID string) (*repository.WalletData, error) {
	return s.pagoRepo.GetWallet(ctx, userID)
}

func (s *WalletService) Activar(ctx context.Context, userID string) error {
	existing, err := s.pagoRepo.GetWallet(ctx, userID)
	if err == nil && existing != nil {
		return fmt.Errorf("ya tienes una Boogie Wallet activa")
	}

	return s.pagoRepo.CreateWallet(ctx, userID)
}

func (s *WalletService) CrearRecarga(ctx context.Context, userID string, montoUSD float64, metodo string, datosPago map[string]string) (string, error) {
	if montoUSD <= 0 {
		return "", fmt.Errorf("monto invalido")
	}

	wallet, err := s.pagoRepo.GetWallet(ctx, userID)
	if err != nil || wallet == nil {
		return "", fmt.Errorf("no tienes una wallet activa")
	}

	desc := fmt.Sprintf("Recarga %s - Ref: %s", strings.ReplaceAll(metodo, "_", " "), datosPago["referencia"])
	if datosPago["referencia"] == "" {
		desc = fmt.Sprintf("Recarga %s - Ref: Pendiente", strings.ReplaceAll(metodo, "_", " "))
	}

	var refID *string
	if ref, ok := datosPago["referencia"]; ok && ref != "" {
		refID = &ref
	}

	return s.pagoRepo.InsertWalletTransaccion(ctx, wallet.ID, "RECARGA", desc, montoUSD, refID)
}

func (s *WalletService) GetTransacciones(ctx context.Context, walletID, userID string) ([]repository.WalletTransaccion, error) {
	wallet, err := s.pagoRepo.GetWallet(ctx, userID)
	if err != nil || wallet == nil {
		return nil, fmt.Errorf("wallet no encontrada")
	}

	if wallet.ID != walletID {
		return nil, fmt.Errorf("wallet no pertenece al usuario")
	}

	txs, err := s.pagoRepo.GetWalletTransacciones(ctx, walletID)
	if err != nil {
		return nil, err
	}
	if txs == nil {
		txs = []repository.WalletTransaccion{}
	}
	return txs, nil
}

type PaymentDataService struct{}

func NewPaymentDataService() *PaymentDataService {
	return &PaymentDataService{}
}

type PaymentData struct {
	TransferenciaBancaria map[string]string `json:"TRANSFERENCIA_BANCARIA"`
	PagoMovil             map[string]string `json:"PAGO_MOVIL"`
	Zelle                 map[string]string `json:"ZELLE"`
	EfectivoFarmatodo     map[string]string `json:"EFECTIVO_FARMATODO"`
	USDT                  map[string]string `json:"USDT"`
}

func (s *PaymentDataService) GetPaymentData() map[string]map[string]string {
	return map[string]map[string]string{
		"TRANSFERENCIA_BANCARIA": {
			"banco":   envOrDefault("PAYMENT_TRANSFERENCIA_BANCO", "Banco de Venezuela"),
			"cuenta":  envOrDefault("PAYMENT_TRANSFERENCIA_CUENTA", "XXXX-XXXX-XXXX-XXXX"),
			"titular": envOrDefault("PAYMENT_TRANSFERENCIA_TITULAR", "Boogie C.A."),
			"cedula":  envOrDefault("PAYMENT_TRANSFERENCIA_CEDULA", "J-XXXXXXXX"),
		},
		"PAGO_MOVIL": {
			"banco":    envOrDefault("PAYMENT_PAGO_MOVIL_BANCO", "Banco de Venezuela"),
			"telefono": envOrDefault("PAYMENT_PAGO_MOVIL_TELEFONO", "0414-XXX-XXXX"),
			"cedula":   envOrDefault("PAYMENT_PAGO_MOVIL_CEDULA", "J-XXXXXXXX"),
		},
		"ZELLE": {
			"email":  envOrDefault("PAYMENT_ZELLE_EMAIL", "pagos@boogie.app"),
			"nombre": envOrDefault("PAYMENT_ZELLE_NOMBRE", "Boogie CA"),
		},
		"EFECTIVO_FARMATODO": {
			"instrucciones": "Realiza el pago en cualquier farmacia Farmatodo indicando el numero de referencia.",
		},
		"USDT": {
			"red":       envOrDefault("PAYMENT_USDT_RED", "TRC-20 (Tron)"),
			"direccion": envOrDefault("PAYMENT_USDT_DIRECCION", "TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"),
		},
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
