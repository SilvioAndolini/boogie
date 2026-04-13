package handler

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
)

type CardHandler struct {
	pagoSvc       *service.PagoService
	pagoRepo      *repository.PagoRepo
	walletAddress string
	moonpayKey    string
	moonpayEnv    string
	moonpaySecret string
}

func NewCardHandler(pagoSvc *service.PagoService, pagoRepo *repository.PagoRepo) *CardHandler {
	return &CardHandler{
		pagoSvc:       pagoSvc,
		pagoRepo:      pagoRepo,
		walletAddress: os.Getenv("CRYPTAPI_WALLET_ADDRESS"),
		moonpayKey:    os.Getenv("NEXT_PUBLIC_MOONPAY_API_KEY"),
		moonpayEnv:    os.Getenv("MOONPAY_ENVIRONMENT"),
		moonpaySecret: os.Getenv("MOONPAY_SECRET_KEY"),
	}
}

type cardCreateRequest struct {
	Monto             float64 `json:"monto"`
	PropiedadID       string  `json:"propiedadId"`
	FechaEntrada      string  `json:"fechaEntrada"`
	FechaSalida       string  `json:"fechaSalida"`
	CantidadHuespedes int     `json:"cantidadHuespedes"`
}

func (h *CardHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req cardCreateRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Monto <= 0 || req.PropiedadID == "" || req.FechaEntrada == "" || req.FechaSalida == "" || req.CantidadHuespedes < 1 {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "monto, propiedadId, fechaEntrada, fechaSalida y cantidadHuespedes son requeridos")
		return
	}

	if h.walletAddress == "" {
		ErrorJSON(w, http.StatusInternalServerError, "WALLET_NOT_CONFIGURED", "Wallet no configurada")
		return
	}

	if h.moonpayKey == "" {
		ErrorJSON(w, http.StatusInternalServerError, "MOONPAY_NOT_CONFIGURED", "MoonPay no configurado")
		return
	}

	txBytes := make([]byte, 8)
	_, _ = rand.Read(txBytes)
	externalTxID := hex.EncodeToString(txBytes)

	if err := h.pagoRepo.InsertPagoCard(r.Context(), "", userID, req.Monto, externalTxID); err != nil {
		slog.Error("[card/create] error inserting pago", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Error al registrar pago")
		return
	}

	moonpayURL := buildMoonPayURL(h.moonpayKey, h.walletAddress, req.Monto, externalTxID, auth.GetUserEmail(r.Context()))

	JSON(w, http.StatusOK, map[string]interface{}{
		"checkoutUrl": moonpayURL,
	})
}

func (h *CardHandler) Callback(w http.ResponseWriter, r *http.Request) {
	queryString := r.URL.RawQuery

	if !h.verifyMoonPaySignature(queryString) {
		ErrorJSON(w, http.StatusUnauthorized, "INVALID_SIGNATURE", "Firma invalida")
		return
	}

	externalTxID := r.URL.Query().Get("externalTransactionId")
	transactionStatus := r.URL.Query().Get("transactionStatus")

	if externalTxID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_TX_ID", "externalTransactionId requerido")
		return
	}

	if err := h.pagoSvc.ProcessCardCallback(r.Context(), externalTxID, transactionStatus); err != nil {
		slog.Error("[card/callback] error", "error", err, "txId", externalTxID)
		ErrorJSON(w, http.StatusBadRequest, "CALLBACK_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func buildMoonPayURL(apiKey, walletAddress string, amount float64, externalTxID, email string) string {
	env := os.Getenv("MOONPAY_ENVIRONMENT")
	base := "https://buy-sandbox.moonpay.com"
	if env == "production" {
		base = "https://buy.moonpay.com"
	}

	params := url.Values{}
	params.Set("apiKey", apiKey)
	params.Set("baseCurrencyCode", "usd")
	params.Set("baseCurrencyAmount", fmt.Sprintf("%.2f", amount))
	params.Set("defaultCurrencyCode", "usdt_trc20")
	params.Set("walletAddress", walletAddress)
	params.Set("theme", "light")

	if email != "" {
		params.Set("email", email)
	}
	if externalTxID != "" {
		params.Set("externalTransactionId", externalTxID)
	}

	return fmt.Sprintf("%s?%s", base, params.Encode())
}

func (h *CardHandler) verifyMoonPaySignature(queryString string) bool {
	if h.moonpaySecret == "" {
		return false
	}

	params, err := url.ParseQuery(queryString)
	if err != nil {
		return false
	}

	receivedSig := params.Get("signature")
	if receivedSig == "" {
		return false
	}

	params.Del("signature")

	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var parts []string
	for _, k := range keys {
		for _, v := range params[k] {
			parts = append(parts, fmt.Sprintf("%s=%s", k, v))
		}
	}
	message := strings.Join(parts, "&")

	mac := hmac.New(sha256.New, []byte(h.moonpaySecret))
	mac.Write([]byte(message))
	expectedSig := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(receivedSig), []byte(expectedSig))
}
