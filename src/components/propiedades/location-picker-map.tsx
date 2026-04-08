'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Search, Loader2, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AddressData {
  direccion: string
  ciudad: string
  estado: string
  zona: string
}

interface LocationPickerMapProps {
  latitud: number | null
  longitud: number | null
  onLocationSelect: (lat: number, lng: number) => void
  onAddressChange?: (data: AddressData) => void
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

async function reverseGeocode(lat: number, lng: number): Promise<AddressData | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
      { headers: { 'User-Agent': 'BoogieApp/1.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address || {}

    const ciudad = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
    const estado = addr.state || addr.region || ''
    const zona = addr.suburb || addr.neighbourhood || addr.quarter || addr.borough || addr.district || ''
    const calle = addr.road || addr.street || ''
    const numero = addr.house_number || ''
    const direccion = [numero, calle].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || ''

    return { direccion, ciudad, estado, zona }
  } catch {
    return null
  }
}

async function forwardGeocode(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=es&countrycodes=ve`,
      { headers: { 'User-Agent': 'BoogieApp/1.0' } }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export default function LocationPickerMap({ latitud, longitud, onLocationSelect, onAddressChange }: LocationPickerMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateMarker = useCallback((lat: number, lng: number) => {
    const map = mapRef.current
    if (!map) return

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      const el = document.createElement('div')
      el.className = 'location-picker-marker'
      el.innerHTML = `
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#1B4332"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map)
    }
  }, [])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    updateMarker(lat, lng)
    onLocationSelect(lat, lng)
    reverseGeocode(lat, lng).then((addr) => {
      if (addr && onAddressChange) onAddressChange(addr)
    })
  }, [updateMarker, onLocationSelect, onAddressChange])

  useEffect(() => {
    const el = mapElRef.current
    if (!el || mapRef.current) return

    const center: [number, number] = [
      longitud ?? -66.89,
      latitud ?? 10.48,
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
      zoom: latitud && longitud ? 14 : 6,
      cooperativeGestures: false,
    })

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')

    map.on('load', () => {
      setStatus('ready')
      if (latitud != null && longitud != null) {
        updateMarker(latitud, longitud)
      }
    })

    map.on('click', (e) => {
      const { lat, lng } = e.lngLat
      handleMapClick(lat, lng)
    })

    map.on('error', () => setStatus('error'))

    mapRef.current = map
    requestAnimationFrame(() => map.resize())

    return () => {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (latitud != null && longitud != null) {
      updateMarker(latitud, longitud)
      map.flyTo({ center: [longitud, latitud], zoom: 14, duration: 800 })
    }
  }, [latitud, longitud, updateMarker])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (value.length < 3) { setSearchResults([]); setSearchOpen(false); return }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true)
      const results = await forwardGeocode(value)
      setSearchResults(results)
      setSearchOpen(results.length > 0)
      setSearchLoading(false)
    }, 400)
  }

  const handleSearchSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setSearchQuery(result.display_name.split(',')[0])
    setSearchOpen(false)
    handleMapClick(lat, lng)
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-[#E8E4DF] bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-[#6B6560]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            placeholder="Busca una dirección o lugar en Venezuela..."
            className="w-full border-none bg-transparent text-sm text-[#1A1A1A] outline-none placeholder:text-[#9E9892]"
            autoComplete="off"
          />
          {searchLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1B4332]" />}
        </div>
        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[#E8E4DF] bg-white shadow-lg"
            >
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSearchSelect(result)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F8F6F3]"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
                  <span className="text-xs leading-relaxed text-[#1A1A1A]">{result.display_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '340px',
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
    </div>
  )
}
