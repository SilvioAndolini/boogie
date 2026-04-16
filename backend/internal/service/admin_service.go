package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/boogie/backend/internal/repository"
)

type AdminService struct {
	repo *repository.AdminRepo
}

func NewAdminService(repo *repository.AdminRepo) *AdminService {
	return &AdminService{repo: repo}
}

type PaginatedResult struct {
	Data         interface{} `json:"data"`
	Total        int         `json:"total"`
	Pagina       int         `json:"pagina"`
	TotalPaginas int         `json:"totalPaginas"`
}

func paginated(data interface{}, total, pagina, limite int) *PaginatedResult {
	return &PaginatedResult{
		Data:         data,
		Total:        total,
		Pagina:       pagina,
		TotalPaginas: (total + limite - 1) / limite,
	}
}

func (s *AdminService) GetReservas(ctx context.Context, estado, busqueda string, pagina int) (*PaginatedResult, error) {
	limite := 30
	if pagina < 1 {
		pagina = 1
	}
	reservas, total, err := s.repo.GetReservasAdmin(ctx, estado, busqueda, pagina, limite)
	if err != nil {
		return nil, fmt.Errorf("error al obtener reservas")
	}
	return paginated(reservas, total, pagina, limite), nil
}

func (s *AdminService) GetReservasStats(ctx context.Context) (map[string]int, error) {
	return s.repo.GetReservasStats(ctx)
}

func (s *AdminService) AccionReserva(ctx context.Context, reservaID, accion, userID string) error {
	res, err := s.repo.GetReservaByID(ctx, reservaID)
	if err != nil {
		return fmt.Errorf("reserva no encontrada")
	}

	transiciones := map[string][]string{
		"PENDIENTE":  {"CONFIRMADA", "RECHAZADA"},
		"CONFIRMADA": {"CANCELADA_ANFITRION"},
		"EN_CURSO":   {"COMPLETADA"},
	}

	var nuevoEstado string
	switch accion {
	case "confirmar":
		nuevoEstado = "CONFIRMADA"
	case "rechazar":
		nuevoEstado = "RECHAZADA"
	case "cancelar":
		nuevoEstado = "CANCELADA_ANFITRION"
	default:
		return fmt.Errorf("acción inválida")
	}

	permitidos, ok := transiciones[res.Estado]
	if !ok {
		return fmt.Errorf("no se puede cambiar desde el estado %s", res.Estado)
	}

	valido := false
	for _, e := range permitidos {
		if e == nuevoEstado {
			valido = true
			break
		}
	}
	if !valido {
		return fmt.Errorf("no se puede cambiar de %s a %s", res.Estado, nuevoEstado)
	}

	var confirmacion, cancelacion *time.Time
	now := time.Now()
	if nuevoEstado == "CONFIRMADA" {
		confirmacion = &now
	}
	if nuevoEstado == "CANCELADA_ANFITRION" || nuevoEstado == "RECHAZADA" {
		cancelacion = &now
	}

	return s.repo.UpdateReservaEstado(ctx, reservaID, nuevoEstado, confirmacion, cancelacion)
}

func (s *AdminService) GetPagos(ctx context.Context, estado, metodoPago, busqueda string, pagina int) (*PaginatedResult, error) {
	limite := 30
	if pagina < 1 {
		pagina = 1
	}
	pagos, total, err := s.repo.GetPagosAdmin(ctx, estado, metodoPago, busqueda, pagina, limite)
	if err != nil {
		return nil, fmt.Errorf("error al obtener pagos")
	}
	return paginated(pagos, total, pagina, limite), nil
}

func (s *AdminService) GetPagosStats(ctx context.Context) (map[string]int, error) {
	return s.repo.GetPagosStats(ctx)
}

