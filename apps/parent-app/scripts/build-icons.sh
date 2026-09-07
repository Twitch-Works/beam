#!/usr/bin/env bash
# Builds the app-icon / splash PNGs in assets/images/ from the Beam brand art:
#   assets/images/beam-star.png  -> app icon        (kawaii star)
#   assets/images/beam-logo.png  -> splash mark     ("beam" wordmark + rainbow + star)
# Both are copied from apps/landing/src/assets/. Requires `rsvg-convert` (brew install librsvg).
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="assets/images"

command -v rsvg-convert >/dev/null || { echo "rsvg-convert not found — brew install librsvg"; exit 1; }

STAR_B64=$(base64 -i "$OUT/beam-star.png")
LOGO_B64=$(base64 -i "$OUT/beam-logo.png")

# App icon — 1024, opaque, brand-teal field behind the star (iOS forbids alpha)
cat > /tmp/beam-icon.svg <<EOF
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#1787A6"/>
  <image x="150" y="162" width="724" height="724" xlink:href="data:image/png;base64,$STAR_B64"/>
</svg>
EOF
rsvg-convert -w 1024 -h 1024 /tmp/beam-icon.svg -o "$OUT/icon.png"
rsvg-convert -w 48 -h 48 /tmp/beam-icon.svg -o "$OUT/favicon.png"

# Android adaptive-icon foreground — 512, transparent, star inside the ~66% safe zone
cat > /tmp/beam-fg.svg <<EOF
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512">
  <image x="96" y="96" width="320" height="320" xlink:href="data:image/png;base64,$STAR_B64"/>
</svg>
EOF
rsvg-convert -w 512 -h 512 /tmp/beam-fg.svg -o "$OUT/android-icon-foreground.png"

# Native splash image — logo on a round white badge, shown on the #1787A6 splash
# background (the "beam" wordmark is teal and would vanish directly on the teal ground)
cat > /tmp/beam-splash.svg <<EOF
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="900">
  <circle cx="450" cy="450" r="340" fill="#FFFFFF"/>
  <image x="200" y="200" width="500" height="500" xlink:href="data:image/png;base64,$LOGO_B64"/>
</svg>
EOF
rsvg-convert -w 900 -h 900 /tmp/beam-splash.svg -o "$OUT/splash-icon.png"

# Android notification icon — white star silhouette, system-tinted
cat > /tmp/beam-mono.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
  <path d="M48 12 L59 37 L86 40 L66 59 L71 86 L48 72 L25 86 L30 59 L10 40 L37 37 Z" fill="#FFFFFF"/>
</svg>
EOF
rsvg-convert -w 96 -h 96 /tmp/beam-mono.svg -o "$OUT/android-icon-monochrome.png"

echo "Beam icon assets rebuilt:"
file "$OUT"/icon.png "$OUT"/android-icon-foreground.png "$OUT"/splash-icon.png "$OUT"/android-icon-monochrome.png "$OUT"/favicon.png
