# Backend Go — Boogie

API REST en Go para la lógica de negocio de Boogie.

---

## Visión General

El backend de Go sirve como API backend standalone que se comunica con el frontend Next.js. Maneja toda la lógica de negocio pesada, acceso a datos, y autenticación.

**Puerto**: 8080 (configurable via `PORT`)  
**Framework HTTP**: Chi v5  
**Database**: PostgreSQL via pgx/v5

---

## Estructura del Proyecto

```
backend/
├── cmd/
│   └── server/
│       └── main.go           # Entry point, wire-up de todos los servicios
│
├── internal/
│   ├── auth/                 # Autenticación Supabase (JWKS)
│   │   ├── supabase.go       # SupabaseVerifier (valida JWT)
│   │   ├── supabase_auth_client.go  # Admin auth client
│   │   └── supabase_test.go
│   │
│   ├── config/               # Carga de configuración
│   │   └── config.go         # Struct Config, Load()
│   │
│   ├── domain/               # Definiciones de dominio
│   │   ├── models/          # Structs: Usuario, Propiedad, Reserva, Pago...
│   │   └── enums/           # Enums: Rol, EstadoReserva, etc.
│   │
│   ├── handler/              # HTTP handlers
│   │   ├── auth_handler.go
│   │   ├── reserva_handler.go
│   │   ├── pago_handler.go
│   │   ├── propiedades_handler.go
│   │   ├── admin_handler.go
│   │   ├── crypto_handler.go
│   │   ├── metamap_handler.go
│   │   ├── wallet_handler.go
│   │   ├── resena_handler.go
│   │   ├── verificacion_handler.go
│   │   ├── chat_handler.go
│   │   ├── oferta_handler.go
│   │   ├── tienda_handler.go
│   │   ├── exchange_handler.go
│   │   ├── ubicaciones_handler.go
│   │   ├── response.go       # Helpers JSON (SuccessJSON, ErrorJSON)
│   │   ├── middleware.go     # Logging, Recovery, Rate limiting
│   │   └── *_test.go         # Tests de handlers
│   │
│   ├── repository/           # Acceso a datos
│   │   ├── db.go            # Pool de conexión pgx
│   │   ├── auth_repository.go
│   │   ├── propiedades_repository.go
│   │   ├── reserva_repository.go
│   │   ├── pago_repository.go
│   │   ├── resena_repository.go
│   │   ├── verificacion_repository.go
│   │   ├── wallet_repository.go
│   │   ├── chat_repository.go
│   │   ├── oferta_repository.go
│   │   ├── tienda_repository.go
│   │   ├── admin_repository.go
│   │   └── queries/         # SQL queries parametrizadas
│   │
│   ├── router/               # Configuración de rutas
│   │   └── router.go        # New() → chi.Router con todas las rutas
│   │
│   └── service/              # Lógica de negocio
│       ├── auth_service.go
│       ├── propiedades_service.go
│       ├── reserva_service.go
│       ├── reserva_disponibilidad.go
│       ├── pago_service.go
│       ├── wallet_service.go
│       ├── crypto_service.go
│       ├── resena_service.go
│       ├── verificacion_service.go
│       ├── ubicaciones_service.go
│       ├── exchange_service.go
│       ├── chat_service.go
│       ├── oferta_service.go
│       ├── tienda_service.go
│       ├── admin_service.go
│       └── *_test.go
│
├── go.mod
└── go.sum
```

---

## Comandos

```bash
# Ejecutar servidor
go run cmd/server/main.go

# Compilar
go build ./...

# Tests
go test ./...
go test -v ./internal/handler

# Deps
go mod download
go mod tidy
```

---

## Configuración

El servidor toma configuración desde variables de entorno:

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `8080` | Puerto del servidor |
| `APP_URL` | `http://localhost:3000` | URL del frontend (CORS) |
| `SUPABASE_URL` | — | URL del proyecto Supabase |
| `SUPABASE_SECRET_KEY` | — | Service role key |
| `DATABASE_URL` | — | Connection string PostgreSQL |
| `CRYPTAPI_WALLET_ADDRESS` | — | Wallet para USDT |
| `CRYPTAPI_CALLBACK_SECRET` | — | Secret para callbacks CryptAPI |
| `METAMAP_WEBHOOK_SECRET` | — | Secret para webhook MetaMap |
| `COMISION_PLATAFORMA_HUESPED` | `0.06` | Comisión 6% |
| `COMISION_PLATAFORMA_ANFITRION` | `0.03` | Comisión 3% |

---

## Autenticación

### JWKS Verification

El `SupabaseVerifier`valida JWTs contra el JWKS endpoint de Supabase:

