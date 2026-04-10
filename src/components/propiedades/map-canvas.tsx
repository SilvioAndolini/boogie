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
  planSuscripcion: string
  imagenes: string[]
}

interface MarkerElement extends HTMLDivElement {
  _cleanupHandlers?: {
    mouseenter: () => void
    mouseleave: () => void
    click: () => void
  }
}

function buildSlideshowHTML(imagenes: string[], id: string): string {
  if (imagenes.length === 0) {
    return `<div style="width:100%;height:180px;background:#E8E4DF;display:flex;align-items:center;justify-content:center;color:#9E9892;font-size:13px;font-family:system-ui,sans-serif">Sin imagen</div>`
  }
  const dots = imagenes.length > 1
    ? `<div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:3">${imagenes.map((_, i) => `<span class="popup-dot-${id}" style="width:6px;height:6px;border-radius:50%;background:${i === 0 ? 'white' : 'rgba(255,255,255,0.5)'};transition:background 0.2s"></span>`).join('')}</div>`
    : ''
  const arrows = imagenes.length > 1
    ? `<button onclick="window.__popupSlide('${id}',-1)" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,0.4);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;z-index:3;backdrop-filter:blur(4px)">&#8249;</button>` +
      `<button onclick="window.__popupSlide('${id}',1)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,0.4);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;z-index:3;backdrop-filter:blur(4px)">&#8250;</button>`
    : ''
  const slides = imagenes.map((url, i) => `<img src="${url}" class="popup-slide-${id}" style="width:100%;height:180px;object-fit:cover;display:${i === 0 ? 'block' : 'none'};transition:opacity 0.3s" />`).join('')
  return `<div style="position:relative;width:100%;height:180px;overflow:hidden">${slides}${arrows}${dots}</div>`
}

function buildPopupHTML(p: PropiedadMapa): string {
  const slideshow = buildSlideshowHTML(p.imagenes, p.id)
  const star = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#F4A261" stroke="#F4A261" stroke-width="1" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  const rating = p.ratingPromedio
    ? `<div style="display:flex;align-items:center;gap:4px;margin-top:8px">${star}<span style="font-size:12px;font-weight:700;color:#1A1A1A">${p.ratingPromedio.toFixed(1)}</span><span style="font-size:11px;color:#6B6560">(${p.totalResenas})</span></div>`
    : ''
  const price = formatPrecio(p.precioPorNoche, p.moneda as 'USD' | 'VES')
  const ultraBadge = p.planSuscripcion === 'ULTRA'
    ? `<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:linear-gradient(135deg,#d4a843,#b8860b);color:#1a1200;font-size:9px;font-weight:800;letter-spacing:0.05em;margin-left:6px">ULTRA</span>`
    : ''
  return (
    `<div style="font-family:system-ui,-apple-system,sans-serif">` +
    slideshow +
    `<div style="padding:12px 14px 14px">` +
    `<p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1A1A1A;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.titulo}</p>` +
    `<p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1B4332">${price} <span style="font-size:11px;font-weight:400;color:#6B6560">/ noche</span>${ultraBadge}</p>` +
    `<div style="display:flex;gap:10px;flex-wrap:wrap">` +
    `<span style="font-size:11px;color:#6B6560">${p.capacidadMaxima} huesp.</span>` +
    `<span style="font-size:11px;color:#6B6560">${p.habitaciones} hab.</span>` +
    `<span style="font-size:11px;color:#6B6560">${p.banos} ban${p.banos !== 1 ? 'os' : 'o'}</span>` +
    `</div>` +
    rating +
    `</div></div>`
  )
}

interface PopupState {
  [key: string]: number
}

declare global {
  interface Window {
    __popupSlide?: (id: string, dir: number) => void
    __popupStates?: PopupState
  }
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

      window.__popupStates = {}

      window.__popupSlide = (propId: string, dir: number) => {
        const slides = document.querySelectorAll(`.popup-slide-${propId}`)
        const dots = document.querySelectorAll(`.popup-dot-${propId}`)
        if (slides.length === 0) return
        if (!window.__popupStates) window.__popupStates = {}
        const current = window.__popupStates[propId] ?? 0
        const next = (current + dir + slides.length) % slides.length
        window.__popupStates[propId] = next
        slides.forEach((s, i) => { (s as HTMLElement).style.display = i === next ? 'block' : 'none' })
        dots.forEach((d, i) => { (d as HTMLElement).style.background = i === next ? 'white' : 'rgba(255,255,255,0.5)' })
      }

      for (const p of propiedades) {
        const pill = document.createElement('div') as MarkerElement
        pill.className = p.planSuscripcion === 'ULTRA' ? 'map-marker-ultra' : 'map-marker'
        pill.textContent = formatPrecio(p.precioPorNoche, p.moneda as 'USD' | 'VES')

        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
          maxWidth: '340px',
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
