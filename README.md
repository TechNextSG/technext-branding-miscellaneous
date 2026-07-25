# TechNext Branding Miscellaneous

Self-serve hub for TechNext Pte Ltd. staff to grab branded assets in one place.

**Live page:** https://technextsg.github.io/technext-branding-miscellaneous/

## Sections

1. **Email Signature** — fill in your name, job title, phone, and email, click **Copy Signature**, and paste into Gmail. Includes a Tutorial (Gmail setup + Google/Gmail profile picture).
2. **Animated Logo** — download the animated TechNext logo GIF for emails & presentations. Includes a usage Tutorial.
3. **Video Call Background** — HD (1920×1080) branded backgrounds for Zoom, Teams & Google Meet, in **Normal** and **Inverted** (mirrored) variants. Includes a per-platform setup Tutorial.

Each section has its own collapsible **Tutorial** button.

## ⚠️ Do not delete or move `sig/` or `backgrounds/`

Every copied email signature hot-links the images in `sig/` from this repo's GitHub Pages URL on **every email load**. Deleting or moving them instantly breaks the logo and banner in all staff signatures already deployed in Gmail. (This happened once before when the assets lived in the main website repo and were removed in a cleanup — that's why they now live in this dedicated repo.)

## Contents

- `index.html` — the branding hub page (displays local images; the Copy button rewrites image URLs to the hosted GitHub Pages ones so they work in recipients' inboxes)
- `sig/` — email signature assets: horizontal logo, banner, animated logo GIF, and social/contact icons
- `backgrounds/` — 4 video-call background designs × Normal + Inverted (8 PNGs, 1920×1080)
