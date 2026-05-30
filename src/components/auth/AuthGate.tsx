import { useState } from 'react'
import { AlertTriangle, Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/providers/AuthProvider'

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95">
        <div className="container mx-auto flex h-14 items-center px-4">
          <h1 className="text-xl font-bold text-primary">Daymark</h1>
        </div>
      </header>
      <main className="container mx-auto flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  )
}

function LoadingScreen() {
  return (
    <AuthShell>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking your session...
      </div>
    </AuthShell>
  )
}

function SupabaseConfigScreen() {
  return (
    <AuthShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Supabase Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Daymark requires sign-in before use, but Supabase is not configured for this
            environment.
          </p>
          <p>
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`, then restart the
            dev server.
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function SignInScreen() {
  const { signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Sign-in failed:', err)
      setError('Could not open the sign-in page. Check your Supabase Google provider and redirect URL settings.')
      setIsSigningIn(false)
    }
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in to load your jobs, resume profile, applications, tasks, and fitness data.
          </p>
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button className="w-full" onClick={handleSignIn} disabled={isSigningIn}>
            {isSigningIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isSigningIn ? 'Opening sign-in...' : 'Continue with Google'}
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, isConfigured } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!isConfigured) return <SupabaseConfigScreen />
  if (!isAuthenticated) return <SignInScreen />

  return <>{children}</>
}
