import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, BadgeCheck, Star } from "lucide-react";
import starIcon from "../../assets/star.png";
import { C, FB, FH } from "./tokens";
import { Reveal } from "./Reveal";

const testimonials = [
  {
    quote: "Beam has completely transformed how Aarav spends his afternoons. The teachers are warm, patient, and genuinely talented. We've seen such a visible improvement in his confidence.",
    name: "Neha S.",
    role: "Parent of 7-year-old",
    location: "Mumbai",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
    activity: "Art & Craft",
  },
  {
    quote: "My daughter used to resist any learning at home. Now she looks forward to every Beam session! The booking process is seamless and the quality of experts is outstanding.",
    name: "Priya M.",
    role: "Parent of 9-year-old",
    location: "Bangalore",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&q=80",
    activity: "Music",
  },
  {
    quote: "The verified experts gave me complete peace of mind. As a working parent I needed something reliable — Beam delivers exceptional quality every single session, without fail.",
    name: "Rohan K.",
    role: "Parent of 6-year-old",
    location: "Delhi",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
    activity: "STEM",
  },
  {
    quote: "We tried three other platforms before Beam. Nothing comes close. The personalisation, the teachers, the progress reports — it's clear Beam was built by people who truly care about children.",
    name: "Ananya T.",
    role: "Parent of 8-year-old",
    location: "Pune",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    activity: "Dance",
  },
];

function StarRating() {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={18} fill="#FFC554" color="#FFC554" strokeWidth={0} />
      ))}
    </div>
  );
}

export function SocialProof() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);

  const go = useCallback((next: number, direction: 1 | -1) => {
    if (animating) return;
    setDir(direction);
    setAnimating(true);
    setTimeout(() => {
      setActive(next);
      setAnimating(false);
    }, 280);
  }, [animating]);

  const prev = () => go((active - 1 + testimonials.length) % testimonials.length, -1);
  const next = useCallback(() => go((active + 1) % testimonials.length, 1), [active, go]);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  const t = testimonials[active];

  return (
    <section
      id="stories"
      className="section-pad"
      style={{ background: "#fbfaf8", padding: "100px 48px", position: "relative", overflow: "hidden" }}
    >
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,168,179,.06), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,168,179,.04), transparent 70%)", pointerEvents: "none" }} />

      <style>{`
        .sp-card {
          background: #FFFFFF;
          border: 1.5px solid rgba(28,168,179,.1);
          border-radius: 28px;
          padding: 52px 56px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 8px 48px rgba(0,0,0,.04);
          position: relative;
        }
        @media (max-width: 768px) {
          .sp-card { padding: 32px 24px; max-width: 100%; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#FFF3C4", color: "#C68A00",
            padding: "6px 16px", borderRadius: 100,
            fontFamily: FH, fontWeight: 800, fontSize: 11,
            textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 16px",
          }}>
            <img src={starIcon} alt="" aria-hidden="true" style={{ height: 13 }} /> Real Stories
          </p>
          <h2 style={{
            fontFamily: FH, fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 40px)",
            color: "#1E293B", margin: 0, lineHeight: 1.15,
          }}>
            Loved by families across India
          </h2>
        </Reveal>

        {/* Testimonial card */}
        <Reveal>
          <div className="sp-card">

            {/* Large decorative quote */}
            {/* <div style={{
              position: "absolute", top: 28, left: 44,
              fontFamily: "Georgia, serif", fontSize: 96,
              lineHeight: 1, color: "rgba(28,168,179,.1)",
              userSelect: "none", pointerEvents: "none",
            }}>
              "
            </div> */}

            {/* Counter */}
            <div style={{
              position: "absolute", top: 28, right: 40,
              fontFamily: FH, fontWeight: 700, fontSize: 13, color: "#CBD5E1",
            }}>
              {String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
            </div>

            {/* Content */}
            <div style={{
              opacity: animating ? 0 : 1,
              transform: animating ? `translateX(${dir * -24}px)` : "translateX(0)",
              transition: "opacity .28s ease, transform .28s ease",
            }}>
              <StarRating />

              <p style={{
                fontFamily: FB, fontSize: 18, color: "#334155",
                lineHeight: 1.75, margin: "0 0 32px",
                fontStyle: "italic", fontWeight: 500,
              }}>
                "{t.quote}"
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #EAF6F6" }}>
                    <img src={t.avatar} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: FH, fontWeight: 800, fontSize: 16, color: "#1E293B" }}>{t.name}</span>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        background: "#EAF6F6", color: "#15A69D",
                        fontFamily: FH, fontWeight: 700, fontSize: 11,
                        padding: "2px 8px", borderRadius: 100,
                      }}>
                        <BadgeCheck size={11} strokeWidth={2.5} /> Verified
                      </span>
                    </div>
                    <div style={{ fontFamily: FB, fontSize: 13, color: "#64748B", marginTop: 2 }}>
                      {t.role} · {t.location}
                    </div>
                  </div>
                </div>

                {/* Activity tag */}
                <span style={{
                  fontFamily: FH, fontWeight: 700, fontSize: 12,
                  background: "#F7F5FF", color: "#9B77FF",
                  padding: "6px 14px", borderRadius: 100,
                }}>
                  {t.activity}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32 }}>
              <button
                onClick={prev}
                aria-label="Previous"
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "1.5px solid rgba(28,168,179,0.25)", background: "rgba(28,168,179,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: C.teal, transition: "all .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,168,179,0.15)"; e.currentTarget.style.borderColor = C.teal; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,168,179,0.06)"; e.currentTarget.style.borderColor = "rgba(28,168,179,0.25)"; }}
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i, i > active ? 1 : -1)}
                    aria-label={`Testimonial ${i + 1}`}
                    style={{
                      width: i === active ? 24 : 8, height: 8, borderRadius: 10,
                      background: i === active ? C.teal : "rgba(28,168,179,0.2)",
                      border: "none", cursor: "pointer", padding: 0,
                      transition: "width .3s ease, background .3s ease",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Next"
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "1.5px solid rgba(28,168,179,0.25)", background: "rgba(28,168,179,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: C.teal, transition: "all .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,168,179,0.15)"; e.currentTarget.style.borderColor = C.teal; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,168,179,0.06)"; e.currentTarget.style.borderColor = "rgba(28,168,179,0.25)"; }}
              >
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>

          </div>
        </Reveal>


      </div>
    </section>
  );
}
