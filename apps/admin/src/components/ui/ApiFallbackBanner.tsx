type ApiFallbackBannerProps = {
  message?: string
}

export function ApiFallbackBanner({
  message = 'Live API data is unavailable. This page is showing demo data and actions may be disabled.',
}: ApiFallbackBannerProps) {
  return (
    <div
      style={{
        background: '#FFF7ED',
        border: '1px solid #FED7AA',
        borderRadius: 12,
        color: '#9A3412',
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 20,
        padding: '12px 16px',
      }}
    >
      {message}
    </div>
  )
}