func (s *AdminService) VerificarPago(ctx context.Context, pagoID, nuevoEstado string, notas *string) error {
	estadoActual, err := s.repo.GetPagoEstado(ctx, pagoID)
	if err != nil {
		return fmt.Errorf("pago no encontrado")
	}

	transiciones := map[string][]string{
		"PENDIENTE":       {"VERIFICADO", "RECHAZADO"},
		"EN_VERIFICACION": {"VERIFICADO", "RECHAZADO"},
		"VERIFICADO":      {"ACREDITADO", "RECHAZADO"},
	}

	permitidos, ok := transiciones[estadoActual]
	if !ok {
		return fmt.Errorf("no se puede cambiar desde el estado %s", estadoActual)
	}

	valido := false
	for _, e := range permitidos {
		if e == nuevoEstado {
			valido = true
			break
		}
	}
	if !valido {
		return fmt.Errorf("no se puede cambiar de %s a %s", estadoActual, nuevoEstado)
	}

	now := time.Now()
	var verif, acred *time.Time
	if nuevoEstado == "VERIFICADO" {
		verif = &now
	}
	if nuevoEstado == "ACREDITADO" {
		acred = &now
	}

	if err := s.repo.UpdatePagoEstado(ctx, pagoID, nuevoEstado, notas, verif, acred); err != nil {
		return fmt.Errorf("error al actualizar pago")
	}

	if nuevoEstado == "VERIFICADO" {
		reservaID, _ := s.repo.GetPagoReservaID(ctx, pagoID)
		if reservaID != nil {
			res, err := s.repo.GetReservaByID(ctx, *reservaID)
			if err == nil && (res.Estado == "PENDIENTE" || res.Estado == "PENDIENTE_PAGO") {
				if err := s.repo.UpdateReservaEstado(ctx, *reservaID, "PENDIENTE_CONFIRMACION", nil, nil); err != nil {
					slog.Error("[admin/verificar-pago] error setting PENDIENTE_CONFIRMACION", "error", err, "reservaId", *reservaID)
				}
			}
		}
	}

	return nil
}

func (s *AdminService) GetPropiedades(ctx context.Context, estado, ciudad, busqueda, categoria string, pagina int) (*PaginatedResult, error) {
	limite := 20
	if pagina < 1 {
		pagina = 1
	}
	props, total, err := s.repo.GetPropiedadesAdmin(ctx, estado, ciudad, busqueda, categoria, pagina, limite)
	if err != nil {
		return nil, fmt.Errorf("error al obtener propiedades: %w", err)
	}
	return paginated(props, total, pagina, limite), nil
}

func (s *AdminService) UpdatePropiedad(ctx context.Context, propiedadID, estadoPublicacion string, destacada *bool) error {
	return s.repo.UpdatePropiedadAdmin(ctx, propiedadID, estadoPublicacion, destacada)
}

func (s *AdminService) DeletePropiedad(ctx context.Context, id string) error {
	return s.repo.DeletePropiedad(ctx, id)
}

func (s *AdminService) GetResenas(ctx context.Context, calificacionMin int, busqueda string, pagina int) (*PaginatedResult, error) {
	limite := 30
	if pagina < 1 {
		pagina = 1
	}
	resenas, total, err := s.repo.GetResenasAdmin(ctx, calificacionMin, busqueda, pagina, limite)
	if err != nil {
		return nil, fmt.Errorf("error al obtener reseñas")
	}
	return paginated(resenas, total, pagina, limite), nil
}

func (s *AdminService) GetResenaStats(ctx context.Context) (int, float64, map[int]int, error) {
	return s.repo.GetResenaStats(ctx)
}

func (s *AdminService) ModerarResena(ctx context.Context, resenaID, accion string) error {
	switch accion {
	case "eliminar":
		return s.repo.DeleteResena(ctx, resenaID)
	case "ocultar":
		return s.repo.UpdateResenaOculta(ctx, resenaID, true)
	case "mostrar":
		return s.repo.UpdateResenaOculta(ctx, resenaID, false)
	default:
		return fmt.Errorf("acción inválida: %s", accion)
	}
}

func (s *AdminService) GetCupones(ctx context.Context) ([]repository.Cupon, error) {
	return s.repo.GetCupones(ctx)
}

func (s *AdminService) GetCuponByID(ctx context.Context, id string) (*repository.Cupon, error) {
	return s.repo.GetCuponByID(ctx, id)
}

func (s *AdminService) CrearCupon(ctx context.Context, c *repository.Cupon) error {
	exists, _ := s.repo.ExistsCuponCodigo(ctx, c.Codigo)
	if exists {
		return fmt.Errorf("ya existe un cupón con ese código")
	}
	return s.repo.CrearCupon(ctx, c)
}

func (s *AdminService) UpdateCupon(ctx context.Context, id string, fields map[string]interface{}) error {
	return s.repo.UpdateCupon(ctx, id, fields)
}

func (s *AdminService) ToggleCuponActivo(ctx context.Context, id string, activo bool) error {
	return s.repo.ToggleCuponActivo(ctx, id, activo)
}

func (s *AdminService) DeleteCupon(ctx context.Context, id string) error {
	return s.repo.DeleteCupon(ctx, id)
}

