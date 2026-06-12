import { Fragment } from "react";
import starIcon from "../../assets/star.png";
import stepExplore from "../../assets/steps.png";
import stepBook from "../../assets/steps copy.png";
import stepGrow from "../../assets/steps copy 2.png";
import { C, FB, FH } from "./tokens";
import { Reveal } from "./Reveal";

const steps = [
  {
    n: 1,
    title: "Explore",
    desc: "Browse curated activities matched to your child's age and interests.",
    img: stepExplore,
    themeColor: "#15A69D",
  },
  {
    n: 2,
    title: "Book & Connect",
    desc: "Schedule a session with a verified expert at a time that suits you.",
    img: stepBook,
    themeColor: "#fac04c",
  },
  {
    n: 3,
    title: "Track & Grow",
    desc: "Watch your child's skills develop with every session.",
    img: stepGrow,
    themeColor: "#9B77FF",
  },
];

// Reusable dashed arrow component
function DashedArrow() {
  return (
    <div className="arrow-wrapper">
      <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
        <line x1="0" y1="12" x2="52" y2="12" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M46 6L54 12L46 18" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-pad" style={{ background: "#fbfaf8", padding: "100px 48px", borderTop: "1px solid #E6F7F7" }}>
      <style>
        {`
          .steps-container {
            display: flex;
            align-items: center;
            justify-content: center;
            max-width: 1040px;
            margin: 0 auto;
            gap: 16px;
          }
          
          .step-card {
            flex: 1;
            position: relative;
            background: #FFFFFF;
            border-radius: 16px;
            padding: 48px 24px 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .arrow-wrapper {
            flex: 0 0 60px;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          /* Mobile responsiveness */
          @media (max-width: 850px) {
            .steps-container {
              flex-direction: column;
              gap: 48px;
            }
            .arrow-wrapper {
              display: none; /* Hide arrows on mobile */
            }
            .step-card {
              width: 100%;
              max-width: 400px;
            }
          }
        `}
      </style>

      <Reveal style={{ textAlign: "center", marginBottom: 72 }}>
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
          <img src={starIcon} alt="" aria-hidden="true" style={{ height: 13 }} /> How It Works
        </p>
        <h2 style={{
          fontFamily: FH, fontWeight: 900,
          fontSize: "clamp(28px, 3.5vw, 40px)",
          color: "#1E293B", // Deep navy/slate
          lineHeight: 1.15, margin: 0,
        }}>
          Simple steps. Big impact.
        </h2>
      </Reveal>

      <div className="steps-container">
        {steps.map((step, i) => (
          <Fragment key={step.title}>
            <Reveal delay={i * 0.1} style={{ display: "flex", width: "100%", justifyContent: "center" }}>
              <div className="step-card" style={{ border: `2.5px solid ${step.themeColor}33` }}>
                
                {/* Floating Number Badge (Top Left) */}
                <div style={{
                  position: "absolute",
                  top: -16,
                  left: -16,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: step.themeColor,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FH,
                  fontWeight: 800,
                  fontSize: 14,
                }}>
                  {step.n}
                </div>

                {/* Step Illustration */}
                <img
                  src={step.img}
                  alt={step.title}
                  style={{ width: 180, height: 170, objectFit: "contain", marginBottom: 24 }}
                />

                {/* Text Content */}
                <h3 style={{
                  fontFamily: FH, fontWeight: 800, fontSize: 18,
                  color: step.themeColor, margin: "0 0 12px",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: FB, fontSize: 14, color: "#64748B",
                  lineHeight: 1.6, margin: "0 auto", maxWidth: 220,
                }}>
                  {step.desc}
                </p>

              </div>
            </Reveal>

            {/* Insert arrow between cards (but not after the last one) */}
            {i < steps.length - 1 && (
              <Reveal delay={i * 0.15}>
                <DashedArrow />
              </Reveal>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}