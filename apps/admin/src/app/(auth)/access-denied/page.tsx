import { GoBackButton } from './GoBackButton'

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
            Your account doesn't have access to this area. Sign in with a different account to continue.
          </p>
        </div>

        <div className="access-card__actions">
          <GoBackButton />
        </div>
      </section>
    </main>
  )
}
