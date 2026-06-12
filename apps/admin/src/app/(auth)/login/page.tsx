'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const supabase = createSupabaseBrowserClient()
    console.log('Attempting sign-in with email:', email, password ? '********' : '(no password)')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    console.log('Sign-in result:', { authError })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    console.log("✅ Sign-in successful, redirecting to dashboard...")
    router.push('/')
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="auth-split">

        {/* Left brand panel */}
        <div className="auth-split__brand">
          <img src="/beam-admin.png" alt="Beam" className="auth-split__logo" />

          <div className="auth-split__body">
            <h1 className="auth-split__title">Your command<br />center for Beam</h1>
            <p className="auth-split__desc">
              Manage India's learning marketplace — bookings, teachers, payments, and quality from one place.
            </p>
            <ul className="auth-split__features">
              <li>Real-time session monitoring & SOS alerts</li>
              <li>Teacher verification pipeline</li>
              <li>Revenue & payout management</li>
              <li>Curriculum & activity controls</li>
            </ul>
          </div>

          <p className="auth-split__bottom">© 2024 Beam Ed-Tech · India-first learning marketplace</p>
        </div>

        {/* Right form panel */}
        <div className="auth-split__form">
          <div className="auth-card">
            <div className="auth-card__header">
              <div className="auth-card__badge">Admin Portal</div>
              <h2 className="auth-card__title">Welcome back</h2>
              <p className="auth-card__sub">Sign in to continue to your dashboard</p>
            </div>

            <form className="auth-card__form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="form-input-wrapper">
                  <IconMail />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="admin@beamapp.co"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="form-input-wrapper">
                  <IconLock />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 8, textAlign: 'center' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={`btn btn--primary auth-card__submit ${loading ? 'btn--loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in to Dashboard'}
              </button>
            </form>

            <div className="auth-card__footer">
              <p>Access restricted to Beam admin and ops team</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function IconMail() {
  return (
    <svg className="form-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="form-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
