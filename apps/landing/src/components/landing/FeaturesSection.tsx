import starIcon from "../../assets/star.png";
import featPersonalized from "../../assets/features.png";
import featVerified from "../../assets/features copy.png";
import featHome from "../../assets/features copy 2.png";
import featSafe from "../../assets/features copy 3.png";
import featProgress from "../../assets/features copy 4.png";
import featRewards from "../../assets/features copy 5.png";
import { C, FB, FH } from "./tokens";
import { Reveal } from "./Reveal";

const features = [
  {
    title: "Personalized for Your Child",
    sub: "Age-based recommendations",
    img: featPersonalized,
  },
  {
    title: "Verified Experts",
    sub: "Background-checked teachers",
    img: featVerified,
  },
  {
    title: "At-Home Convenience",
    sub: "Sessions at your schedule",
    img: featHome,
  },
  {
    title: "Safe & Secure",
    sub: "Child safety first, encrypted payments",
    img: featSafe,
  },
  {
    title: "Progress Tracking",
    sub: "Visual milestone reports",
    img: featProgress,
  },
  {
    title: "Rewards & Streaks",
    sub: "Celebrate every win",
    img: featRewards,
  },
];

export function FeaturesSection() {
  return (
    <section
      className="section-pad"
      id="features"
      style={{ background: "#fffefd", padding: "100px 48px", position: "relative", overflow: "hidden" }}
    >
      <style>
        {`
          .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            max-width: 1080px;
            margin: 0 auto;
          }
          
          .feature-card {
            background: #FFFFFF;
            border: 1px solid #F1F5F9;
            border-radius: 20px;
            padding: 40px 24px;
            min-height: 280px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .feature-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.05);
          }

          /* Mobile responsiveness */
          @media (max-width: 900px) {
            .features-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 600px) {
            .features-grid {
              grid-template-columns: 1fr;
            }
            .feature-card { min-height: auto; padding: 32px 20px; }
          }
        `}
      </style>

      {/* Decorative Background Elements */}
      <div style={{ position: "absolute", top: 120, left: "10%", pointerEvents: "none" }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M5 5 L12 8 L8 12 Z" fill="#FFC554" />
          <path d="M10 15 C 20 10, 30 20, 25 35" stroke="#9B77FF" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      
      <div style={{ position: "absolute", top: 80, right: "12%", pointerEvents: "none" }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 0 L24 12 L36 12 L26 20 L30 32 L20 24 L10 32 L14 20 L4 12 L16 12 Z" fill="#FFC554" />
          <circle cx="35" cy="30" r="3" fill="#FF6B6B" />
        </svg>
      </div>

      <div style={{ position: "absolute", bottom: "30%", left: "8%", pointerEvents: "none" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#FDE68A" />
          <circle cx="20" cy="2" r="3" fill="#15A69D" />
        </svg>
      </div>

      <div style={{ position: "absolute", bottom: "20%", right: "10%", pointerEvents: "none" }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="12" fill="#FFC0C0" opacity="0.6" />
          <path d="M16 20 L19 23 L25 16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          {/* Top pill shape */}
          <p style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#FFF3C4",
            color: "#C68A00",
            padding: "6px 16px",
            borderRadius: 100,
            fontFamily: FH,
            fontWeight: 800,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            margin: "0 0 16px",
          }}>
            <img src={starIcon} alt="" aria-hidden="true" style={{ height: 13 }} /> Why Parents Love Beam
          </p>
          <h2 style={{
            fontFamily: FH, fontWeight: 900,
            fontSize: "clamp(26px, 3vw, 40px)",
            color: "#1E293B", // Deep navy
            margin: 0, lineHeight: 1.15,
          }}>
            Everything you need, all in one place
          </h2>
        </Reveal>

        <div className="features-grid">
          {features.map(({ title, sub, img }, i) => (
            <Reveal key={title} delay={i * 0.07}>
              <div className="feature-card">

                {/* Feature Illustration */}
                <img
                  src={img}
                  alt={title}
                  style={{ width: 200, height: 200, objectFit: "contain", marginBottom: 20 }}
                />
                
                {/* Text Content */}
                <div style={{
                  fontFamily: FH, fontWeight: 800, fontSize: 17,
                  color: "#1E293B", textAlign: "center",
                  marginBottom: 10,
                }}>
                  {title}
                </div>
                <div style={{
                  fontFamily: FB, fontSize: 14, color: "#64748B",
                  lineHeight: 1.6, maxWidth: 200, margin: "0 auto",
                  textAlign: "center",
                }}>
                  {sub}
                </div>
                
              </div>
            </Reveal>
          ))}
        </div>
        
      </div>
    </section>
  );
}