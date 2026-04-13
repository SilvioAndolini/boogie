package service

import (
	"context"

	"github.com/boogie/backend/internal/repository"
)

type TiendaService struct {
	repo *repository.TiendaRepo
}

func NewTiendaService(repo *repository.TiendaRepo) *TiendaService {
	return &TiendaService{repo: repo}
}

func (s *TiendaService) GetProductos(ctx context.Context) ([]repository.StoreProducto, error) {
	prods, err := s.repo.GetProductosActivos(ctx)
	if err != nil {
		return nil, err
	}
	if prods == nil {
		prods = []repository.StoreProducto{}
	}
	return prods, nil
}

func (s *TiendaService) GetServicios(ctx context.Context) ([]repository.StoreServicio, error) {
	servs, err := s.repo.GetServiciosActivos(ctx)
	if err != nil {
		return nil, err
	}
	if servs == nil {
		servs = []repository.StoreServicio{}
	}
	return servs, nil
}

func (s *TiendaService) GetAllProductos(ctx context.Context) ([]repository.StoreProducto, error) {
	prods, err := s.repo.GetAllProductos(ctx)
	if err != nil {
		return nil, err
	}
	if prods == nil {
		prods = []repository.StoreProducto{}
	}
	return prods, nil
}

func (s *TiendaService) GetAllServicios(ctx context.Context) ([]repository.StoreServicio, error) {
	servs, err := s.repo.GetAllServicios(ctx)
	if err != nil {
		return nil, err
	}
	if servs == nil {
		servs = []repository.StoreServicio{}
	}
	return servs, nil
}

func (s *TiendaService) CrearProducto(ctx context.Context, nombre string, descripcion *string, precio float64, moneda string, imagenURL *string, categoria string, orden int) error {
	return s.repo.CrearProducto(ctx, nombre, descripcion, precio, moneda, categoria, imagenURL, orden)
}

func (s *TiendaService) ActualizarProducto(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, imagenURL *string, categoria *string, activo *bool, orden *int) error {
	return s.repo.ActualizarProducto(ctx, id, nombre, descripcion, precio, moneda, imagenURL, categoria, activo, orden)
}

func (s *TiendaService) EliminarProducto(ctx context.Context, id string) error {
	return s.repo.EliminarProducto(ctx, id)
}

func (s *TiendaService) CrearServicio(ctx context.Context, nombre string, descripcion *string, precio float64, moneda, tipoPrecio, categoria string, imagenURL *string, orden int) error {
	return s.repo.CrearServicio(ctx, nombre, descripcion, precio, moneda, tipoPrecio, categoria, imagenURL, orden)
}

func (s *TiendaService) ActualizarServicio(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, tipoPrecio *string, imagenURL *string, categoria *string, activo *bool, orden *int) error {
	return s.repo.ActualizarServicio(ctx, id, nombre, descripcion, precio, moneda, tipoPrecio, imagenURL, categoria, activo, orden)
}

func (s *TiendaService) EliminarServicio(ctx context.Context, id string) error {
	return s.repo.EliminarServicio(ctx, id)
}
