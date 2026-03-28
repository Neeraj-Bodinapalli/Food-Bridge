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
      className="z-0 h-[min(480px,50vh)] w-full rounded-xl border border-neutral-200 shadow-sm sm:h-[min(560px,55vh)]"
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
