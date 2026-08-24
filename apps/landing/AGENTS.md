# CLAUDE.md — Beam Landing Page (Coming Soon / Waitlist)

> This file contains all instructions for Claude Code to build the Beam landing page.
> The product is NOT yet live. The landing page goal is to collect waitlist signups and impress early visitors.
> Build a single static HTML file (`index.html`) with embedded CSS and vanilla JS. No frameworks required.

---

## 🗂️ What to Build

A **single-page static landing page** (`index.html`) for **Beam** — a kids' activity booking platform that connects parents with verified at-home activity teachers.

The product is in pre-launch. The page should:
- Communicate what Beam is clearly and warmly
- Collect waitlist email/phone signups
- Feel polished and trustworthy enough to show to investors and early users
- Have a "Coming Soon" / waitlist tone — NOT a full product page

---

## 🎨 Brand & Visual Identity

### Logo
<!-- ⚠️ CHANGE NEEDED: Replace the placeholder below with the actual Beam logo file -->
```html
<!-- Place logo file as: /assets/beam-logo.png -->
<!-- The logo is a kawaii shooting star with a rainbow trail, with "beam" in rounded pink text -->
<!-- See: beam-logo-reference.png for the exact logo -->
<img src="assets/beam-logo.png" alt="Beam" height="48" />
```
Until the logo file is available, use this SVG text placeholder:
```html
<span style="font-family:'Nunito Rounded',sans-serif; font-weight:900; color:#1CA8B3; font-size:28px;">✦ beam</span>
```

