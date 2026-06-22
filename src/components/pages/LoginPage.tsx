import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { authService } from '@/services'
import { useAuthStore } from '@/store'
import { Spinner } from '@/components/ui'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setTokens } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // The real backend's OAuth callback redirects here with tokens (or an
  // error) in the query string — see internal/auth/handler.go OAuthCallback.
  // Example success: /login?access_token=...&refresh_token=...
  // Example failure: /login?error=oauth_failed
  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const oauthError = searchParams.get('error')
    const integration = searchParams.get('integration')
    const status = searchParams.get('status')

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken)
      navigate('/', { replace: true })
      return
    }
    if (oauthError) {
      setError(
        oauthError === 'missing_params' ? 'OAuth response was incomplete. Please try again.' :
        oauthError === 'integration_failed' ? 'Failed to connect the integration.' :
        oauthError === 'oauth_failed' ? 'Google sign-in failed. Please try again.' :
        'Sign-in failed. Please try again.'
      )
    }
    if (integration && status === 'connected') {
      // User came back from connecting Gmail/Calendar mid-session, but their
      // session is gone (OAuth callback always lands on /login). Nothing to
      // recover here automatically — just let them log back in.
      setError(`${integration} connected. Please sign in to continue.`)
    }
  }, [searchParams, setTokens, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const tokens = await authService.login(email, password)
      setTokens(tokens.access_token, tokens.refresh_token)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      const url = await authService.getGoogleOAuthUrl()
      window.location.href = url
    } catch {
      setError('Could not start Google sign-in. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-magenta-500 rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </div>
          <span className="text-xl font-medium text-gray-900 dark:text-gray-100">Mengu AI</span>
        </div>

        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl p-8">
          <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center mb-1">
            Sign in to Platform
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-7">
            AI Execution Layer for Enterprise Operations
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 border border-gray-200 dark:border-navy-600 rounded-lg px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors mb-2.5"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100 dark:bg-navy-600" />
            <span className="text-xs text-gray-400 dark:text-gray-500">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-navy-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.kz"
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-magenta-500 hover:bg-magenta-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Spinner className="text-white" /> : null}
              Sign in to Mengu
            </button>
          </form>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-5">
            No account yet?{' '}
            <Link to="/register" className="text-magenta-500 hover:underline">
              Create your organization
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          © 2026 Mengu AI — Confidential
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
