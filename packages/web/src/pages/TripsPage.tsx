import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useCreateTripMutation, useTripsQuery } from '@/hooks/useTrips'

export function TripsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const tripsQuery = useTripsQuery()
  const createTrip = useCreateTripMutation()
  const [name, setName] = useState('')

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      return
    }
    await createTrip.mutateAsync({ name })
    setName('')
  }

  async function handleLogout() {
    await logout()
    await navigate('/login')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mes voyages</h1>
          <p className="text-sm text-muted-foreground">Connecté en tant que {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="link" asChild>
            <Link to="/account">Mon compte</Link>
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => void handleLogout()}
          >
            Déconnexion
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau voyage</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={(event) => void handleCreate(event)}>
            <Input
              placeholder="Nom du voyage"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" disabled={createTrip.isPending}>
              Créer
            </Button>
          </form>
          {createTrip.isError && (
            <p className="mt-2 text-sm text-destructive">{createTrip.error.message}</p>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        {tripsQuery.isPending && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {tripsQuery.isError && (
          <p className="text-sm text-destructive">{tripsQuery.error.message}</p>
        )}
        {tripsQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun voyage pour l'instant.</p>
        )}
        {tripsQuery.data?.map((trip) => (
          <Link key={trip.id} to={`/trips/${trip.id}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex items-center justify-between">
                <span className="font-medium">{trip.name}</span>
                <span className="text-sm text-muted-foreground">
                  {trip.participants.length} participant(s)
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  )
}
