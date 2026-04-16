package enums

type Rol string

const (
	RolBooger    Rol = "BOOGER"
	RolAnfitrion Rol = "ANFITRION"
	RolAmbos     Rol = "AMBOS"
	RolAdmin     Rol = "ADMIN"
)

type EstadoPublicacion string

const (
	EstadoPublicacionBorrador          EstadoPublicacion = "BORRADOR"
	EstadoPublicacionPendienteRevision EstadoPublicacion = "PENDIENTE_REVISION"
	EstadoPublicacionPublicada         EstadoPublicacion = "PUBLICADA"
	EstadoPublicacionPausada           EstadoPublicacion = "PAUSADA"
	EstadoPublicacionSuspendida        EstadoPublicacion = "SUSPENDIDA"
)

type EstadoReserva string

const (
	EstadoReservaPendientePago      EstadoReserva = "PENDIENTE_PAGO"
	EstadoReservaPendiente          EstadoReserva = "PENDIENTE"
	EstadoReservaPendienteConfirm   EstadoReserva = "PENDIENTE_CONFIRMACION"
	EstadoReservaConfirmada         EstadoReserva = "CONFIRMADA"
	EstadoReservaEnCurso            EstadoReserva = "EN_CURSO"
	EstadoReservaCompletada         EstadoReserva = "COMPLETADA"
	EstadoReservaCanceladaHuesped   EstadoReserva = "CANCELADA_HUESPED"
	EstadoReservaCanceladaAnfitrion EstadoReserva = "CANCELADA_ANFITRION"
	EstadoReservaRechazada          EstadoReserva = "RECHAZADA"
	EstadoReservaAnulada            EstadoReserva = "ANULADA"
)

type EstadoPago string

const (
	EstadoPagoPendiente      EstadoPago = "PENDIENTE"
	EstadoPagoEnVerificacion EstadoPago = "EN_VERIFICACION"
	EstadoPagoVerificado     EstadoPago = "VERIFICADO"
	EstadoPagoAcreditado     EstadoPago = "ACREDITADO"
	EstadoPagoRechazado      EstadoPago = "RECHAZADO"
	EstadoPagoReembolsado    EstadoPago = "REEMBOLSADO"
)

type MetodoPagoEnum string

const (
	MetodoPagoTransferenciaBancaria MetodoPagoEnum = "TRANSFERENCIA_BANCARIA"
	MetodoPagoPagoMovil             MetodoPagoEnum = "PAGO_MOVIL"
	MetodoPagoZelle                 MetodoPagoEnum = "ZELLE"
	MetodoPagoEfectivoFarmatodo     MetodoPagoEnum = "EFECTIVO_FARMATODO"
	MetodoPagoUSDT                  MetodoPagoEnum = "USDT"
	MetodoPagoEfectivo              MetodoPagoEnum = "EFECTIVO"
	MetodoPagoCripto                MetodoPagoEnum = "CRIPTO"
	MetodoPagoWallet                MetodoPagoEnum = "WALLET"
)

type Moneda string

const (
	MonedaUSD Moneda = "USD"
	MonedaVES Moneda = "VES"
)

type PoliticaCancelacion string

const (
	PoliticaCancelacionFlexible PoliticaCancelacion = "FLEXIBLE"
	PoliticaCancelacionModerada PoliticaCancelacion = "MODERADA"
	PoliticaCancelacionEstricta PoliticaCancelacion = "ESTRICTA"
)

type TipoPropiedad string

const (
	TipoPropiedadApartamento TipoPropiedad = "APARTAMENTO"
	TipoPropiedadCasa        TipoPropiedad = "CASA"
	TipoPropiedadVilla       TipoPropiedad = "VILLA"
	TipoPropiedadCabana      TipoPropiedad = "CABANA"
	TipoPropiedadEstudio     TipoPropiedad = "ESTUDIO"
	TipoPropiedadHabitacion  TipoPropiedad = "HABITACION"
	TipoPropiedadLoft        TipoPropiedad = "LOFT"
	TipoPropiedadPenthouse   TipoPropiedad = "PENTHOUSE"
	TipoPropiedadFinca       TipoPropiedad = "FINCA"
	TipoPropiedadOtro        TipoPropiedad = "OTRO"
)

type PlanSuscripcion string

const (
	PlanFree  PlanSuscripcion = "FREE"
	PlanUltra PlanSuscripcion = "ULTRA"
)

type CategoriaPropiedad string

const (
	CategoriaPropiedadAlojamiento CategoriaPropiedad = "ALOJAMIENTO"
	CategoriaPropiedadDeporte     CategoriaPropiedad = "DEPORTE"
)

type TipoCancha string

const (
	TipoCanchaFutbol       TipoCancha = "FUTBOL"
	TipoCanchaBaloncesto   TipoCancha = "BALONCESTO"
	TipoCanchaTenis        TipoCancha = "TENIS"
	TipoCanchaPaddle       TipoCancha = "PADDLE"
	TipoCanchaTenisDeMesa  TipoCancha = "TENIS_DE_MESA"
	TipoCanchaMultideporte TipoCancha = "MULTIDEPORTE"
)

type ModoReserva string

const (
	ModoReservaManual     ModoReserva = "MANUAL"
	ModoReservaAutomatico ModoReserva = "AUTOMATICO"
)
