package service

import (
	"testing"

	"github.com/boogie/backend/internal/repository"
)

func TestIsUUID(t *testing.T) {
	tests := []struct {
		input string
		want  bool
	}{
		{"550e8400-e29b-41d4-a716-446655440000", true},
		{"my-slug-property", false},
		{"1234", false},
		{"", false},
	}
	for _, tt := range tests {
		got := isUUID(tt.input)
		if got != tt.want {
			t.Errorf("isUUID(%q) = %v, want %v", tt.input, got, tt.want)
		}
	}
}

func TestFilterByDistance(t *testing.T) {
	lat := 10.5
	lng := -66.9

	results := []repository.PropiedadListado{
		{ID: "1", Latitud: ptrFloat64(10.501), Longitud: ptrFloat64(-66.901)},
		{ID: "2", Latitud: ptrFloat64(11.0), Longitud: ptrFloat64(-67.0)},
		{ID: "3", Latitud: nil, Longitud: nil},
	}

	filtered := FilterByDistance(results, lat, lng, 10.0)

	if len(filtered) != 1 {
		t.Errorf("expected 1 result within 10km, got %d", len(filtered))
	}
	if len(filtered) > 0 && filtered[0].ID != "1" {
		t.Errorf("expected ID 1, got %s", filtered[0].ID)
	}
}

func ptrFloat64(v float64) *float64 {
	return &v
}
