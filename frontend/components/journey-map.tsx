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

export default function JourneyMap({ scans }: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const isInitializing = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!mapRef.current || leafletMap.current || isInitializing.current) return

    // Filter to scans that have valid numeric coordinates
    const validScans = scans.filter(s => 
      typeof s.resolvedLat === 'number' && 
      typeof s.resolvedLng === 'number' && 
      !isNaN(s.resolvedLat) && 
      !isNaN(s.resolvedLng)
    )

    if (validScans.length === 0) return

    const coords = validScans.map(s => [s.resolvedLat!, s.resolvedLng!] as [number, number])

    const getMarkerColor = (scan: Scan, index: number, total: number) => {
      const isFirst = index === 0
      const isLast = index === total - 1
      const isMachine = scan.scanSource === 'MACHINE'
      if (scan.ipIsProxy) return '#EF4444'         // red
      if (isMachine) return '#F59E0B'              // amber
      if (isFirst) return '#10B981'                // green
      if (isLast) return '#F59E0B'                 // gold
      return '#3B82F6'                             // blue
    }

    const getMarkerHtml = (scan: Scan, color: string) => `
      <div style="
        width: 32px; height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: bold; color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">${scan.scanNumber}</div>
    `

    const getPopupHtml = (scan: Scan) => {
      const date = new Date(scan.serverTimestamp).toLocaleString()
      const isMachine = scan.scanSource === 'MACHINE'
      const deviceLabel = isMachine
        ? `🏭 ${scan.machineModel || 'Machine Scanner'}`
        : `📱 ${scan.deviceType || 'Browser'} / ${scan.os || 'OS'}`
      const ipLabel = scan.ipCountryName ? `🌐 ${scan.ipCountryName}` : ''
      const anchorBadge = scan.anchoredOnChain
        ? `<div style="margin-top:6px; padding-top:6px; border-top:1px solid #eee;"><a href="https://stellar.expert/explorer/testnet/tx/${scan.anchorTxId}" target="_blank" style="color:#10B981;font-size:11px;text-decoration:none;font-weight:bold;">⛓️ Verified on Stellar</a></div>`
        : ''

      return `
        <div style="font-family:sans-serif; min-width:220px; padding: 4px;">
          <div style="font-weight:bold; font-size:14px; margin-bottom:6px; color: #111827;">Checkpoint #${scan.scanNumber}</div>
          <div style="font-size:13px; color:#374151; font-weight: 500; margin-bottom:4px;">${scan.resolvedLocation || `${scan.ipCountry || 'Unknown Transit Hub'}`}</div>
          <div style="font-size:11px; color:#6B7280; line-height: 1.5; margin-top:6px;">
            <strong>Time:</strong> ${date}<br/>
            <strong>Device:</strong> ${deviceLabel}<br/>
            ${ipLabel ? `<strong>Region:</strong> ${ipLabel}<br/>` : ''}
            ${anchorBadge}
          </div>
        </div>
      `
    }

    // ─── Update existing map if initialized ───
    if (leafletMap.current) {
      const L = (window as any).L
      if (!L) return

      leafletMap.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          leafletMap.current.removeLayer(layer)
        }
      })

      if (coords.length > 1) {
        L.polyline(coords, { color: '#3B82F6', weight: 4, opacity: 0.8 }).addTo(leafletMap.current)
      }

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
          .addTo(leafletMap.current)
          .bindPopup(popup)
      })

      if (coords.length !== (leafletMap.current as any)._lastScanCount) {
        if (coords.length > 1) leafletMap.current.fitBounds(L.latLngBounds(coords), { padding: [50, 50] })
        (leafletMap.current as any)._lastScanCount = coords.length
      }
      return
    }

    if (isInitializing.current) return
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

      const avgLat = coords.reduce((a, c) => a + c[0], 0) / coords.length
      const avgLng = coords.reduce((a, c) => a + c[1], 0) / coords.length

      try {
        const map = L.map(mapRef.current!, {
          center: [avgLat, avgLng],
          zoom: coords.length === 1 ? 8 : 4,
          zoomControl: true,
          scrollWheelZoom: true,
        })
        leafletMap.current = map
      } catch (e) {
        console.error("Leaflet init error:", e)
        isInitializing.current = false
        return
      }

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(leafletMap.current)

      if (coords.length > 1) {
        L.polyline(coords, { color: '#3B82F6', weight: 4, opacity: 0.8 }).addTo(leafletMap.current)
      }

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
          .addTo(leafletMap.current)
          .bindPopup(popup)
      })

      if (coords.length > 1) leafletMap.current.fitBounds(L.latLngBounds(coords), { padding: [50, 50] })
      (leafletMap.current as any)._lastScanCount = coords.length
    })

    // Listen for Escape key and native fullscreen exit events
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement
      setIsFullscreen(isFs)
      setTimeout(() => leafletMap.current?.invalidateSize(), 200)
    }
    document.addEventListener('fullscreenchange', handleFsChange)

    // Cleanup on unmount
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      isInitializing.current = false
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
  }, [scans])

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
