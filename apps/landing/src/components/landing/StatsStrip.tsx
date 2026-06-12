import { Heart, Users, Star, TrendingUp } from "lucide-react";
import { C, FB, FH } from "./tokens";
import { Reveal } from "./Reveal";

const stats = [
  { num: "10K+", label: "Happy Families",  Icon: Heart,      iconColor: "#FF6B6B", fill: true  },
  { num: "500+", label: "Verified Experts", Icon: Users,      iconColor: "#9B77FF", fill: false },
  { num: "50+",  label: "Activity Types",   Icon: Star,       iconColor: "#FFC554", fill: true  },
  { num: "4.9★", label: "Average Rating",   Icon: TrendingUp, iconColor: C.teal,   fill: false },
];

export function StatsStrip() {
  return (
    <section style={{ background: C.cream, padding: "0 48px 32px" }}>
      <style>{`
        .stats-strip {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(28,168,179,0.1);
          border-radius: 16px;
          overflow: hidden;
        }
        .stats-strip-item {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 28px;
        }
        .stats-strip-item + .stats-strip-item {
          border-left: 1px solid rgba(28,168,179,0.08);
        }
        @media (max-width: 768px) {
          .stats-strip { flex-direction: column; border-radius: 14px; }
          .stats-strip-item { width: 100%; padding: 16px 24px; }
          .stats-strip-item + .stats-strip-item { border-left: none; border-top: 1px solid rgba(28,168,179,0.08); }
        }
      `}</style>

      <Reveal>
        <div className="stats-strip">
          {stats.map(({ num, label, Icon, iconColor, fill }) => (
            <div key={label} className="stats-strip-item">
              <Icon size={18} color={iconColor} fill={fill ? iconColor : "none"} strokeWidth={fill ? 0 : 2} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: FH, fontWeight: 900, fontSize: 18, color: C.navy, whiteSpace: "nowrap" }}>
                {num}
              </span>
              <span style={{ fontFamily: FB, fontSize: 13, color: "#64748B", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
