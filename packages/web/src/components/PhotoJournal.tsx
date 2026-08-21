import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TripMap } from '@/components/TripMap'
import { useAddPhotoMutation, useDeletePhotoMutation, useTripPhotosQuery } from '@/hooks/useTripPhotos'

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas disponible sur ce navigateur.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject)
  })
}

interface PhotoJournalProps {
  tripId: string
  currentUserId: string | undefined
  canDeleteAnyPhoto: boolean
}

export function PhotoJournal({ tripId, currentUserId, canDeleteAnyPhoto }: PhotoJournalProps) {
  const photosQuery = useTripPhotosQuery(tripId)
  const addPhoto = useAddPhotoMutation(tripId)
  const deletePhoto = useDeletePhotoMutation(tripId)

  const [file, setFile] = useState<File | null>(null)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [caption, setCaption] = useState('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  async function handleUseMyLocation() {
    setLocationError(null)
    setIsLocating(true)
    try {
      const position = await getCurrentPosition()
      setLatitude(String(position.coords.latitude))
      setLongitude(String(position.coords.longitude))
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Impossible de récupérer la position.')
    } finally {
      setIsLocating(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file || latitude.trim() === '' || longitude.trim() === '') {
      return
    }
    await addPhoto.mutateAsync({
      file,
      latitude: Number(latitude),
      longitude: Number(longitude),
      ...(caption.trim() ? { caption: caption.trim() } : {}),
    })
    setFile(null)
    setLatitude('')
    setLongitude('')
    setCaption('')
  }

  async function handleDelete(photoId: string) {
    if (!window.confirm('Supprimer cette photo ?')) {
      return
    }
    await deletePhoto.mutateAsync(photoId)
  }

  const photos = photosQuery.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium">Carnet photo</p>

      <TripMap photos={photos} />

      <form className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="photo-file">Photo</Label>
          <Input
            id="photo-file"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="photo-latitude">Latitude</Label>
            <Input
              id="photo-latitude"
              inputMode="decimal"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="photo-longitude">Longitude</Label>
            <Input
              id="photo-longitude"
              inputMode="decimal"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={() => void handleUseMyLocation()} disabled={isLocating}>
            {isLocating ? '…' : 'Ma position'}
          </Button>
        </div>
        {locationError && <p className="text-sm text-destructive">{locationError}</p>}

        <div className="flex flex-col gap-2">
          <Label htmlFor="photo-caption">Légende (optionnel)</Label>
          <Input
            id="photo-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        </div>

        <Button type="submit" disabled={addPhoto.isPending || !file}>
          {addPhoto.isPending ? 'Envoi…' : 'Ajouter la photo'}
        </Button>
        {addPhoto.isError && <p className="text-sm text-destructive">{addPhoto.error.message}</p>}
      </form>

      {photosQuery.isPending && <p className="text-sm text-muted-foreground">Chargement des photos…</p>}
      {photosQuery.isError && <p className="text-sm text-destructive">{photosQuery.error.message}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-col gap-1">
              <img
                src={photo.imageUrl}
                alt={photo.caption ?? ''}
                className="aspect-square w-full rounded-lg object-cover"
              />
              {photo.caption && <p className="text-xs text-muted-foreground">{photo.caption}</p>}
              {(photo.uploaderId === currentUserId || canDeleteAnyPhoto) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deletePhoto.isPending}
                  onClick={() => void handleDelete(photo.id)}
                >
                  Supprimer
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {deletePhoto.isError && <p className="text-sm text-destructive">{deletePhoto.error.message}</p>}
    </div>
  )
}