```go
// internal/auth/supabase.go
type SupabaseVerifier struct {
    supabaseURL string
    jwksURL     string
}

// Middleware extrae Authorization header, valida JWT
func (v *SupabaseVerifier) Middleware(next http.Handler) http.Handler
```

### Require Admin

```go
// Para rutas de admin, se verifica rol ADMIN en el JWT claims
func RequireAdmin(next http.Handler) http.Handler {
    // Verifica que claims.rol == "ADMIN"
}
```

---

## Handlers

### Auth Handler

```go
type AuthHandler struct {
    authClient  *auth.SupabaseAuthClient
    verifier    *auth.SupabaseVerifier
    authRepo    *repository.AuthRepo
}

// POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request)

// POST /api/v1/auth/otp/email
func (h *AuthHandler) SendOtpEmail(w http.ResponseWriter, r *http.Request)

// POST /api/v1/auth/otp/verify
func (h *AuthHandler) VerifyOtp(w http.ResponseWriter, r *http.Request)

// GET /api/v1/auth/me
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request)
```

### Reserva Handler

```go
type ReservaHandler struct {
    svc           *service.ReservaService
    disponibilidad *service.ReservaDisponibilidad
}

// POST /api/v1/reservas
func (h *ReservaHandler) Crear(w http.ResponseWriter, r *http.Request)

// GET /api/v1/reservas/disponibilidad?propiedadId=...&entrada=...&salida=...
func (h *ReservaHandler) Disponibilidad(w http.ResponseWriter, r *http.Request)
```

### Pago Handler

```go
type PagoHandler struct {
    svc *service.PagoService
}

// POST /api/v1/pagos/registrar-comprobante
func (h *PagoHandler) RegistrarConComprobante(w http.ResponseWriter, r *http.Request)
```

---

## Services

### Reserva Service

```go
type ReservaService struct {
    repo    *repository.ReservaRepo
    comisionH float64  // 0.06
    comisionA float64  // 0.03
}

func (s *ReservaService) Crear(ctx context.Context, input *CrearReservaInput) (*models.Reserva, error)
func (s *ReservaService) GetByID(ctx context.Context, id string) (*models.Reserva, error)
func (s *ReservaService) Confirmar(ctx context.Context, id string) error
func (s *ReservaService) Rechazar(ctx context.Context, id string) error
func (s *ReservaService) Cancelar(ctx context.Context, id string, motivo string) error
```

### Crypto Service

```go
type CryptoService struct {
    config     CryptapiConfig
    comisionH float64
    comisionA float64
}

func (s *CryptoService) CreateDepositAddress(ctx context.Context, userID string, amount float64) (string, error)
func (s *CryptoService) ProcessCallback(ctx context.Context, txHash string) error
```

---

## Repository Pattern

Cada entidad tiene su repository con queries SQL directas:

```go
type ReservaRepo struct {
    pool *pgxpool.Pool
}

func (r *ReservaRepo) Create(ctx context.Context, r *models.Reserva) error
func (r *ReservaRepo) GetByID(ctx context.Context, id string) (*models.Reserva, error)
func (r *ReservaRepo) UpdateEstado(ctx context.Context, id string, estado enums.EstadoReserva) error
func (r *ReservaRepo) GetByUsuario(ctx context.Context, usuarioID string) ([]models.Reserva, error)
```

---

## Rate Limiting

El router aplica rate limiting por IP:

- `/exchange-rate`: 60 req/min
- `/ubicaciones`: 30 req/2s

```go
type IPRateLimiter struct {
    limiter  *rate.Limiter
    lastSeen time.Time
}
```

---

## CORS

```go
cors.New(cors.Options{
    AllowedOrigins:   []string{opts.AppURL},
    AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
    ExposedHeaders:   []string{"X-RateLimit-Remaining"},
    AllowCredentials: true,
    MaxAge:           300,
})
```

---

## Error Handling

```go
// internal/handler/response.go
func ErrorJSON(w http.ResponseWriter, status int, code, message string)
func SuccessJSON(w http.ResponseWriter, data interface{})
```

Respuestas de error:
```json
{
    "error": {
        "code": "RESERVA_NO_ENCONTRADA",
        "message": "La reserva no existe"
    }
}
```

---

## Tests

Los tests están junto a los archivos fuente con `_test.go`:

```bash
go test ./internal/handler      # Tests de handlers
go test ./internal/service     # Tests de servicios
go test ./...                  # Todos
```

---

## Dependencias

```go
require (
    github.com/go-chi/chi/v5 v5.2.1
    github.com/golang-jwt/jwt/v5 v5.2.2
    github.com/jackc/pgx/v5 v5.7.4
    github.com/rs/cors v1.11.1
    github.com/stretchr/testify v1.10.0
    golang.org/x/time v0.11.0
)
```