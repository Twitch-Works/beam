import { C, FB } from "../landing/tokens";

const PLAY_STORE_URL = import.meta.env.VITE_PLAY_STORE_URL ?? "https://play.google.com/store/apps/details?id=com.beam.parent";
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL ?? "https://apps.apple.com/in/search?term=beam%20kids";

function StoreButton({ href, label, sub, icon }: { href: string; label: string; sub: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${sub} ${label}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: C.navy, color: C.white, textDecoration: "none",
        borderRadius: 12, padding: "9px 18px 9px 14px", minWidth: 168,
        transition: "transform .18s, box-shadow .18s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(30,41,59,.25)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {icon}
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, fontFamily: FB }}>
        <span style={{ fontSize: 10.5, opacity: 0.8 }}>{sub}</span>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{label}</span>
      </span>
    </a>
  );
}

const AppleIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.67-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.33-3.55ZM14.17 6.13c.61-.74 1.02-1.76.91-2.78-.88.04-1.94.59-2.57 1.32-.56.65-1.06 1.69-.93 2.69.98.08 1.98-.5 2.59-1.23Z" />
  </svg>
);

const PlayIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.6 2.3c-.25.27-.4.68-.4 1.2v17c0 .52.15.93.4 1.2l9.5-9.7-9.5-9.7Z" fill="#34A853" />
    <path d="m16.3 15.2-3.2-3.2 3.2-3.2 3.7 2.1c1.05.6 1.05 1.6 0 2.2l-3.7 2.1Z" fill="#FBBC04" />
    <path d="M16.3 15.2 13.1 12l-9.5 9.7c.35.37.93.42 1.58.05l11.12-6.55Z" fill="#EA4335" />
    <path d="M16.3 8.8 5.18 2.25C4.53 1.88 3.95 1.93 3.6 2.3l9.5 9.7 3.2-3.2Z" fill="#4285F4" />
  </svg>
);

export function AppStoreButtons() {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
      <StoreButton href={PLAY_STORE_URL} sub="GET IT ON" label="Google Play" icon={PlayIcon} />
      <StoreButton href={APP_STORE_URL} sub="Download on the" label="App Store" icon={AppleIcon} />
    </div>
  );
}
