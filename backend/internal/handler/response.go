package handler

import (
	"encoding/json"
	"net/http"
)

type APIResponse struct {
	Data interface{} `json:"data,omitempty"`
	Meta *Meta       `json:"meta,omitempty"`
}

type APIError struct {
	Error ErrorBody `json:"error"`
}

type ErrorBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

type Meta struct {
	Page    int `json:"page,omitempty"`
	PerPage int `json:"perPage,omitempty"`
	Total   int `json:"total,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{Data: data})
}

func JSONWithMeta(w http.ResponseWriter, status int, data interface{}, meta Meta) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{Data: data, Meta: &meta})
}

func ErrorJSON(w http.ResponseWriter, status int, code string, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIError{
		Error: ErrorBody{
			Code:    code,
			Message: message,
		},
	})
}

func ErrorJSONWithDetails(w http.ResponseWriter, status int, code string, message string, details interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIError{
		Error: ErrorBody{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

func DecodeJSON(r *http.Request, v interface{}) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}
