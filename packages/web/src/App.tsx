import { Button } from '@/components/ui/button'
import { useHealth } from '@/hooks/useHealth'

function ApiStatus() {
  const health = useHealth()

  if (health.isPending) {
    return <p className="text-sm text-muted-foreground">Connexion à l'API…</p>
  }

  if (health.isError) {
    return <p className="text-sm text-destructive">API injoignable : {health.error.message}</p>
  }

  return <p className="text-sm text-muted-foreground">API : {health.data.status}</p>
}

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">VoyagIn</h1>
      <p className="text-muted-foreground">Le carnet de voyage collaboratif en temps réel.</p>
      <ApiStatus />
      <Button>Commencer un voyage</Button>
    </main>
  )
}

export default App
