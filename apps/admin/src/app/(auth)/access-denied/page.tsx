import Link from 'next/link'

export default function AccessDeniedPage() {
  return (
    <main className="auth-page">
      <section className="auth-card access-card" aria-labelledby="access-denied-title">
        <div className="auth-card__context">
          <div className="auth-card__badge">Restricted Area</div>
        </div>

        <div className="access-card__mark" aria-hidden="true">
          !
        </div>

        <div className="auth-card__header">
          <h1 className="auth-card__title" id="access-denied-title">Access denied</h1>
          <p className="auth-card__sub">
            This surface is reserved for super admins because it can change platform settings or expose audit history.
          </p>
        </div>

        <div className="access-card__actions">
          <Link className="btn btn--primary" href="/">
            Back to dashboard
          </Link>
          <Link className="btn btn--secondary" href="/login">
            Switch preview role
          </Link>
        </div>
      </section>
    </main>
  )
}