func (s *AdminService) GetCuponUsos(ctx context.Context, cuponID string) ([]repository.CuponUso, error) {
	return s.repo.GetCuponUsos(ctx, cuponID)
}

func (s *AdminService) GetComisiones(ctx context.Context) (map[string]float64, error) {
	return s.repo.GetComisiones(ctx)
}

func (s *AdminService) UpdateComisiones(ctx context.Context, huesped, anfitrion float64, updatedBy string) error {
	if huesped < 0 || huesped > 0.5 {
		return fmt.Errorf("comisión huésped inválida (0-50%%)")
	}
	if anfitrion < 0 || anfitrion > 0.5 {
		return fmt.Errorf("comisión anfitrión inválida (0-50%%)")
	}
	return s.repo.UpdateComisiones(ctx, huesped, anfitrion, updatedBy)
}

func (s *AdminService) GetAuditLog(ctx context.Context, entidad, adminID, fechaInicio, fechaFin string, pagina int) (*PaginatedResult, error) {
	limite := 50
	if pagina < 1 {
		pagina = 1
	}
	logs, total, err := s.repo.GetAuditLog(ctx, entidad, adminID, fechaInicio, fechaFin, pagina, limite)
	if err != nil {
		return nil, fmt.Errorf("error al obtener auditoría")
	}
	return paginated(logs, total, pagina, limite), nil
}

func (s *AdminService) GetNotificaciones(ctx context.Context, pagina int) (*PaginatedResult, error) {
	limite := 30
	if pagina < 1 {
		pagina = 1
	}
	notifs, total, err := s.repo.GetNotificacionesAdmin(ctx, pagina, limite)
	if err != nil {
		return nil, fmt.Errorf("error al obtener notificaciones")
	}
	return paginated(notifs, total, pagina, limite), nil
}

func (s *AdminService) EnviarNotificacion(ctx context.Context, usuarioID, titulo, mensaje string, urlAccion *string) error {
	if titulo == "" || mensaje == "" {
		return fmt.Errorf("título y mensaje son requeridos")
	}
	if usuarioID != "" {
		return s.repo.EnviarNotificacion(ctx, usuarioID, titulo, mensaje, urlAccion)
	}
	total, err := s.repo.EnviarNotificacionBroadcast(ctx, titulo, mensaje, urlAccion)
	if err != nil {
		return err
	}
	if total == 0 {
		return fmt.Errorf("no hay usuarios activos")
	}
	return nil
}

func (s *AdminService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetDashboardStats(ctx)
}

func (s *AdminService) GetUsuarios(ctx context.Context, busqueda, rol string, pagina, limite int) (*PaginatedResult, error) {
	if limite < 1 {
		limite = 20
	}
	if limite > 100 {
		limite = 100
	}
	if pagina < 1 {
		pagina = 1
	}
	usuarios, total, err := s.repo.GetUsuariosAdmin(ctx, busqueda, rol, pagina, limite)
	if err != nil {
		return nil, fmt.Errorf("error al obtener usuarios: %w", err)
	}
	return paginated(usuarios, total, pagina, limite), nil
}

func (s *AdminService) CrearUsuario(ctx context.Context, email, password, nombre, apellido string, telefono *string, rol, adminID string) (map[string]interface{}, error) {
	return s.repo.CrearUsuarioAdmin(ctx, email, password, nombre, apellido, telefono, rol, adminID)
}

func (s *AdminService) UpdateUsuario(ctx context.Context, id string, rol, plan *string, reputacion *float64, activo *bool) error {
	return s.repo.UpdateUsuarioAdmin(ctx, id, rol, plan, reputacion, activo)
}

func (s *AdminService) DeleteUsuario(ctx context.Context, id string) error {
	return s.repo.DeleteUsuarioAdmin(ctx, id)
}

func (s *AdminService) GetPropiedadByID(ctx context.Context, id string) (*repository.AdminPropiedad, error) {
	return s.repo.GetPropiedadByIDAdmin(ctx, id)
}

func (s *AdminService) GetCiudades(ctx context.Context) ([]string, error) {
	return s.repo.GetCiudades(ctx)
}

func (s *AdminService) GetPropiedadIngresos(ctx context.Context, id string) (map[string]interface{}, error) {
	return s.repo.GetPropiedadIngresos(ctx, id)
}

func (s *AdminService) GetReservaByID(ctx context.Context, id string) (*repository.AdminReserva, error) {
	return s.repo.GetReservaByIDFull(ctx, id)
}
