import { C, FB, FH } from "./tokens";
import { Reveal } from "./Reveal";

// ⚠️ CHANGE NEEDED: Wire this form to your actual backend / email tool
interface WaitlistSectionProps {
  email: string;
  setEmail: (v: string) => void;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
}

export function WaitlistSection({ email, setEmail, submitted, setSubmitted }: WaitlistSectionProps) {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section
      id="waitlist"
      style={{
        background: C.cream,
        padding: "64px 48px 80px",
      }}
    >
      <style>
        {`
          .waitlist-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 40px;
            background: #FFFFFF;
            border: 1px solid rgba(28,168,179,0.15);
            border-radius: 20px;
            padding: 48px 64px;
            max-width: 1040px;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 40px rgba(28,168,179,0.08);
          }

          .wl-form {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }

          .wl-input {
            flex: 1;
            height: 44px;
            border-radius: 6px;
            border: 1.5px solid #D1EAE8;
            padding: 0 16px;
            font-family: ${FB};
            font-size: 14px;
            color: #1E293B;
            outline: none;
            background: #FFFFFF;
            width: 240px;
          }
          
          .wl-input:focus {
            border-color: #15A69D;
            outline: none;
            box-shadow: 0 0 0 3px rgba(28,168,179,0.12);
          }
          .wl-input::placeholder {
            color: #94A3B8;
          }

          .wl-submit-btn {
            padding: 0 24px;
            height: 44px;
            border-radius: 6px;
            font-size: 14px;
            font-family: ${FH};
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            background: #15A69D; /* Teal */
            color: #FFFFFF;
            border: none;
            transition: background 0.2s;
          }

          .wl-submit-btn:hover {
            background: #118C84;
          }

          /* Mobile Responsiveness */
          @media (max-width: 800px) {
            .waitlist-banner {
              flex-direction: column;
              padding: 40px 24px;
              text-align: center;
            }
            .wl-form {
              flex-direction: column;
              align-items: center;
            }
            .wl-input {
              width: 100%;
              max-width: 320px;
            }
            .wl-submit-btn {
              width: 100%;
              max-width: 320px;
            }
          }
        `}
      </style>

      <div className="waitlist-banner">
        
        {/* Background Decorative "Clouds" */}
        <div style={{
          position: "absolute", bottom: -40, right: 280,
          width: 300, height: 200, borderRadius: "50%",
          background: "#D6ECE7", zIndex: 0
        }} />
        <div style={{
          position: "absolute", bottom: -20, right: 40,
          width: 140, height: 100, borderRadius: "50%",
          background: "#D6ECE7", zIndex: 0
        }} />
        <div style={{
          position: "absolute", bottom: -30, right: -20,
          width: 120, height: 100, borderRadius: "50%",
          background: "#D6ECE7", zIndex: 0
        }} />

        {/* LEFT Side: Content & Form */}
        <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
          <Reveal>
            <h2 style={{
              fontFamily: FH, fontWeight: 800,
              fontSize: "clamp(24px, 3vw, 28px)",
              color: "#0F172A", margin: "0 0 12px", lineHeight: 1.2,
            }}>
              Stay in the loop
            </h2>
            <p style={{
              fontFamily: FB, fontSize: 15, color: "#475569",
              lineHeight: 1.6, margin: 0, maxWidth: 380
            }}>
              Get activity ideas, parenting tips, and updates straight to your inbox.
            </p>

            {submitted ? (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontFamily: FB, fontSize: 15, color: "#15A69D", fontWeight: 700, margin: 0 }}>
                  🎉 You're subscribed!
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="wl-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="wl-input"
                />
                <button type="submit" className="wl-submit-btn">
                  Subscribe
                </button>
              </form>
            )}
          </Reveal>
        </div>

        {/* RIGHT Side: Envelope Illustration */}
        <div style={{ position: "relative", zIndex: 1, flex: "0 0 auto", marginRight: 20 }}>
          <Reveal delay={0.1}>
            <div style={{ position: "relative", display: "inline-block" }}>
              {/* Custom SVG replicating the exact envelope */}
              <svg width="180" height="150" viewBox="0 0 160 140" fill="none">
                <g transform="rotate(8) translate(10, -5)">
                  {/* Envelope Back Inside */}
                  <path d="M20 50 L140 50 L140 110 L20 110 Z" fill="#FCE4AA" />
                  
                  {/* Letter */}
                  <rect x="35" y="10" width="90" height="80" rx="4" fill="#FFFFFF" />
                  
                  {/* Heart */}
                  <path d="M80 42 C80 42 66 30 66 22 C66 17 70 13 75 13 C77.5 13 80 15.5 80 15.5 C80 15.5 82.5 13 85 13 C90 13 94 17 94 22 C94 30 80 42 80 42Z" fill="#F05E63" />
                  
                  {/* Letter Lines */}
                  <rect x="50" y="55" width="60" height="4" rx="2" fill="#F1F5F9" />
                  <rect x="50" y="65" width="40" height="4" rx="2" fill="#F1F5F9" />
                  <rect x="50" y="75" width="50" height="4" rx="2" fill="#F1F5F9" />
                  
                  {/* Envelope Left Flap */}
                  <path d="M20 50 L80 85 L20 110 Z" fill="#FDD78B" />
                  {/* Envelope Right Flap */}
                  <path d="M140 50 L80 85 L140 110 Z" fill="#FDD78B" />
                  {/* Envelope Bottom Flap */}
                  <path d="M20 110 L80 75 L140 110 Z" fill="#FBC16C" />
                </g>
              </svg>
              
              {/* Sparkles */}
              <span style={{ position: "absolute", top: 20, left: -20, fontSize: 12, color: "#54C8C2" }}>✦</span>
              <span style={{ position: "absolute", top: -10, right: 30, fontSize: 10, color: "#FBC16C" }}>✦</span>
              <span style={{ position: "absolute", top: 40, right: -15, fontSize: 14, color: "#FBC16C" }}>✦</span>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}