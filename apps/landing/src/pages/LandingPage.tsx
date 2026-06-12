import { useState, useEffect } from "react";
import { C, FB, FH } from "../components/landing/tokens";
import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { HowItWorks } from "../components/landing/HowItWorks";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { ActivitiesSection } from "../components/landing/ActivitiesSection";
import { WaitlistSection } from "../components/landing/WaitlistSection";
import { SocialProof } from "../components/landing/SocialProof";
import { StatsStrip } from "../components/landing/StatsStrip";
import { Footer } from "../components/landing/Footer";

export function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const toWaitlist = () =>
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: C.cream, color: C.navy, fontFamily: FB, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Rounded:wght@700;800;900&family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        .ha { animation: fadeUp .7s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        .inp {
          width: 100%; font-family: ${FB}; font-size: 14px; color: ${C.navy};
          background: ${C.white}; border: 1.5px solid ${C.lightGrey};
          border-radius: 12px; padding: 13px 16px; outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .inp::placeholder { color: #b0bac5; }
        .inp:focus { border-color: ${C.teal}; box-shadow: 0 0 0 3px ${C.teal}22; }
        .btn-teal {
          background: linear-gradient(135deg, #0F8F9A, ${C.teal}); color: ${C.white};
          border: none; border-radius: 100px; cursor: pointer;
          font-family: ${FH}; font-weight: 800;
          transition: transform .18s, box-shadow .18s;
        }
        .btn-teal:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(15,143,154,.3); }
        .btn-teal:active { transform: scale(.97); }
        .act-card { cursor: default; transition: transform .28s cubic-bezier(0.34,1.56,0.64,1), box-shadow .28s; }
        .act-card:hover { transform: scale(1.03) translateY(-5px); box-shadow: 0 24px 56px rgba(0,0,0,.22) !important; }
        .feat-card { transition: transform .22s, box-shadow .22s, background .22s; }
        .feat-card:hover { transform: translateY(-4px); background: rgba(255,255,255,.18) !important; }
        .step-card { transition: transform .25s, box-shadow .25s; }
        .step-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,.1) !important; }
        @media (max-width: 768px) {
          .section-pad { padding-left: 20px !important; padding-right: 20px !important; padding-top: 60px !important; padding-bottom: 60px !important; }
          .hero-wrap { flex-direction: column !important; align-items: flex-start !important; }
          .hero-wrap > * { min-width: unset !important; width: 100% !important; }
          .footer-main { flex-direction: column !important; gap: 32px !important; }
        }
      `}</style>

      <Navbar scrolled={scrolled} onWaitlistClick={toWaitlist} />
      <HeroSection email={email} setEmail={setEmail} submitted={submitted} setSubmitted={setSubmitted} />
      <StatsStrip />
      <ActivitiesSection />
      <HowItWorks />
      <FeaturesSection />
      <SocialProof />
      <WaitlistSection email={email} setEmail={setEmail} submitted={submitted} setSubmitted={setSubmitted} />

      <Footer />
    </div>
  );
}
