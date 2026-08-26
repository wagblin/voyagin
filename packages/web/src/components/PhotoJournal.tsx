import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TripMap } from '@/components/TripMap'
import { WebcamCapture } from '@/components/WebcamCapture'
import { parseLatLngInput } from '@/lib/coordinates'
import { parseTakenAtInput } from '@/lib/dateInput'
import { extractDateTakenFromFile, extractGpsFromFile } from '@/lib/exifLocation'
import { cloudinaryThumbnailUrl } from '@/lib/cloudinary'
import { useAddPhotoMutation, useDeletePhotoMutation, useTripPhotosQuery } from '@/hooks/useTripPhotos'

function formatAsTakenAtInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas disponible sur ce navigateur.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    })
  })
}

function isGeolocationPositionError(
  err: unknown,
): err is { code: number; message: string } {
  return typeof err === 'object' && err !== null && 'code' in err && 'message' in err
}

function describeGeolocationError(err: unknown): string {
  if (isGeolocationPositionError(err)) {
    switch (err.code) {
      case 1:
        return 'Localisation refusée — vérifie les autorisations de site dans ton navigateur.'
      case 2:
        return 'Position indisponible pour le moment.'
      case 3:
        return 'La récupération de la position a pris trop de temps.'
      default:
        return 'Impossible de récupérer la position.'
    }
  }
  return err instanceof Error ? err.message : 'Impossible de récupérer la position.'
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
  const [takenAt, setTakenAt] = useState('')
  const [caption, setCaption] = useState('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    if (!previewUrl) {
      return
    }
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function handleUseMyLocation() {
    setLocationError(null)
    setIsLocating(true)
    try {
      const position = await getCurrentPosition()
      setLatitude(String(position.coords.latitude))
      setLongitude(String(position.coords.longitude))
    } catch (err) {
      setLocationError(describeGeolocationError(err))
    } finally {
      setIsLocating(false)
    }
  }

  function handleWebcamCapture(capturedFile: File) {
    setFile(capturedFile)
    setTakenAt(formatAsTakenAtInput(new Date()))
    if (latitude.trim() === '' && longitude.trim() === '') {
      void handleUseMyLocation()
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null
    setFile(selectedFile)

    if (!selectedFile) {
      return
    }

    const coordinates = await extractGpsFromFile(selectedFile)
    if (coordinates && latitude.trim() === '' && longitude.trim() === '') {
      setLatitude(String(coordinates.latitude))
      setLongitude(String(coordinates.longitude))
    } else if (!coordinates && latitude.trim() === '' && longitude.trim() === '') {
      // Best-effort fallback for a freshly-captured photo (e.g. iOS Safari's "Prendre une
      // photo" file-input option), which typically has no EXIF GPS to extract — silently try
      // the browser's live position instead, matching mobile's camera-capture behavior. Never
      // surfaces an error here (unlike the explicit "Ma position" button): if it fails, the
      // fields just stay empty, exactly as they already do today.
      try {
        const position = await getCurrentPosition()
        setLatitude(String(position.coords.latitude))
        setLongitude(String(position.coords.longitude))
      } catch {
        // best-effort only, ignore
      }
    }

    const dateTaken = await extractDateTakenFromFile(selectedFile)
    if (dateTaken && takenAt.trim() === '') {
      setTakenAt(dateTaken)
    } else if (!dateTaken && takenAt.trim() === '') {
      // Same reasoning as above: a freshly-captured photo has no EXIF DateTimeOriginal to
      // extract, so default to "now" (matching mobile's camera-capture behavior) instead of
      // leaving the field empty.
      setTakenAt(formatAsTakenAtInput(new Date()))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      return
    }
    const parsedLocation = parseLatLngInput(latitude, longitude)
    if (parsedLocation.kind === 'invalid') {
      return
    }
    const parsedTakenAt = parseTakenAtInput(takenAt)
    if (parsedTakenAt.kind === 'invalid') {
      return
    }
    await addPhoto.mutateAsync({
      file,
      ...(parsedLocation.kind === 'valid'
        ? { latitude: parsedLocation.latitude, longitude: parsedLocation.longitude }
        : {}),
      takenAt: parsedTakenAt.kind === 'valid' ? parsedTakenAt.date.toISOString() : new Date().toISOString(),
      ...(caption.trim() ? { caption: caption.trim() } : {}),
    })
    setFile(null)
    setLatitude('')
    setLongitude('')
    setTakenAt('')
    setCaption('')
  }

  function handleCancelPhoto() {
    setFile(null)
    setLatitude('')
    setLongitude('')
    setTakenAt('')
    setCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
        {file === null ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="photo-file">Photo</Label>
            <Input
              id="photo-file"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(event) => void handleFileChange(event)}
            />
            <WebcamCapture onCapture={handleWebcamCapture} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {previewUrl && (
              <img src={previewUrl} alt="Aperçu" className="aspect-square w-40 rounded-lg object-cover" />
            )}

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
              <Button type="button" onClick={() => void handleUseMyLocation()} disabled={isLocating}>
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="photo-taken-at">Date de prise</Label>
              <Input
                id="photo-taken-at"
                type="datetime-local"
                value={takenAt}
                onChange={(event) => setTakenAt(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={
                addPhoto.isPending ||
                parseLatLngInput(latitude, longitude).kind === 'invalid' ||
                parseTakenAtInput(takenAt).kind === 'invalid'
              }
            >
              {addPhoto.isPending ? 'Envoi…' : 'Ajouter la photo'}
            </Button>
            {addPhoto.isError && <p className="text-sm text-destructive">{addPhoto.error.message}</p>}

            <Button type="button" variant="outline" onClick={handleCancelPhoto}>
              Annuler
            </Button>
          </div>
        )}
      </form>

      {photosQuery.isPending && <p className="text-sm text-muted-foreground">Chargement des photos…</p>}
      {photosQuery.isError && <p className="text-sm text-destructive">{photosQuery.error.message}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-col gap-1">
              <img
                src={cloudinaryThumbnailUrl(photo.imageUrl, 300)}
                alt={photo.caption ?? ''}
                className="aspect-square w-full rounded-lg object-cover"
              />
              {photo.caption && <p className="text-xs text-muted-foreground">{photo.caption}</p>}
              {(photo.uploaderId === currentUserId || canDeleteAnyPhoto) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
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
