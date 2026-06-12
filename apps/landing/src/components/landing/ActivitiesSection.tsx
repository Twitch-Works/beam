import { Palette, Music, Zap, Atom, BookOpen, Star } from "lucide-react";
import starIcon from "../../assets/star.png";
import imgArt from "../../assets/activity-art.png";
import imgMusic from "../../assets/activity-music.png";
import imgDance from "../../assets/activity-dance.png";
import imgStem from "../../assets/activity-stem.png";
import imgLanguage from "../../assets/activity-language.png";
import imgLifeSkills from "../../assets/activity-life-skills.png";
import { C, FB, FH } from "./tokens";
import { Reveal } from "./Reveal";

const activities = [
  {
    label: "Art & Craft",
    tagline: "Unleash creativity",
    image: imgArt,
    iconBg: "#EAF6F6",
    iconColor: "#15A69D",
    Icon: Palette,
  },
  {
    label: "Music",
    tagline: "Find your rhythm",
    image: imgMusic,
    iconBg: "#F7F5FF",
    iconColor: "#9B77FF",
    Icon: Music,
  },
  {
    label: "Dance",
    tagline: "Move & express",
    image: imgDance,
    iconBg: "#FFF4F4",
    iconColor: "#FF6B6B",
    Icon: Zap,
  },
  {
    label: "STEM",
    tagline: "Explore & discover",
    image: imgStem,
    iconBg: "#F0F9FF",
    iconColor: "#0EA5E9",
    Icon: Atom,
  },
  {
    label: "Language",
    tagline: "Learn & grow",
    image: imgLanguage,
    iconBg: "#ECFDF5",
    iconColor: "#10B981",
    Icon: BookOpen,
  },
  {
    label: "Life Skills",
    tagline: "Build confidence",
    image: imgLifeSkills,
    iconBg: "#FFFDF5",
    iconColor: "#FFC554",
    Icon: Star,
  },
];

export function ActivitiesSection() {
  return (
    <section
      className="section-pad"
      id="activities"
      style={{ background: "#fffefd", padding: "100px 48px" }}
    >
      <style>
        {`
          .acts-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
            max-width: 1300px;
            margin: 0 auto;
          }

          .activity-card-group {
            background: #FFFFFF;
            border: 1px solid #F1F5F9;
            border-radius: 14px;
            padding-bottom: 20px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .activity-card-group:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          }

          .activity-card-group:hover .activity-img {
            transform: scale(1.05);
          }

          .activity-img-wrap { height: 240px; }
          @media (max-width: 900px) {
            .acts-grid { grid-template-columns: repeat(3, 1fr); }
            .activity-img-wrap { height: 200px; }
          }
          @media (max-width: 560px) {
            .acts-grid { grid-template-columns: repeat(2, 1fr); }
            .activity-img-wrap { height: 160px; }
          }
        `}
      </style>

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
          <img src={starIcon} alt="" aria-hidden="true" style={{ height: 13 }} /> Explore by Category
        </p>
        <h2 style={{
          fontFamily: FH, fontWeight: 900,
          fontSize: "clamp(26px, 3.5vw, 40px)",
          color: "#1E293B",
          margin: 0, lineHeight: 1.15,
        }}>
          Find what your child will love
        </h2>
      </Reveal>

      <div className="acts-grid">
        {activities.map(({ label, tagline, image, iconBg, iconColor, Icon }, i) => (
          <Reveal key={label} delay={i * 0.05}>
            <div className="activity-card-group" style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}>

              {/* Photo */}
              <div className="activity-img-wrap" style={{
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                overflow: "hidden",
              }}>
                <img
                  className="activity-img"
                  src={image}
                  alt={label}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    transition: "transform 0.4s cubic-bezier(0.25,0.8,0.25,1)",
                  }}
                />
              </div>

              {/* Floating icon badge */}
              <div style={{
                width: 52, height: 52,
                borderRadius: "50%",
                background: iconBg,
                border: "3px solid white",
                margin: "-26px auto 12px auto",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", zIndex: 2,
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
              }}>
                <Icon size={22} color={iconColor} strokeWidth={2} />
              </div>

              {/* Text */}
              <div style={{ fontFamily: FH, fontWeight: 800, fontSize: 14, color: "#1E293B", textAlign: "center", marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontFamily: FB, fontSize: 12, color: "#64748B", textAlign: "center", padding: "0 10px" }}>
                {tagline}
              </div>

            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}