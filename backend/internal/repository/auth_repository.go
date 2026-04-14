package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthRepo struct {
	pool *pgxpool.Pool
}

func NewAuthRepo(pool *pgxpool.Pool) *AuthRepo {
	return &AuthRepo{pool: pool}
}

func (r *AuthRepo) GetUserRole(ctx context.Context, userID string) (string, error) {
	var rol string
	err := r.pool.QueryRow(ctx, `SELECT rol FROM usuarios WHERE id = $1`, userID).Scan(&rol)
	if err != nil {
		return "", err
	}
	return rol, nil
}

func (r *AuthRepo) CreateUserProfile(ctx context.Context, userID, email, nombre, apellido, telefono, cedula string) error {
	var telefonoVal, cedulaVal *string
	if telefono != "" {
		telefonoVal = &telefono
	}
	if cedula != "" {
		cedulaVal = &cedula
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO usuarios (id, email, nombre, apellido, telefono, cedula, verificado)
		VALUES ($1, $2, $3, $4, $5, $6, false)
		ON CONFLICT (id) DO NOTHING`,
		userID, email, nombre, apellido, telefonoVal, cedulaVal)
	return err
}

func (r *AuthRepo) UpdateProfile(ctx context.Context, userID, nombre, apellido, cedula, telefono string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE usuarios SET nombre = $1, apellido = $2, cedula = $3, telefono = $4
		WHERE id = $5`,
		nombre, apellido, cedula, telefono, userID)
	return err
}

func (r *AuthRepo) GetUserProfile(ctx context.Context, userID string) (map[string]interface{}, error) {
	var nombre, apellido, email, rol string
	var telefono, cedula, avatarURL, bio *string
	var verificado bool
	var plan, metodoPago, tiktok, instagram *string
	err := r.pool.QueryRow(ctx, `
		SELECT nombre, apellido, email, rol, telefono, cedula, verificado,
		       avatar_url, bio, plan, metodo_pago_preferido, tiktok, instagram
		FROM usuarios WHERE id = $1`, userID).Scan(&nombre, &apellido, &email, &rol, &telefono, &cedula, &verificado,
		&avatarURL, &bio, &plan, &metodoPago, &tiktok, &instagram)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"nombre":                nombre,
		"apellido":              apellido,
		"email":                 email,
		"rol":                   rol,
		"telefono":              telefono,
		"cedula":                cedula,
		"verificado":            verificado,
		"avatar_url":            avatarURL,
		"bio":                   bio,
		"plan":                  plan,
		"metodo_pago_preferido": metodoPago,
		"tiktok":                tiktok,
		"instagram":             instagram,
	}, nil
}
