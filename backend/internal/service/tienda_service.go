package service

import (
	"context"
	"time"

	"github.com/boogie/backend/internal/repository"
)

type TiendaRepository interface {
	GetProductosActivos(ctx context.Context) ([]repository.StoreProducto, error)
	GetServiciosActivos(ctx context.Context) ([]repository.StoreServicio, error)
	GetAllProductos(ctx context.Context) ([]repository.StoreProducto, error)
	GetAllServicios(ctx context.Context) ([]repository.StoreServicio, error)
	CrearProducto(ctx context.Context, nombre string, descripcion *string, precio float64, moneda, categoria string, imagenURL *string, orden int) error
	ActualizarProducto(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, imagenURL *string, categoria *string, activo *bool, orden *int) error
	EliminarProducto(ctx context.Context, id string) error
	CrearServicio(ctx context.Context, nombre string, descripcion *string, precio float64, moneda, tipoPrecio, categoria string, imagenURL *string, orden int) error
	ActualizarServicio(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, tipoPrecio *string, imagenURL *string, categoria *string, activo *bool, orden *int) error
	EliminarServicio(ctx context.Context, id string) error
}

type TiendaService struct {
	repo  TiendaRepository
	cache *CacheService
}

func NewTiendaService(repo TiendaRepository) *TiendaService {
	return &TiendaService{repo: repo, cache: GetCache()}
}

func (s *TiendaService) GetProductos(ctx context.Context) ([]repository.StoreProducto, error) {
	const key = "tienda:productos"
	const ttl = 30 * time.Minute

	var prods []repository.StoreProducto
	err := s.cache.GetOrFetchInto(key, ttl, &prods, func() (interface{}, error) {
		p, e := s.repo.GetProductosActivos(ctx)
		if e != nil {
			return nil, e
		}
		if p == nil {
			p = []repository.StoreProducto{}
		}
		return p, nil
	})
	if err != nil {
		return nil, err
	}
	return prods, nil
}

func (s *TiendaService) GetServicios(ctx context.Context) ([]repository.StoreServicio, error) {
	const key = "tienda:servicios"
	const ttl = 30 * time.Minute

	var servs []repository.StoreServicio
	err := s.cache.GetOrFetchInto(key, ttl, &servs, func() (interface{}, error) {
		s, e := s.repo.GetServiciosActivos(ctx)
		if e != nil {
			return nil, e
		}
		if s == nil {
			s = []repository.StoreServicio{}
		}
		return s, nil
	})
	if err != nil {
		return nil, err
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
	if err := s.repo.CrearProducto(ctx, nombre, descripcion, precio, moneda, categoria, imagenURL, orden); err != nil {
		return err
	}
	s.cache.Delete("tienda:productos")
	return nil
}

func (s *TiendaService) ActualizarProducto(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, imagenURL *string, categoria *string, activo *bool, orden *int) error {
	if err := s.repo.ActualizarProducto(ctx, id, nombre, descripcion, precio, moneda, imagenURL, categoria, activo, orden); err != nil {
		return err
	}
	s.cache.Delete("tienda:productos")
	return nil
}

func (s *TiendaService) EliminarProducto(ctx context.Context, id string) error {
	if err := s.repo.EliminarProducto(ctx, id); err != nil {
		return err
	}
	s.cache.Delete("tienda:productos")
	return nil
}

func (s *TiendaService) CrearServicio(ctx context.Context, nombre string, descripcion *string, precio float64, moneda, tipoPrecio, categoria string, imagenURL *string, orden int) error {
	if err := s.repo.CrearServicio(ctx, nombre, descripcion, precio, moneda, tipoPrecio, categoria, imagenURL, orden); err != nil {
		return err
	}
	s.cache.Delete("tienda:servicios")
	return nil
}

func (s *TiendaService) ActualizarServicio(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, tipoPrecio *string, imagenURL *string, categoria *string, activo *bool, orden *int) error {
	if err := s.repo.ActualizarServicio(ctx, id, nombre, descripcion, precio, moneda, tipoPrecio, imagenURL, categoria, activo, orden); err != nil {
		return err
	}
	s.cache.Delete("tienda:servicios")
	return nil
}

func (s *TiendaService) EliminarServicio(ctx context.Context, id string) error {
	if err := s.repo.EliminarServicio(ctx, id); err != nil {
		return err
	}
	s.cache.Delete("tienda:servicios")
	return nil
}
