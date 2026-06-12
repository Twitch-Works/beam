import beamLogo from "../../assets/logo-beam.png";
import starIcon from "../../assets/star.png";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { C, FB, FH } from "./tokens";

const footerCols = [
  {
    heading: "Explore",
    links: [
      { label: "All Activities", href: "#" },
      { label: "At Home", href: "#" },
      { label: "Online", href: "#" },
      { label: "Workshops", href: "#" },
    ],
  },
  {
    heading: "For Parents",
    links: [
      { label: "How it works", href: "#" },
      { label: "Safety", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "FAQs", href: "#" },
    ],
  },
  {
    heading: "For Teachers",
    links: [
      { label: "Teach with us", href: "#" },
      { label: "Resources", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
];

const socialIcons = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: Facebook, label: "Facebook" },
  { Icon: Youtube, label: "Youtube" },
];

const LINK_COLOR = "#6B7E96";
const LINK_HOVER = C.teal;

const colLinkStyle: React.CSSProperties = {
  fontFamily: FB,
  fontSize: 14,
  color: LINK_COLOR,
  textDecoration: "none",
  display: "block",
  marginBottom: 8,
  transition: "color .2s",
  cursor: "pointer",
};

export function Footer() {
  return (
    <footer
      className="section-pad"
      style={{ background: "#000000", padding: "40px 48px 20px" }}
    >
      <style>{`
        .footer-nav-grid {
          display: flex;
          flex: 2;
          gap: 40px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .footer-main { flex-direction: column !important; gap: 28px !important; }
          .footer-bottom { flex-direction: column !important; align-items: center !important; gap: 8px !important; text-align: center; }
          .footer-brand { text-align: center !important; align-items: center !important; display: flex; flex-direction: column; }
          .footer-nav-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; width: 100%; }
          .footer-col { min-width: unset !important; }
          .footer-logo { height: 60px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Main row */}
        <div
          className="footer-main"
          style={{ display: "flex", gap: 40, marginBottom: 28, flexWrap: "wrap" }}
        >
          {/* Brand col */}
          <div className="footer-brand" style={{ flex: 1.5, minWidth: 200 }}>
            <img src={beamLogo} alt="Beam" className="footer-logo" style={{ height: 82, display: "block", marginBottom: 8 }} />
            <p style={{
              fontFamily: FB, fontSize: 14, color: LINK_COLOR,
              lineHeight: 1.7, margin: "0 0 20px", maxWidth: 220,
              whiteSpace: "pre-line",
            }}>
              {"Meaningful activities.\nTrusted experts.\nHappier kids."}
            </p>
            {/* Social icons */}
            <div style={{ display: "flex", gap: 12 }}>
              {socialIcons.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: LINK_COLOR, textDecoration: "none",
                    transition: "color .2s, background .2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = LINK_HOVER;
                    (e.currentTarget as HTMLElement).style.background = "rgba(28,168,179,0.15)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = LINK_COLOR;
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="footer-nav-grid">
            {footerCols.map(({ heading, links }) => (
              <div key={heading} className="footer-col">
                <h4 style={{
                  fontFamily: FH, fontWeight: 800, fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  textTransform: "uppercase", letterSpacing: 0.8,
                  margin: "0 0 18px",
                }}>
                  {heading}
                </h4>
                {links.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    style={colLinkStyle}
                    onMouseEnter={e => (e.currentTarget.style.color = LINK_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.color = LINK_COLOR)}
                  >
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom" style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <span style={{ fontFamily: FB, fontSize: 13, color: "#475569" }}>
            © 2026 Beam. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            {/* ⚠️ CHANGE NEEDED: Add real links for Privacy Policy and Terms of Service */}
            <a href="#" style={{ fontFamily: FB, fontSize: 13, color: "#475569", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = LINK_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
            >
              Privacy Policy
            </a>
            <span style={{ color: "#334155" }}>·</span>
            <a href="#" style={{ fontFamily: FB, fontSize: 13, color: "#475569", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = LINK_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
            >
              Terms of Service
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
