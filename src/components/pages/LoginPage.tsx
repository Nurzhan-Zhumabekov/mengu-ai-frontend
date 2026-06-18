import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { authService } from '@/services/api'
import { useAuthStore } from '@/store'
import { Spinner } from '@/components/ui'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // ── Handle OAuth callback (backend redirects to /login?access_token=...&refresh_token=...) ──
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const oauthError = params.get('error')

    if (oauthError) {
      const messages: Record<string, string> = {
        oauth_failed:           'OAuth login failed. Please try again.',
        missing_params:         'OAuth callback missing parameters.',
        integration_failed:     'Failed to connect integration.',
        microsoft_not_configured: 'Microsoft login is not configured yet.',
        oauth_unavailable:      'OAuth service is unavailable.',
      }
      setError(messages[oauthError] ?? 'OAuth error: ' + oauthError)
      // Clean URL
      navigate('/login', { replace: true })
      return
    }

    const oauthResult = authService.handleOAuthCallback()
    if (oauthResult) {
      // OAuth callback with tokens in URL — log user in
      login(oauthResult)
      navigate('/', { replace: true })
    }
  }, [location.search, login, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(email, password)
      login(res)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-magenta-500 rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </div>
          <span className="text-xl font-medium text-gray-900">Mengu AI</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-lg font-medium text-gray-900 text-center mb-1">
            Sign in to Platform
          </h1>
          <p className="text-sm text-gray-500 text-center mb-7">
            AI Execution Layer for Enterprise Operations
          </p>

          {/* OAuth buttons */}
          <button
            type="button"
            onClick={() => authService.loginWithGoogle()}
            className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors mb-2.5"
          >
            <GoogleIcon />
            Sign in with Google Workspace
          </button>
          <button
            type="button"
            onClick={() => authService.loginWithMicrosoft()}
            className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MicrosoftIcon />
            Sign in with Microsoft 365
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
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
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
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

          <p className="text-xs text-gray-400 text-center mt-5">
            No access?{' '}
            <span className="text-magenta-500 cursor-pointer hover:underline">
              Contact your administrator
            </span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 Mengu AI — Confidential
        </p>
      </div>
    </div>
  )
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

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

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022"/>
      <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00"/>
      <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
    </svg>
  )
}
