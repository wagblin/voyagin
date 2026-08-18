import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import * as authApi from '@/lib/authApi'
import { clearAuth, getStoredAuth, storeAuth } from '@/lib/authStorage'

export function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleUpdate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const updated = await authApi.updateMe({ name, email })
      const currentAuth = getStoredAuth()
      if (currentAuth) {
        storeAuth(currentAuth.token, updated)
      }
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Supprimer définitivement ton compte ?')) {
      return
    }
    setIsDeleting(true)
    try {
      await authApi.deleteMe()
    } finally {
      clearAuth()
      setIsDeleting(false)
      await navigate('/login')
    }
  }

  async function handleLogout() {
    await logout()
    await navigate('/login')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8">
      <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Retour aux voyages
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-col gap-4" onSubmit={(event) => void handleUpdate(event)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-name">Nom</Label>
              <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mise à jour…' : 'Enregistrer'}
            </Button>
          </form>

          <Button variant="ghost" onClick={() => void handleLogout()}>
            Déconnexion
          </Button>

          <Button variant="destructive" onClick={() => void handleDeleteAccount()} disabled={isDeleting}>
            {isDeleting ? 'Suppression…' : 'Supprimer mon compte'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
