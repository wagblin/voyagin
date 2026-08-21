import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { Photo } from '@/lib/photosApi'

// Vite doesn't resolve Leaflet's default marker image paths automatically.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function FitToPhotos({ photos }: { photos: Photo[] }) {
  const map = useMap()

  useEffect(() => {
    if (photos.length === 0) {
      return
    }
    const bounds = L.latLngBounds(
      photos.map((photo) => [photo.location.latitude, photo.location.longitude]),
    )
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
  }, [map, photos])

  return null
}

export function TripMap({ photos }: { photos: Photo[] }) {
  const center: [number, number] =
    photos.length > 0
      ? [photos[0]!.location.latitude, photos[0]!.location.longitude]
      : [20, 0]

  return (
    <MapContainer
      center={center}
      zoom={photos.length > 0 ? 10 : 2}
      scrollWheelZoom
      className="h-80 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToPhotos photos={photos} />
      {photos.map((photo) => (
        <Marker key={photo.id} position={[photo.location.latitude, photo.location.longitude]}>
          <Popup>
            <img src={photo.imageUrl} alt={photo.caption ?? ''} className="mb-2 w-40 rounded" />
            {photo.caption && <p className="text-sm">{photo.caption}</p>}
            <p className="text-xs text-muted-foreground">
              {new Date(photo.takenAt).toLocaleString()}
            </p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
