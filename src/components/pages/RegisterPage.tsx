import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { authService } from '@/services'
import { useAuthStore } from '@/store'
import { Spinner } from '@/components/ui'

export function RegisterPage() {
  const [orgName, setOrgName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setTokens } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim() || !email.trim() || !password) {
      setError('Organization name, email, and password are required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const tokens = await authService.register({ org_name: orgName, email, password, name })
      setTokens(tokens.access_token, tokens.refresh_token)
      navigate('/')
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message ?? 'Could not create your organization. Please try again.')
    } finally {
      setLoading(false)
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
            Create your organization
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-7">
            You'll be the admin of a brand-new Mengu workspace
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Organization Name
              </label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corp"
                className="input-field"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Your Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alice Smith"
                className="input-field"
              />
            </div>
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
                placeholder="Minimum 8 characters"
                className="input-field"
                autoComplete="new-password"
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
              Create Organization
            </button>
          </form>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-magenta-500 hover:underline">
              Sign in
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
