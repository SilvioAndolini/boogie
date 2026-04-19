package handler

import "context"

type AuthRepository interface {
	GetUserRole(ctx context.Context, userID string) (string, error)
	CreateUserProfile(ctx context.Context, userID, email, nombre, apellido, telefono, cedula string) error
	UpdateProfile(ctx context.Context, userID, nombre, apellido, cedula, telefono string) error
	GetUserProfile(ctx context.Context, userID string) (map[string]interface{}, error)
	UpdatePerfilCompleto(ctx context.Context, userID string, campos map[string]interface{}) error
	UpdateAvatarURL(ctx context.Context, userID, avatarURL string) error
}
