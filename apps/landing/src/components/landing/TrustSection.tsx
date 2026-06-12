import { ShieldCheck, UserCheck, Star, Lock } from "lucide-react";
import { C, FB, FH } from "./tokens";
import { Reveal } from "./Reveal";

const badges = [
  {
    label: "ID Verified",
    sub: "Every expert is identity-verified before going live on Beam.",
    Icon: ShieldCheck,
    iconColor: "#818CF8",
    glow: "#6366F1",
  },
  {
    label: "Background Checked",
    sub: "Thorough screening ensures child safety is never compromised.",
    Icon: UserCheck,
    iconColor: "#60A5FA",
    glow: "#3B82F6",
  },
  {
    label: "Real Parent Reviews",
    sub: "Authentic ratings after every session keep our standards high.",
    Icon: Star,
    iconColor: C.yellow,
    glow: C.yellow,
  },
  {
    label: "Secure Payments",
    sub: "PCI DSS compliant — your financial data stays completely safe.",
    Icon: Lock,
    iconColor: "#34D399",
    glow: "#10B981",
  },
];

export function TrustSection() {
  return (
    <section
      className="section-pad"
      style={{ background: C.navy, padding: "110px 48px", position: "relative", overflow: "hidden" }}
    >
      {/* Subtle warm glow — indigo, not teal */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 700, height: 350, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(99,102,241,.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <Reveal style={{ textAlign: "center", marginBottom: 64, position: "relative" }}>
        <h2 style={{
          fontFamily: FH, fontWeight: 900,
          fontSize: "clamp(24px, 3vw, 42px)",
          color: C.white, margin: "0 0 16px", lineHeight: 1.2,
        }}>
          Built on trust.{" "}
          <span style={{ color: "#A5B4FC" }}>Designed for families.</span>
        </h2>
        <p style={{
          fontFamily: FB, fontSize: 16, color: "#8FA5BE",
          margin: "0 auto", maxWidth: 440, lineHeight: 1.7,
        }}>
          Safety and transparency aren't optional — they're the foundation of everything we build.
        </p>
      </Reveal>

      <div
        className="trust-row"
        style={{ display: "flex", gap: 20, maxWidth: 1080, margin: "0 auto", justifyContent: "center", position: "relative" }}
      >
        {badges.map(({ label, sub, Icon, iconColor, glow }, i) => (
          <Reveal key={label} delay={i * 0.1} style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.07)",
              borderTop: `2px solid ${glow}40`,
              borderRadius: 22,
              padding: "36px 28px",
              display: "flex", flexDirection: "column",
              alignItems: "flex-start", gap: 20,
              height: "100%", boxSizing: "border-box",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: `${glow}16`,
                border: `1px solid ${glow}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={24} color={iconColor} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontFamily: FH, fontWeight: 800, fontSize: 17, color: C.white, marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontFamily: FB, fontSize: 14, color: "#8FA5BE", lineHeight: 1.7 }}>
                  {sub}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
