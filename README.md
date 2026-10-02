# TechNext Branding Miscellaneous

Self-serve hub for TechNext Pte Ltd. staff to grab branded assets in one place.

**Live page:** https://technextsg.github.io/technext-branding-miscellaneous/

## Sections

Design follows the current TechNext brand (same tokens as the Marketing Hub: #3167CA, Plus Jakarta Sans + Inter). Linked from the Marketing Hub as its own card: https://technextsg.github.io/technext-marketing-hub/

1. **Email signature** (`#signature`): fill in name, title, phone, email; **Copy for Gmail**, **Copy for Odoo** or **Export HTML**. Tutorial covers Gmail, Odoo and the Google profile picture.
2. **Profile photo** (`#profile`): branded circle-frame samples, photo checklist, WhatsApp hand-off to the Marketing Lead.
3. **Animated logo** (`#logo`): download the 800x800 GIF; tutorial for slides and email.
4. **Video-call backgrounds** (`#backgrounds`): 4 designs, Normal + Mirrored (files are `*-inverted.png`), 1920x1080; tutorial for Zoom, Teams, Meet.
5. **Business cards** (`#cards`): links to the generator in `business-cards/`.

Each section has a collapsible **Tutorial** (`<details>`). The signature table markup and its copy/Odoo/export JS are unchanged from the earlier design; copied signatures keep hot-linking `sig/`.

## ⚠️ Do not delete or move `sig/` or `backgrounds/`

Every copied email signature hot-links the images in `sig/` from this repo's GitHub Pages URL on **every email load**. Deleting or moving them instantly breaks the logo and banner in all staff signatures already deployed in Gmail. (This happened once before when the assets lived in the main website repo and were removed in a cleanup — that's why they now live in this dedicated repo.)

## Contents

- `index.html` — the branding hub page (displays local images; the Copy button rewrites image URLs to the hosted GitHub Pages ones so they work in recipients' inboxes)
- `sig/` — email signature assets: horizontal logo, banner, animated logo GIF, and social/contact icons
- `backgrounds/` — 4 video-call background designs × Normal + Inverted (8 PNGs, 1920×1080)
