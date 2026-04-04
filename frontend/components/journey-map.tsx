'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize, Minimize } from 'lucide-react'

interface Scan {
  scanNumber: number
  serverTimestamp: string
  resolvedLat: number | null
  resolvedLng: number | null
  resolvedLocation: string | null
  ipCountry: string | null
  deviceType: string | null
  scanSource: string
  scannerRole: string | null
  anchoredOnChain: boolean
  anchorTxId: string | null
  machineModel: string | null
  ipIsProxy: boolean | null
  os?: string | null
  ipCountryName?: string | null
}

interface JourneyMapProps {
  scans: Scan[]
}

function getMarkerColor(scan: Scan, index: number, total: number) {
  if (index === 0) return '#3B82F6';
  if (index === total - 1) return '#10B981';
  return '#8B5CF6';
}

function getMarkerHtml(scan: Scan, color: string) {
  return `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}"></div>`;
}

function getPopupHtml(scan: Scan) {
  return `<div style="color: #333; font-family: sans-serif;">
    <strong style="font-size: 14px;">${scan.resolvedLocation || 'Unknown Location'}</strong><br/>
    <span style="font-size: 12px; color: #666;">${new Date(scan.serverTimestamp).toLocaleString()}</span><br/>
    <span style="font-size: 11px; background: #eee; padding: 2px 4px; border-radius: 4px; margin-top: 4px; display: inline-block;">${scan.scanSource}</span>
  </div>`;
}

export default function JourneyMap({ scans }: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const isInitializing = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // ─── 1. INITIALIZATION (Once) ───
    if (!mapRef.current || isInitializing.current) return

    if (!leafletMap.current) {
      isInitializing.current = true
      import('leaflet').then(L => {
        (window as any).L = L
        isInitializing.current = false
        if (!mapRef.current || leafletMap.current) return

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Initial center (use first valid scan or fallback)
        const validScans = scans.filter(s => typeof s.resolvedLat === 'number' && typeof s.resolvedLng === 'number')
        const center: [number, number] = validScans.length > 0 
          ? [validScans[0].resolvedLat!, validScans[0].resolvedLng!] 
          : [28.6139, 77.2090] // fallback to Delhi if no scans

        try {
          const map = L.map(mapRef.current!, {
            center: center,
            zoom: validScans.length <= 1 ? 8 : 4,
            zoomControl: true,
            scrollWheelZoom: true,
          })

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18,
          }).addTo(map)

          leafletMap.current = map
          // Trigger the update logic immediately after init
          triggerUpdate()
        } catch (e) {
          console.error("Leaflet init error:", e)
          isInitializing.current = false
        }
      })
    } else {
      // ─── 2. DATA UPDATES (Prop changes) ───
      triggerUpdate()
    }

    function triggerUpdate() {
      const L = (window as any).L
      const map = leafletMap.current
      if (!L || !map) return

      // Filter to scans that have valid numeric coordinates
      const validScans = scans.filter(s => 
        typeof s.resolvedLat === 'number' && 
        typeof s.resolvedLng === 'number' && 
        !isNaN(s.resolvedLat) && 
        !isNaN(s.resolvedLng)
      )

      const coords = validScans.map(s => [s.resolvedLat!, s.resolvedLng!] as [number, number])

      // Clear existing layers (except tiles)
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer)
        }
      })

      if (validScans.length === 0) return

      // Add polyline
      if (coords.length > 1) {
        L.polyline(coords, { color: '#3B82F6', weight: 4, opacity: 0.8 }).addTo(map)
      }

      // Add markers
      validScans.forEach((scan, index) => {
        const markerColor = getMarkerColor(scan, index, validScans.length)
        const icon = L.divIcon({
          className: '',
          html: getMarkerHtml(scan, markerColor),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
        const popup = getPopupHtml(scan)
        L.marker([scan.resolvedLat!, scan.resolvedLng!], { icon })
          .addTo(map)
          .bindPopup(popup)
      })

      // Smart zoom logic: only refit if coordinate count changes significantly or on first load
      const lastCount = (map as any)._lastScanCount || 0
      if (coords.length > 0 && coords.length !== lastCount) {
        if (coords.length > 1) {
          map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] })
        } else if (coords.length === 1) {
          map.setView(coords[0], 8)
        }
        (map as any)._lastScanCount = coords.length
      }
    }

    // Fullscreen listener
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      setTimeout(() => leafletMap.current?.invalidateSize(), 200)
    }
    document.addEventListener('fullscreenchange', handleFsChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
    }
  }, [scans])

  // Separate effect for full destruction on unmount ONLY
  useEffect(() => {
    return () => {
      if (leafletMap.current) {
        try {
          leafletMap.current.off()
          leafletMap.current.remove()
        } catch (e) {
          console.warn("Leaflet cleanup error:", e)
        }
        leafletMap.current = null
      }
    }
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.log('Fullscreen error:', err)
      // Fallback if browser blocks it:
      setIsFullscreen(!isFullscreen)
      setTimeout(() => leafletMap.current?.invalidateSize(), 200)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={isFullscreen 
        ? "w-screen h-screen bg-[#111827] flex flex-col fixed inset-0 z-[9999]" 
        : "w-full h-80 rounded-2xl overflow-hidden border border-zinc-800 z-0 relative flex flex-col bg-[#111827]"}
    >
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[400] bg-[#0C0F17]/80 hover:bg-white/[0.1] backdrop-blur-md border border-white/[0.1] text-slate-300 p-2.5 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>
      <div ref={mapRef} className="flex-1 w-full z-0 h-full" />
    </div>
  )
}
