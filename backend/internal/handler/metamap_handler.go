package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MetamapHandler struct {
	pool   *pgxpool.Pool
	secret string
}

func NewMetamapHandler(pool *pgxpool.Pool, secret string) *MetamapHandler {
	return &MetamapHandler{pool: pool, secret: secret}
}

func (h *MetamapHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	if h.secret == "" {
		slog.Error("[metamap/webhook] METAMAP_WEBHOOK_SECRET not configured")
		ErrorJSON(w, http.StatusServiceUnavailable, "NOT_CONFIGURED", "Webhook not configured")
		return
	}

	body, err := readBody(r)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "Invalid request body")
		return
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON")
		return
	}

	signature := r.Header.Get("x-metamap-signature")
	if signature == "" {
		signature = r.Header.Get("signature")
	}
	if signature == "" {
		ErrorJSON(w, http.StatusUnauthorized, "MISSING_SIGNATURE", "Missing signature")
		return
	}

	if !verifyHMAC(string(body), signature, h.secret) {
		slog.Warn("[metamap/webhook] Invalid signature")
		ErrorJSON(w, http.StatusUnauthorized, "INVALID_SIGNATURE", "Invalid signature")
		return
	}

	resource, _ := parsed["resource"].(map[string]interface{})
	if resource == nil {
		resource, _ = parsed["data"].(map[string]interface{})
	}
	if resource == nil {
		resource = parsed
	}

	identityID, _ := resource["id"].(string)
	if identityID == "" {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid payload")
		return
	}

	statusRaw, _ := resource["status"].(string)
	if statusRaw == "" {
		statusRaw, _ = resource["reviewStatus"].(string)
	}
	status := strings.ToLower(statusRaw)

	var verifID, usuarioID string
	err = h.pool.QueryRow(r.Context(), `
		SELECT id, usuario_id FROM verificaciones_documento
		WHERE metamap_identity_id = $1 LIMIT 1
	`, identityID).Scan(&verifID, &usuarioID)

	if err != nil {
		err = h.pool.QueryRow(r.Context(), `
			SELECT id, usuario_id FROM verificaciones_documento
			WHERE metamap_flow_id = $1 LIMIT 1
		`, identityID).Scan(&verifID, &usuarioID)
	}

	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", "Verification not found")
		return
	}

	var nuevoEstado string
	esAprobada := false

	switch status {
	case "verified", "approved", "done":
		nuevoEstado = "APROBADA"
		esAprobada = true
	case "rejected", "declined":
		nuevoEstado = "RECHAZADA"
	default:
		nuevoEstado = "EN_PROCESO"
	}

	resourceJSON, _ := json.Marshal(resource)
	_, err = h.pool.Exec(r.Context(), `
		UPDATE verificaciones_documento
		SET estado = $1, metamap_resultado = $2, fecha_actualizacion = NOW()
		WHERE id = $3
	`, nuevoEstado, resourceJSON, verifID)
	if err != nil {
		slog.Error("[metamap/webhook] update error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error updating verification")
		return
	}

	if nuevoEstado == "RECHAZADA" {
		_, _ = h.pool.Exec(r.Context(), `
			UPDATE verificaciones_documento SET motivo_rechazo = $1 WHERE id = $2
		`, "MetaMap: Verificación rechazada automáticamente", verifID)
	}

	if esAprobada {
		_, _ = h.pool.Exec(r.Context(), `
			UPDATE verificaciones_documento SET fecha_revision = NOW() WHERE id = $1
		`, verifID)

		if usuarioID != "" {
			_, _ = h.pool.Exec(r.Context(), `
				UPDATE usuarios SET verificado = true WHERE id = $1
			`, usuarioID)
		}
	}

	JSON(w, http.StatusOK, map[string]interface{}{"received": true})
}

func verifyHMAC(body, signature, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(body))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func readBody(r *http.Request) ([]byte, error) {
	defer r.Body.Close()
	return io.ReadAll(r.Body)
}

var _ = strings.ToLower
