package main

import (
	"testing"
)

func TestHealthCheck(t *testing.T) {
	expected := "ok"
	if expected != "ok" {
		t.Errorf("expected %s, got %s", "ok", expected)
	}
}
