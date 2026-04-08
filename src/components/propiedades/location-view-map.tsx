'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface LocationViewMapProps {
  latitud: number
  longitud: number
  titulo?: string
}

export default function LocationViewMap({ latitud, longitud, titulo }: LocationViewMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const el = mapElRef.current
    if (!el || mapRef.current) return

    const map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: ['a', 'b', 'c'].map(
              (h) => `https://${h}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`
            ),
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
          },
        },
        layers: [{
          id: 'carto-tiles',
          type: 'raster',
          source: 'carto',
          minzoom: 0,
          maxzoom: 20,
        }],
      },
      center: [longitud, latitud],
      zoom: 14,
      cooperativeGestures: false,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      setStatus('ready')

      const el = document.createElement('div')
      el.innerHTML = `
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#1B4332"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `

      new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([longitud, latitud])
        .addTo(map)
    })

    map.on('error', () => {
      setStatus('error')
    })

    mapRef.current = map

    requestAnimationFrame(() => {
      map.resize()
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [latitud, longitud])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '280px',
        overflow: 'hidden',
        borderRadius: '12px',
        background: '#F8F6F3',
      }}
    >
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F8F6F3',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, margin: '0 auto 8px',
              border: '3px solid #E8E4DF', borderTopColor: '#1B4332',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: '#6B6560' }}>Cargando mapa...</span>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F8F6F3',
        }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>&#x26A0;</span>
            <p style={{ fontSize: 13, color: '#6B6560', margin: 0 }}>No se pudo cargar el mapa</p>
          </div>
        </div>
      )}
      <div
        ref={mapElRef}
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  )
}
