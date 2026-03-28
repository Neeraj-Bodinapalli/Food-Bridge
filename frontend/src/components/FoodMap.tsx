import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Listing } from '../types'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const markerIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

function MoveReporter({ onMoveEnd }: { onMoveEnd: (c: [number, number]) => void }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter()
      onMoveEnd([c.lat, c.lng])
    },
  })
  return null
}

type Props = {
  center: [number, number]
  listings: Listing[]
  onSelect: (id: string) => void
  reportMoves: boolean
  onMapCenter?: (c: [number, number]) => void
}

export function FoodMap({ center, listings, onSelect, reportMoves, onMapCenter }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="z-0 h-[min(420px,48vh)] w-full overflow-hidden rounded-2xl border border-stone-200/90 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(6,78,59,0.04)] ring-1 ring-black/[0.03] sm:h-[min(520px,56vh)]"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      {reportMoves && onMapCenter ? <MoveReporter onMoveEnd={onMapCenter} /> : null}
      {listings.map((l) => (
        <Marker
          key={l.id}
          position={[l.lat, l.lng]}
          icon={markerIcon}
          eventHandlers={{ click: () => onSelect(l.id) }}
        />
      ))}
    </MapContainer>
  )
}
