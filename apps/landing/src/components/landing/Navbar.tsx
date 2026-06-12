import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu } from "lucide-react";
import beamLogo from "../../assets/logo-beam.png";
import { C, FB, FH, EB } from "./tokens";

const navLinks = [
  { label: "How it works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Activities", id: "activities" },
  { label: "Stories", id: "stories" },
  { label: "Join Waitlist", id: "waitlist" },
];

interface NavbarProps {
  scrolled: boolean;
  onWaitlistClick: () => void;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Navbar({ scrolled, onWaitlistClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    setTimeout(() => scrollTo(id), 10);
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .nav-root { height: 64px !important; padding: 0 20px !important; }
          .nav-logo { height: 64px !important; }
          .nav-links { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-cta { display: none !important; }
          .nav-drawer { top: 64px !important; }
        }
        @media (min-width: 769px) {
          .nav-hamburger { display: none !important; }
        }
      `}</style>

      <motion.nav
        className="nav-root"
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: EB }}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          background: scrolled ? `${C.cream}f2` : `${C.cream}cc`,
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid rgba(28,168,179,${scrolled ? ".12" : ".06"})`,
          boxShadow: scrolled ? "0 2px 20px rgba(30,41,59,.07)" : "none",
          transition: "all .3s ease",
        }}
      >
        <a href="#" style={{ textDecoration: "none" }}>
          <img src={beamLogo} alt="Beam" className="nav-logo" style={{ height: 100, display: "block" }} />
        </a>

        {/* Desktop links */}
        <div className="nav-links" style={{ display: "flex", gap: 32 }}>
          {navLinks.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: FB, fontWeight: 600, fontSize: 14,
                color: C.navy, transition: "color .18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
              onMouseLeave={e => (e.currentTarget.style.color = C.navy)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <button
          className="btn-teal nav-cta"
          onClick={onWaitlistClick}
          style={{ padding: "11px 26px", fontSize: 14 }}
        >
          Join Waitlist →
        </button>

        {/* Hamburger button (mobile only) */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "none", alignItems: "center", justifyContent: "center",
            padding: 8, color: C.navy,
          }}
        >
          {mobileOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
        </button>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            className="nav-drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 100,
              left: 0, right: 0,
              zIndex: 99,
              background: `${C.cream}f8`,
              backdropFilter: "blur(16px)",
              borderBottom: `1px solid rgba(28,168,179,.1)`,
              padding: "16px 20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: FB, fontWeight: 600, fontSize: 16,
                  color: C.navy, textAlign: "left",
                  padding: "12px 8px",
                  borderRadius: 10,
                  transition: "background .15s, color .15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(28,168,179,.08)";
                  e.currentTarget.style.color = C.teal;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = C.navy;
                }}
              >
                {label}
              </button>
            ))}
            <button
              className="btn-teal"
              onClick={() => { setMobileOpen(false); onWaitlistClick(); }}
              style={{ marginTop: 12, padding: "13px 24px", fontSize: 15, width: "100%" }}
            >
              Join Waitlist →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
