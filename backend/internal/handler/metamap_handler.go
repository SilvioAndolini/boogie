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

	"github.com/boogie/backend/internal/repository"
)

type MetamapHandler struct {
	metamapRepo *repository.MetamapRepo
	secret      string
}

func NewMetamapHandler(metamapRepo *repository.MetamapRepo, secret string) *MetamapHandler {
	return &MetamapHandler{metamapRepo: metamapRepo, secret: secret}
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

	verifID, usuarioID, err := h.metamapRepo.FindVerificacionByMetamapIdentity(r.Context(), identityID)
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

	resourceJSON, err := json.Marshal(resource)
	if err != nil {
		slog.Error("[metamap/webhook] marshal resource", "error", err)
		resourceJSON = body
	}

	if err := h.metamapRepo.UpdateVerificacionEstado(r.Context(), verifID, nuevoEstado, resourceJSON); err != nil {
		slog.Error("[metamap/webhook] update error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error updating verification")
		return
	}

	if nuevoEstado == "RECHAZADA" {
		if err := h.metamapRepo.SetMotivoRechazo(r.Context(), verifID, "MetaMap: Verificación rechazada automáticamente"); err != nil {
			slog.Error("[metamap/webhook] set motivo rechazo", "error", err)
		}
	}

	if esAprobada {
		if err := h.metamapRepo.SetFechaRevision(r.Context(), verifID); err != nil {
			slog.Error("[metamap/webhook] set fecha revision", "error", err)
		}

		if usuarioID != "" {
			if err := h.metamapRepo.MarcarUsuarioVerificado(r.Context(), usuarioID); err != nil {
				slog.Error("[metamap/webhook] marcar usuario verificado", "error", err)
			}
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
