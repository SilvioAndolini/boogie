'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { formatPrecio } from '@/lib/format'

interface PropiedadMapa {
  id: string
  titulo: string
  latitud: number
  longitud: number
  precioPorNoche: number
  moneda: string
  imagenUrl: string | null
  tipoPropiedad: string
  capacidadMaxima: number
  habitaciones: number
  camas: number
  banos: number
  ratingPromedio: number | null
  totalResenas: number
}

interface MarkerElement extends HTMLDivElement {
  _cleanupHandlers?: {
    mouseenter: () => void
    mouseleave: () => void
    click: () => void
  }
}

function buildPopupHTML(p: PropiedadMapa): string {
  const img = p.imagenUrl
    ? `<img src="${p.imagenUrl}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;flex-shrink:0" />`
    : ''
  const star = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#F4A261" stroke="#F4A261" stroke-width="1" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  const rating = p.ratingPromedio
    ? `<div style="display:flex;align-items:center;gap:4px;margin-top:6px;padding-top:6px;border-top:1px solid #E8E4DF">${star}<span style="font-size:11px;font-weight:700;color:#1A1A1A">${p.ratingPromedio.toFixed(1)}</span><span style="font-size:10px;color:#6B6560">(${p.totalResenas})</span></div>`
    : ''
  const price = formatPrecio(p.precioPorNoche, p.moneda as 'USD' | 'VES')
  return (
    `<div style="font-family:system-ui,-apple-system,sans-serif;min-width:190px">` +
    `<div style="display:flex;gap:10px;align-items:flex-start">` +
    img +
    `<div style="min-width:0;flex:1">` +
    `<p style="margin:0 0 3px;font-size:12px;font-weight:600;color:#1A1A1A;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.titulo}</p>` +
    `<p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1B4332">${price} <span style="font-size:10px;font-weight:400;color:#6B6560">/ noche</span></p>` +
    `<div style="display:flex;gap:8px;flex-wrap:wrap">` +
    `<span style="font-size:11px;color:#6B6560">${p.capacidadMaxima} huesp.</span>` +
    `<span style="font-size:11px;color:#6B6560">${p.habitaciones} hab.</span>` +
    `<span style="font-size:11px;color:#6B6560">${p.banos} ban${p.banos !== 1 ? 'os' : 'o'}</span>` +
    `</div>` +
    rating +
    `</div></div></div>`
  )
}

export default function MapCanvas({ propiedades, centerLat, centerLng }: {
  propiedades: PropiedadMapa[]
  centerLat?: number
  centerLng?: number
}) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const el = mapElRef.current
    if (!el || mapRef.current) return

    const center: [number, number] = [
      centerLng ?? propiedades[0]?.longitud ?? -66.89,
      centerLat ?? propiedades[0]?.latitud ?? 10.48,
    ]

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
      center,
      zoom: propiedades.length === 1 ? 14 : 6,
      cooperativeGestures: false,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      setStatus('ready')

      for (const p of propiedades) {
        const pill = document.createElement('div') as MarkerElement
        pill.className = 'map-marker'
        pill.textContent = formatPrecio(p.precioPorNoche, p.moneda as 'USD' | 'VES')

        const popup = new maplibregl.Popup({
          offset: 20,
          closeButton: false,
          closeOnClick: false,
          maxWidth: '260px',
          className: 'map-popup-container',
        }).setHTML(buildPopupHTML(p))

        const marker = new maplibregl.Marker({ element: pill })
          .setLngLat([p.longitud, p.latitud])
          .addTo(map)

        markersRef.current.push(marker)

        const handleMouseEnter = () => {
          popup.setLngLat([p.longitud, p.latitud]).addTo(map)
        }

        const handleMouseLeave = () => {
          popup.remove()
        }

        const handleClick = () => {
          window.location.href = `/propiedades/${p.id}`
        }

        pill.addEventListener('mouseenter', handleMouseEnter)
        pill.addEventListener('mouseleave', handleMouseLeave)
        pill.addEventListener('click', handleClick)

        pill._cleanupHandlers = {
          mouseenter: handleMouseEnter,
          mouseleave: handleMouseLeave,
          click: handleClick,
        }
      }

      if (propiedades.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        for (const p of propiedades) bounds.extend([p.longitud, p.latitud])
        map.fitBounds(bounds, { padding: 60 })
      }
    })

    map.on('error', (e) => {
      console.error('MapLibre error:', e.error)
      setStatus('error')
      setErrorMsg(e.error?.message ?? 'Error desconocido')
    })

    mapRef.current = map

    requestAnimationFrame(() => {
      map.resize()
    })

    return () => {
      markersRef.current.forEach((marker) => {
        const el = marker.getElement() as MarkerElement
        if (el._cleanupHandlers) {
          el.removeEventListener('mouseenter', el._cleanupHandlers.mouseenter)
          el.removeEventListener('mouseleave', el._cleanupHandlers.mouseleave)
          el.removeEventListener('click', el._cleanupHandlers.click)
          delete el._cleanupHandlers
        }
        marker.remove()
      })
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [propiedades])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
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
            {errorMsg && <p style={{ fontSize: 11, color: '#9E9892', marginTop: 4 }}>{errorMsg}</p>}
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
