# wowa.studio — build handoff

Living log for this project. Every session appends: what the user asked, what was planned, what was executed. Keep chronological, don't delete history.

---

## 2026-07-13 — Session 1

### User request (verbatim intent)
- Reference: `/Users/nucintosh/PYTHON/OIK105 SEAGONIA/seagonia-react-cms-refine-dev` (md files + Vite/React website) as the pattern to follow.
- Build a Cloudflare Pages website (React), images stored on Cloudflare R2, served via API connection. Front-end only for now (no CMS/admin yet).
- Design reference: `WOWA Site.jpg` in this folder — logo top-left, big magenta placeholder block where a rotating image gallery should go, contact info bottom-left.
- Real site domain is **wowa.studio** (not wowa.studio.com as shown in the mockup text).
- Behavior:
  - Page loads showing the magenta placeholder first, then image rotation starts (using all `WOWA_FrontpageIMG*.jpg` files in this folder).
  - Scrolling speeds up the rotation temporarily; show an animated "scroll to explore" icon to prompt the user.
  - Images are black & white by default, turn to color on mouse hover.
  - Logo font: match `WOWA Logo.png` / `WOWA Site.jpg` as closely as possible using a real Google Font (not a flat image), "wowa" bold black + pink "a", "studio" in a lighter weight.
  - Footer/contact: Instagram icon linking to `#` (placeholder, no real handle yet), email linking to `mailto:christovasilis@gmail.com`.
  - Also have `WOWA Mobile Portrait.jpg` / `WOWA Mobile Landscape.jpg` as responsive references.
- User wants speed: MVP SPA today, refine later. Explicitly asked for the plan first, will approve before execution ("go fast" once approved).

### Assets found in this folder
- `WOWA Logo.png` — clean logo, transparent bg.
- `WOWA Site.jpg` (4000×2250) — desktop mockup. Magenta block sampled at RGB(253,61,182) → **#FD3DB6**.
- `WOWA Mobile Portrait.jpg`, `WOWA Mobile Landscape.jpg` — mobile mockups.
- `Instagram 255,51,204.png` — Instagram icon, pink variant.
- `WOWA_FrontpageIMG01.jpg` … `WOWA_FrontpageIMG20.jpg` — 20 source photos for the rotating gallery, 1.3–4.6MB each (unoptimized, straight from camera/export).

### Plan (proposed, awaiting approval)

**Stack**
- React + Vite SPA (matches the SEAGONIA precedent the user pointed at). Note: user's message said "react vue" — interpreting as React unless corrected.
- Deploy target: Cloudflare Pages.
- Repo: this folder (`/Users/nucintosh/PYTHON/wowa.studio`) is not yet its own git repo — it currently sits inside the large `/Users/nucintosh` home-level git repo. Plan is to init a **dedicated git repo** in `wowa.studio/` (kept separate from the home-level repo) so Cloudflare Pages can eventually connect via Git. For today's MVP, deploy directly via `wrangler pages deploy` (CLI) — no GitHub wiring needed yet, fastest path to a live URL.

**Images / R2 / API**
- Resize + compress the 20 `WOWA_FrontpageIMG*.jpg` files for web (cap ~2400px wide, JPEG q≈80) before upload — current files are far too large for fast page load.
- Create R2 bucket `wowa-studio-images`, upload the optimized images.
- Small Cloudflare Worker (`wowa-images-api`) with an R2 binding exposing `GET /api/images` → JSON array of public image URLs, built from a live `bucket.list()` call. This means adding/removing photos in R2 later doesn't require a front-end redeploy — matches the "API connection" ask.
- Custom domain for images (e.g. `img.wowa.studio`) if `wowa.studio`'s DNS is already on this Cloudflare account — **need to confirm this with you**; otherwise fall back to the Worker serving the bytes directly, or R2's own public dev URL, for the MVP.

**Front-end behavior**
- Boot state: full-bleed magenta `#FD3DB6` block where the gallery will be, logo + contact already visible.
- Once the image list + first couple images preload, cross-fade into the rotation (~3.5s per image).
- `wheel`/touch scroll listener temporarily shortens the rotation interval (faster cycling) for a few seconds after each scroll tick, then decays back to the normal pace.
- Animated bouncing "scroll" icon/indicator shown until the user's first scroll, then fades out.
- Images rendered `filter: grayscale(100%)`, transitioning to full color on hover (mouse-enter over the image area), smooth CSS transition back on mouse-leave.
- Logo rebuilt as real text (not the PNG) using **Poppins** from Google Fonts — closest available match to the mockup's geometric rounded sans: "wowa" in Poppins 700 (near-black `#1A1A1A`) with the "a" in `#FD3DB6`, "studio" in Poppins 300, same near-black. Will show a side-by-side comparison before locking it in.
- Footer/contact bottom-left: Instagram icon (reuse `Instagram 255,51,204.png` or an inline SVG) linking to `#`, email text linking to `mailto:christovasilis@gmail.com`.
- Responsive layout per the mobile mockups: logo centered top, image block fills remaining viewport height, contact row pinned to bottom.

**Open question before I execute**
Is `wowa.studio`'s DNS already managed in this Cloudflare account? If yes I can attach the custom domain (both for Pages and for the image API) as part of today's pass; if not, I'll ship the MVP on the default `*.pages.dev` / `*.workers.dev` URLs and you can point the domain over whenever it's ready.

### Executed this session
- Nothing built yet — plan only, awaiting user approval.
