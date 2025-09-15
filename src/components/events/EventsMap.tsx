'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { EventWithTickets } from '@/types/Event'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface EventsMapProps {
  events: EventWithTickets[]
  selectedEventId?: string | null
  onSelectEvent?: (eventId: string) => void
}

const DEFAULT_CENTER: [number, number] = [46.2276, 2.2137] // France centroid
const DEFAULT_ZOOM = 6

const MapViewport = ({
  events,
  selectedEventId
}: {
  events: EventWithTickets[]
  selectedEventId?: string | null
}) => {
  const map = useMap()

  useEffect(() => {
    if (!events.length) return

    const selected = selectedEventId
      ? events.find((event) => event.id === selectedEventId)
      : undefined

    if (selected) {
      // Zoom sur l'événement sélectionné
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 10), {
        duration: 0.8
      })
      return
    }

    // Si aucun événement sélectionné, vue d'ensemble de la France
    map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, {
      duration: 0.8
    })
  }, [events, selectedEventId, map])

  return null
}

const buildMarkerIcon = (ticketsCount: number, isActive: boolean) => {
  const size = isActive ? 42 : 32
  const anchorY = size
  const background = isActive ? '#ea580c' : '#f97316'
  const shadow = isActive ? 'rgba(234, 88, 12, 0.45)' : 'rgba(249, 115, 22, 0.3)'

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, anchorY],
    popupAnchor: [0, -size + 10],
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; border-radius: 50%; background: ${background}; border: 3px solid white; box-shadow: 0 10px 30px ${shadow};">
        <span style="color: white; font-size: 12px; font-weight: 600;">${ticketsCount}</span>
        <div style="position: absolute; bottom: -8px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${background}; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1));"></div>
      </div>
    `
  })
}

export const EventsMap = ({ events, selectedEventId, onSelectEvent }: EventsMapProps) => {
  const eventsWithCoordinates = useMemo(
    () =>
      events.filter((event) =>
        Number.isFinite(event.latitude) && Number.isFinite(event.longitude)
      ),
    [events]
  )

  const initialCenter = useMemo<[number, number]>(() => {
    // Toujours commencer par la vue France
    return DEFAULT_CENTER
  }, [])

  return (
    <MapContainer
      center={initialCenter}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />

      <MapViewport events={eventsWithCoordinates} selectedEventId={selectedEventId} />

      {eventsWithCoordinates.map((event) => {
        const position: [number, number] = [event.latitude, event.longitude]
        const isActive = event.id === selectedEventId
        const ticketsCount = event.tickets?.length ?? 0

        return (
          <Marker
            key={event.id}
            position={position}
            icon={buildMarkerIcon(ticketsCount, isActive)}
            eventHandlers={{
              click: () => onSelectEvent?.(event.id)
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.location}</p>
                {ticketsCount > 0 && (
                  <p className="text-xs text-muted-foreground">{ticketsCount} ticket(s) disponible(s)</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export default EventsMap