### Fonts
Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito+Rounded:wght@400;600;700;800;900&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
```
- **Headings / Brand**: `Nunito Rounded`, weight 800–900
- **Body / UI**: `Nunito`, weight 400–600

### Colour Palette (use as CSS variables)
```css
:root {
  /* Primary */
  --teal:         #1CA8B3;
  --yellow:       #FFD766;
  --coral:        #FF7F7F;

  /* Secondary */
  --mint:         #CFF5EA;
  --lavender:     #DCCBFF;
  --sky:          #8BE3E8;
  --peach:        #FFD9C2;
  --yellow-soft:  #FFB86B;
  --coral-soft:   #FFC2B4;

  /* Neutral */
  --cream:        #FAF7F2;   /* page background */
  --white:        #FFFFFF;
  --navy:         #1E293B;   /* primary text */
  --grey:         #7B8794;   /* secondary text */
  --light-grey:   #EEF2F6;

  /* Gradients */
  --grad-ocean:   linear-gradient(135deg, #1CA8B3, #8BE3E8);
  --grad-sunny:   linear-gradient(135deg, #FFD766, #FFB86B);
  --grad-coral:   linear-gradient(135deg, #FF7F7F, #FFC2B4);
}
```

### Colour Usage Rules
| Token | Use for |
|---|---|
| `--teal` | CTAs, nav, brand elements, links |
| `--yellow` | Rewards badges, highlights, success states |
| `--coral` | Emotions, alerts, promotions |
| `--mint` / `--sky` | Backgrounds, secondary UI, calm sections |
| `--lavender` | Milestones, skills, learning badges |
| `--cream` | Page background |
| `--navy` | All primary body text |
| `--grey` | Subtext, captions, labels |

---

## 📐 Page Structure & Sections

Build these sections **in order**, top to bottom:

---

### 1. NAVBAR (fixed, top)
- Left: Beam logo (see logo instructions above)
- Right: One CTA button — **"Join Waitlist"** — smooth scrolls to the waitlist form
- Background: semi-transparent `--cream` with `backdrop-filter: blur(12px)`
- Thin bottom border: `1px solid rgba(28,168,179,0.12)`
- Sticky / fixed on scroll

---

### 2. HERO SECTION

**Left side (copy):**
- Tag pill: `✦ Coming Soon` in `--teal` on `--mint` background, rounded pill
- H1 headline:
  ```
  Activities that
  nurture every child. 🌟
  ```
  Use `--navy` for main text, `--teal` for "nurture"
- Subheadline (body text, `--grey`):
  ```
  Beam connects families with trusted, verified experts for engaging
  at-home activities that help children learn, play, and grow with confidence.
  ```
- Waitlist form (inline): Email input + "Join Waitlist" button (teal, pill shape)
- Below form: small trust note — `✅ Free to join · No spam · Be first to know`

**Right side (visual):**
```
<!-- ⚠️ CHANGE NEEDED: Mobile app screenshot placeholder -->
<!-- Replace the grey box below with a real app screenshot once available -->
<!-- Recommended: use the mockup screens from the design file (Explore screen or Home screen) -->
<!-- File to place: /assets/app-screen-hero.png -->
```

Until the real screenshot is ready, render a **phone frame mockup placeholder**:
- A rounded rectangle (280×560px) with `border: 8px solid --navy`, `border-radius: 40px`
- Inside: solid `--mint` background
- Centered text (grey, small): `[ App Screenshot Coming Soon ]`
- Add a small notch at the top to look like a phone
- Surround with floating decoration blobs (soft teal/yellow/coral circles, low opacity, CSS only)

Layout: side-by-side on desktop (`display:flex`), stacked on mobile (copy on top, phone below).

---

### 3. WHAT IS BEAM (3-step explainer)

Section heading: `How Beam works` (centered, `--navy`)

3 cards in a row (stack on mobile):

| # | Icon (emoji ok) | Title | Description |
|---|---|---|---|
| 1 | 🔍 | **Explore** | Browse curated activities matched to your child's age and interests |
| 2 | 📅 | **Book & Connect** | Schedule a session with a verified expert at a time that suits you |
| 3 | 🌱 | **Track & Grow** | Watch your child's skills develop with every session |

Card style: white background, soft shadow, `--teal` numbered badge top-left, rounded corners (16px).

---

### 4. FEATURES STRIP (icon + text, horizontal scroll on mobile)

Heading: `Everything parents love` (left-aligned)

6 feature pills in a wrapping flex row:

- 🧒 **Personalized for Your Child** — Age-based recommendations
- ✅ **Verified Experts** — Background-checked teachers
- 🏠 **At-Home Convenience** — Sessions at your schedule
- 🔒 **Safe & Secure** — Child safety first, encrypted payments
- 📈 **Progress Tracking** — Visual milestone reports
- 🏆 **Rewards & Streaks** — Celebrate every win

Style: each pill is `--white` card, small emoji icon left, short text, subtle border.

---

### 5. ACTIVITIES PREVIEW (teaser grid)

Heading: `Activities your child will love`
Subtext: `Art, music, movement, storytelling, science, and more — all at home.`

Show 6 activity category cards in a 3×2 grid (2×3 on mobile):

| Emoji | Category |
|---|---|
| 🎨 | Art & Craft |
| 🎵 | Music |
| 🤸 | Movement |
| 🧪 | Science Fun |
| 📚 | Storytelling |
| 🧩 | Sensory Play |

Style: rounded square cards, gradient background per card (use brand colours), white emoji + label centered. Overlay text: `+ many more coming soon` at bottom of grid.

```
<!-- ⚠️ CHANGE NEEDED: Replace emoji cards with real activity photos when available -->
<!-- Place images as: /assets/activities/art.jpg, music.jpg, etc. -->
```

---

### 6. TRUST & SAFETY STRIP

Dark background section (`--navy`), light text. Centered.

Heading (white): `Built on trust. Designed for families.`

4 trust badges in a row (wrap on mobile):

| Icon | Label | Sub |
|---|---|---|
| 🛡️ | ID Verified | All experts verified |
| 🔍 | Background Check | Child safety ensured |
| ⭐ | Reviews & Ratings | Real parent feedback |
| 🔐 | Secure Payments | PCI DSS compliant |

---

### 7. WAITLIST SIGNUP SECTION (main CTA)

Large centered section, soft `--mint` background.

```
<!-- ⚠️ CHANGE NEEDED: Wire this form to your actual backend / email tool -->
<!-- Suggested: Mailchimp embed, Typeform, or a custom /api/waitlist POST endpoint -->
<!-- Current implementation: JS alert confirmation (placeholder only) -->
```

Content:
- Tag: `🚀 Be the first to know`
- H2: `Beam is launching soon.` `Get early access.`
- Body: `Join hundreds of parents already on the waitlist. We'll notify you the moment we go live in your city.`
- Form: **Name** input + **Email or Phone** input + **"Join the Waitlist"** button (large, teal, full-width on mobile)
- Below button: `🔒 We respect your privacy. No spam, ever.`

On submit (JS): prevent default → show inline success message:
```
🎉 You're on the list! We'll be in touch soon.
```

---

### 8. SOCIAL PROOF / EARLY TRACTION (optional, show if numbers exist)

```
<!-- ⚠️ CHANGE NEEDED: Update numbers below with real data when available -->
<!-- Remove this section entirely if no real numbers exist yet -->
```

3 stat cards:
- `500+` — Families on waitlist
- `50+` — Verified teachers ready
- `10+` — Activity categories

Style: large bold number in `--teal`, label below in `--grey`.

---

### 9. FOOTER

Simple, minimal. Single row on desktop, stacked on mobile.

- Left: Beam logo + tagline `Activities that nurture every child.`
- Center: `© 2024 Beam. All rights reserved.`
- Right: Links — Privacy Policy · Terms · Contact Us

```
<!-- ⚠️ CHANGE NEEDED: Add real links for Privacy, Terms, Contact pages -->
<!-- These can be separate HTML files or modal pop-ups -->
```

Background: `--navy`, text: `--grey` / white.

---

## 📱 Mobile Responsiveness

The page MUST be fully responsive. Key breakpoints:

```css
/* Desktop: default styles (min-width: 768px) */
/* Mobile: max-width: 767px */

@media (max-width: 767px) {
  /* Hero: stack vertically, copy on top, phone mockup below */
  /* How it works: single column */
  /* Feature pills: 2-column grid */
  /* Activity grid: 2 columns */
  /* Trust badges: 2 columns */
  /* Waitlist form: full width inputs stacked */
  /* Footer: centered, stacked */
}
```

Phone mockup in hero: on mobile, reduce to 240×480px and center below the copy.

---

## ✨ Animations & Interactions

Keep it light and delightful — this is a kids' platform:

- **Page load**: Fade-in + slide-up on hero copy and phone mockup (CSS `@keyframes`, staggered with `animation-delay`)
- **Scroll**: Sections fade in as they enter viewport (use `IntersectionObserver` in vanilla JS)
- **Button hover**: Slight `translateY(-2px)` + box-shadow glow in brand colour
- **Form focus**: Input border transitions to `--teal`
- **Activity cards**: Gentle scale `1.04` on hover
- **Floating blobs** behind phone: slow CSS rotation animation, very subtle

No jarring animations. Keep easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy brand feel.

---

## 🗃️ File Structure

```
/
├── index.html          ← single file, all CSS + JS embedded
├── assets/
│   ├── beam-logo.png   ← ⚠️ ADD: real logo file
│   ├── app-screen-hero.png  ← ⚠️ ADD: app screenshot for hero
│   └── activities/
│       ├── art.jpg     ← ⚠️ ADD: activity photos (optional)
│       └── ...
└── CLAUDE.md           ← this file
```

---

## ⚠️ All Places That Need Real Content (Summary)

Search for `⚠️ CHANGE NEEDED` in `index.html` after generation. Here's the full list:

| # | Location | What to change |
|---|---|---|
| 1 | Navbar + Hero | Replace logo placeholder with `assets/beam-logo.png` |
| 2 | Hero right side | Replace phone mockup placeholder with real app screenshot |
| 3 | Activity cards | Replace emoji cards with real activity photos |
| 4 | Waitlist form | Wire to backend (Mailchimp / Typeform / custom API) |
| 5 | Social proof section | Update numbers or remove section if no real data yet |
| 6 | Footer links | Add real URLs for Privacy Policy, Terms, Contact |
| 7 | Meta tags | Update OG image, description, canonical URL before going live |

---

## 🔍 SEO & Meta Tags

Add in `<head>`:

```html
<meta name="description" content="Beam connects families with trusted experts for engaging at-home activities that help children learn, play, and grow. Join the waitlist." />
<meta property="og:title" content="Beam — Activities that nurture every child" />
<meta property="og:description" content="Expert-led at-home activities for kids. Launching soon — join the waitlist." />
<!-- ⚠️ CHANGE NEEDED: Add og:image once a proper launch graphic is ready -->
<!-- <meta property="og:image" content="https://yoursite.com/assets/og-image.jpg" /> -->
<meta property="og:type" content="website" />
<link rel="icon" href="assets/beam-logo.png" />
```

---

## 🚫 Do NOT Build

- No login / auth pages
- No booking flow
- No teacher or admin panels
- No backend logic (static only)
- No payment integration
- No multi-page routing

This is purely a **coming soon + waitlist capture** static page.

---

## ✅ Definition of Done

- [ ] Single `index.html` file renders correctly in Chrome
- [ ] Fully responsive — tested at 375px (iPhone SE) and 1280px (desktop)
- [ ] Waitlist form shows success message on submit
- [ ] All `⚠️ CHANGE NEEDED` comments present and findable in the output
- [ ] No console errors
- [ ] Page loads under 2 seconds (no heavy assets)
- [ ] Colours match brand palette exactly
- [ ] Font is Nunito Rounded / Nunito (loaded from Google Fonts)