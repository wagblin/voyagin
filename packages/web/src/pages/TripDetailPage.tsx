import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhotoJournal } from '@/components/PhotoJournal'
import { useAuth } from '@/hooks/useAuth'
import {
  useAddParticipantMutation,
  useDeleteTripMutation,
  useRemoveParticipantMutation,
  useTripQuery,
  useUpdateTripMutation,
} from '@/hooks/useTrips'
import { parseTripDateRangeInput } from '@/lib/tripDateRange'

function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tripQuery = useTripQuery(id ?? '')
  const updateTrip = useUpdateTripMutation(id ?? '')
  const deleteTrip = useDeleteTripMutation()
  const addParticipant = useAddParticipantMutation(id ?? '')
  const removeParticipant = useRemoveParticipantMutation(id ?? '')
  const [nameOverride, setNameOverride] = useState<string | undefined>(undefined)
  const [startDateOverride, setStartDateOverride] = useState<string | undefined>(undefined)
  const [endDateOverride, setEndDateOverride] = useState<string | undefined>(undefined)
  const [participantEmail, setParticipantEmail] = useState('')
  const name = nameOverride ?? tripQuery.data?.name ?? ''
  const startDate =
    startDateOverride ??
    (tripQuery.data?.dateRange ? toDateInputValue(tripQuery.data.dateRange.start) : '')
  const endDate =
    endDateOverride ??
    (tripQuery.data?.dateRange ? toDateInputValue(tripQuery.data.dateRange.end) : '')

  async function handleRename(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      return
    }
    const dateRange = parseTripDateRangeInput(startDate, endDate)
    if (dateRange.kind === 'invalid') {
      return
    }
    await updateTrip.mutateAsync({
      name,
      ...(dateRange.kind === 'valid'
        ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
        : {}),
    })
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Supprimer ce voyage ?')) {
      return
    }
    await deleteTrip.mutateAsync(id)
    await navigate('/')
  }

  async function handleAddParticipant(event: FormEvent) {
    event.preventDefault()
    if (!participantEmail.trim()) {
      return
    }
    await addParticipant.mutateAsync(participantEmail)
    setParticipantEmail('')
  }

  async function handleRemoveParticipant(userId: string, name: string) {
    if (!window.confirm(`Retirer ${name} de ce voyage ?`)) {
      return
    }
    await removeParticipant.mutateAsync(userId)
  }

  if (tripQuery.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Chargement…</p>
  }

  if (tripQuery.isError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-8">
        <p className="text-sm text-destructive">{tripQuery.error.message}</p>
        <Link to="/" className="text-sm underline underline-offset-4">
          Retour aux voyages
        </Link>
      </main>
    )
  }

  const trip = tripQuery.data

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Retour aux voyages
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{trip.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form className="flex flex-col gap-2" onSubmit={(event) => void handleRename(event)}>
            <Label htmlFor="trip-name">Nom du voyage</Label>
            <div className="flex gap-2">
              <Input
                id="trip-name"
                value={name}
                onChange={(event) => setNameOverride(event.target.value)}
              />
              <Button type="submit" disabled={updateTrip.isPending}>
                Enregistrer
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="trip-start-date">Date de début</Label>
                <Input
                  id="trip-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDateOverride(event.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="trip-end-date">Date de fin</Label>
                <Input
                  id="trip-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDateOverride(event.target.value)}
                />
              </div>
            </div>
            {updateTrip.isError && (
              <p className="text-sm text-destructive">{updateTrip.error.message}</p>
            )}
          </form>

          <div>
            <p className="text-sm font-medium">Participants</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {trip.participants.map((participant) => (
                <li key={participant.userId} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {participant.name} — {participant.role === 'owner' ? 'organisateur' : 'membre'}
                  </span>
                  {participant.role !== 'owner' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={removeParticipant.isPending}
                      onClick={() => void handleRemoveParticipant(participant.userId, participant.name)}
                    >
                      Retirer
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {removeParticipant.isError && (
              <p className="mt-2 text-sm text-destructive">{removeParticipant.error.message}</p>
            )}

            {trip.participants.some((p) => p.userId === user?.id && p.role === 'owner') && (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => void handleAddParticipant(event)}
              >
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={participantEmail}
                  onChange={(event) => setParticipantEmail(event.target.value)}
                />
                <Button type="submit" variant="outline" disabled={addParticipant.isPending}>
                  Inviter
                </Button>
              </form>
            )}
            {addParticipant.isError && (
              <p className="mt-2 text-sm text-destructive">{addParticipant.error.message}</p>
            )}
          </div>

          <PhotoJournal
            tripId={id ?? ''}
            currentUserId={user?.id}
            canDeleteAnyPhoto={trip.participants.some(
              (p) => p.userId === user?.id && p.role === 'owner',
            )}
          />

          <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleteTrip.isPending}>
            Supprimer ce voyage
          </Button>
          {deleteTrip.isError && (
            <p className="text-sm text-destructive">{deleteTrip.error.message}</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
