import { motion } from "framer-motion";
import homeHero from "../../assets/home-hero.png";
import starIcon from "../../assets/star.png";
import { C, FB, FH } from "./tokens";

interface HeroSectionProps {
  email: string;
  setEmail: (v: string) => void;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
}

export function HeroSection({ email, setEmail, submitted, setSubmitted }: HeroSectionProps) {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section
      className="hero-section"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "100px 48px 80px",
        position: "relative",
        overflow: "hidden",

      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .hero-section { padding: 80px 20px 60px !important; min-height: auto !important; }
          .hero-form { flex-direction: column !important; gap: 12px !important; }
          .hero-form button { width: 100% !important; }
          .hero-img { max-width: 280px !important; margin-top: 32px; }
          .hero-trust { flex-direction: column !important; gap: 10px !important; }
        }
      `}</style>
      {/* BG blobs */}
      <div style={{ position: "absolute", top: -100, right: -80, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle,${C.mint}77,transparent 68%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle,${C.lavender}44,transparent 65%)`, pointerEvents: "none" }} />

      <div
        className="hero-wrap"
        style={{ display: "flex", alignItems: "center", gap: 56, width: "100%", maxWidth: 1200, margin: "0 auto" }}
      >
        {/* Left — copy */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div className="ha" style={{ animationDelay: "0s", marginBottom: 20 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(28,168,179,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(28,168,179,0.25)",
              color: C.teal,
              fontFamily: FH, fontWeight: 700, fontSize: 13,
              borderRadius: 100,
              padding: "8px 18px 8px 8px",
            }}>
              {/* Pulsing dot */}
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative", width: 22, height: 22 }}>
                <span style={{
                  position: "absolute", width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(28,168,179,0.3)",
                  animation: "ping 1.6s cubic-bezier(0,0,.2,1) infinite",
                }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.teal, flexShrink: 0 }} />
              </span>
              <style>{`@keyframes ping { 0%{transform:scale(1);opacity:.9} 75%,100%{transform:scale(2.2);opacity:0} }`}</style>
              Coming Soon
            </span>
          </div>

          <h1
            className="ha"
            style={{ animationDelay: ".1s", fontFamily: FH, fontWeight: 900, fontSize: "clamp(40px,5vw,62px)", lineHeight: 1.07, color: C.navy, margin: "0 0 4px" }}
          >
            Activities that
          </h1>
          <h1
            className="ha"
            style={{ animationDelay: ".16s", fontFamily: FH, fontWeight: 900, fontSize: "clamp(40px,5vw,62px)", lineHeight: 1.07, margin: "0 0 22px" }}
          >
            <span style={{ color: C.teal }}>nurture</span> every child. <img src={starIcon} alt="" aria-hidden="true" style={{ height: "1.1em", display: "inline-block", verticalAlign: "middle", position: "relative", top: "-0.12em" }} />
          </h1>

          <p
            className="ha"
            style={{ animationDelay: ".22s", fontFamily: FB, fontSize: 17, lineHeight: 1.75, color: C.grey, margin: "0 0 32px", maxWidth: 460 }}
          >
            Beam connects families with trusted, verified experts for engaging at-home activities
            that help children learn, play, and grow with confidence.
          </p>

          <div className="ha" style={{ animationDelay: ".28s" }}>
            {submitted ? (
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ background: C.mint, border: `1.5px solid ${C.teal}44`, borderRadius: 14, padding: "16px 20px", fontFamily: FH, fontWeight: 700, fontSize: 16, color: C.tealD, marginBottom: 14 }}
              >
                🎉 You're on the list! We'll be in touch soon.
              </motion.div>
            ) : (
              <form className="hero-form" onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", background: C.white, border: `1.5px solid ${C.lightGrey}`, borderRadius: 100, padding: "0 18px", gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke={C.grey} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or phone number"
                    required
                    style={{ flex: 1, border: "none", outline: "none", fontFamily: FB, fontSize: 14, color: C.navy, background: "transparent", padding: "13px 0" }}
                  />
                </div>
                <button type="submit" className="btn-teal" style={{ padding: "13px 24px", fontSize: 14, whiteSpace: "nowrap" }}>
                  Join Waitlist →
                </button>
              </form>
            )}

            <div className="hero-trust" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["Free to join", "No spam", "Be first to know"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.grey, fontFamily: FB }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — phone screenshot */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.25, type: "spring", stiffness: 72, damping: 18 }}
          style={{ flex: 1, minWidth: 280, display: "flex", justifyContent: "center" }}
        >
          <img className="hero-img" src={homeHero} alt="Beam app screenshot" style={{ maxWidth: "100%", display: "block" }} />
        </motion.div>
      </div>
    </section>
  );
}
