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

User approved: GitHub repo `https://github.com/adenadoume/wowa-studio`, `wowa.studio` DNS confirmed already on this Cloudflare account, React/Vite confirmed.

**R2 + Worker**
- Compressed all 20 `WOWA_FrontpageIMG*.jpg` with `sips` (cap 2400px wide, JPEG q78): ~45MB → ~12MB total, staged in `r2-upload/` (gitignored, not committed — regenerable from the originals).
- Created R2 bucket `wowa-studio-images`, uploaded all 20 optimized images.
- Built `worker/` (Cloudflare Worker, `wowa-images-api`): `GET /api/images` lists the R2 bucket live and returns JSON `{key,url}[]`; `GET /img/:key` streams bytes from R2 with long-cache headers. CORS allows `https://wowa.studio` + any `localhost:*` (for dev).
- Deployed the Worker. It's reachable today at **`https://wowa-images-api.agop-website.workers.dev`** (verified working via curl).
- Attempted to attach custom domain `img.wowa.studio` to the Worker (`routes: [{pattern: "img.wowa.studio", custom_domain: true}]` in `worker/wrangler.jsonc`) — Cloudflare registered it (`enabled: true`, cert issued) but the DNS record itself never got created, so it doesn't resolve yet. Root cause below.

**Front-end**
- Scaffolded Vite + React in `website/`, added `@fontsource/poppins` (self-hosted, weights 300/400/700 — no external Google Fonts request at runtime).
- Built the rotating gallery: fetches `/api/images` on load, preloads the first 2 images, shows the magenta placeholder for a minimum ~900ms, then crossfades through the list (~3.8s/image normally, ~0.9s/image for ~1.4s after each scroll tick — decays back automatically, no separate "reset" logic needed).
- Grayscale by default (`filter: grayscale(1)`), full color on hover over the stage, both via CSS transition.
- Bouncing "scroll" cue bottom-center of the stage, fades out after the first scroll/touch event.
- **Layout correction**: first pass was full-bleed (stage spanning the whole width, magenta filling the whole page background) — this was a miss, not a deliberate call. User caught it against the mockup. Rebuilt as the mockup actually shows: white page background, two-column layout (~30% sidebar with logo top / contact bottom, generous white gap, then the magenta stage shifted right and flush-ish to the right edge). Mobile still stacks (logo → stage → contact) via `display: contents` + flex `order` on the sidebar's children.
- Font: confirmed **Poppins** over Arial — the logo's lowercase "a" is single-story (bowl + stem, no top hook), which is the geometric-sans signature (Poppins/Futura/Century Gothic), not Arial's double-story "a".
- Contact footer, per user's follow-up: three icon+text rows — Instagram (real link `https://www.instagram.com/wowa_studio/`, was a `#` placeholder), email (`christovasilis@gmail.com`), phone (`+30 697 492 9253`, taken from the original `WOWA Site.jpg` mockup text since it's the user's own design file). Instagram PNG asset (`Instagram 255,51,204.png`) turned out to be magenta-on-transparent — invisible against the page background at every layout iteration — replaced with inline SVG icons colored `var(--magenta)` throughout.
- Verified visually via Playwright + mocked `/api/images` responses (screenshotted boot/rotation/hover/mobile states) since the sandboxed browser here has no outbound network access — confirmed rotation, crossfade, grayscale↔color, and layout all render correctly before shipping. Confirmed via curl separately that the real Worker API is live and CORS-correct.

**Deploy**
- Cloudflare Pages project `wowa-studio` created, deployed via `wrangler pages deploy` (direct upload, not Git-triggered). Live at **`https://wowa-studio.pages.dev`**.
- Initialized a **dedicated git repo** at `/Users/nucintosh/PYTHON/wowa.studio` (was previously only inside the home-level mega-repo). Pushed to `git@github.com:adenadoume/wowa-studio.git` main branch, two commits so far (initial MVP, then the layout/contact fixes).
- `.gitignore`: excludes `node_modules/`, `dist/`, `.wrangler/`, `r2-upload/` (optimized images — already in R2, regenerable). The 20 original full-res `WOWA_FrontpageIMG*.jpg` + mockup JPGs/PNGs **are** committed (source-of-truth design assets, ~45MB total, acceptable repo size). `website/.env` (holds `VITE_IMAGES_API_BASE`, a public non-secret URL) is committed too, since deploys are local/manual right now rather than Pages-Git-triggered.

**Blocked: both custom domains need a DNS write**
- Attempted `wowa.studio` → Pages project via the Cloudflare API directly (`POST .../pages/projects/wowa-studio/domains`) — accepted but stuck at `status: initializing`, `"CNAME record not set"`.
- Root cause (same for both `wowa.studio` and `img.wowa.studio`): the OAuth token `wrangler login` produced has `pages:write` and `workers_routes:write` but **no DNS-record-write scope**, so Cloudflare can register the custom domain/route but can't auto-create the underlying DNS record. `wowa.studio`'s apex currently has a pre-existing `A` record → `128.140.2.167` (something else already live there — did not touch it, not knowing if it's still needed).
- **Fix options given to user**: (a) easiest — just open the Cloudflare dashboard once and click through (Workers & Pages → `wowa-studio` project → Custom domains → activate `wowa.studio`; and Workers & Pages → `wowa-images-api` → Triggers → Custom Domains → activate `img.wowa.studio`) — the dashboard session has full permissions so it self-heals; (b) or give Claude a scoped API token (Cloudflare dashboard → My Profile → API Tokens → Create Token → "Edit zone DNS" template → scope to zone `wowa.studio` only) so it can fix the DNS records directly via API.
- Once `img.wowa.studio` resolves, switch `website/.env`'s `VITE_IMAGES_API_BASE` from the `workers.dev` fallback to `https://img.wowa.studio`, rebuild, redeploy Pages.

### Still open / next session
- [ ] Cloudflare Pages Git integration (auto-deploy on push) not wired up — currently deploys are manual (`wrangler pages deploy`) even though the repo is now on GitHub. Dashboard-only OAuth step.
- [ ] `img.wowa.studio` still doesn't resolve — see below, needs real investigation next session.

---

## 2026-07-13 — Session 1 (continued)

### DNS: fixed
User's first pasted API token (`cfat_...`) never validated against Cloudflare's own `/user/tokens/verify` endpoint — genuinely invalid, not a scope issue (confirmed by retrying it twice, same "Invalid API Token" both times, likely copied before hitting the final "Create Token" confirmation screen). A second token (`cfut_...`, valid) let us:
- Read the zone's DNS records directly — the apex `wowa.studio` **A record → 128.140.2.167 seen earlier was stale local/resolver cache, not a real Cloudflare zone record.** The zone had no apex A/CNAME at all (only MX/TXT/NS for email — Namecheap-style email forwarding via `eforward*.registrar-servers.com`, untouched). So attaching the site was a clean add, not a replace.
- Created `CNAME wowa.studio → wowa-studio.pages.dev` (proxied) directly via the Cloudflare API. **`wowa.studio` is now live** and serving the current deploy (verified via curl + confirmed by user).
- `img.wowa.studio`'s `AAAA → 100::` (proxied) record already existed — Cloudflare's standard (if unusual-looking) mechanism for Workers Custom Domains — and the Worker API reports it `enabled: true` with a cert issued. **It still does not resolve**, from this sandbox *or* from the user's own browser (user confirmed: "wowa.studio no images just the magenta placeholder"). Root cause not yet found — worth a fresh investigation next session (candidates: something about the zone's proxy status for that specific record, an edge propagation issue, or a Cloudflare-side quirk with AAAA-only Workers Custom Domains). **Front-end currently points at the `workers.dev` URL as a working fallback** (`website/.env`) — swap back to `https://img.wowa.studio` once this is solved.

### Contact icons — several rounds of polish
- Made vertical (was horizontal), Instagram/email icon-only (no label), phone icon-only by default but reveals its number on hover (`max-width` transition on the text), enlarged from 18px → 28px with a hover-scale.
- Real Instagram link (`https://www.instagram.com/wowa_studio/`, was `#` placeholder) and a real phone number (`+30 697 492 9253`, taken from the user's own `WOWA Site.jpg` mockup text).
- Phone: removed the hover-underline, set text color to magenta (was near-black) per explicit request.

### Layout bug found and fixed: full-bleed vs. the mockup
First pass had the stage spanning edge-to-edge and magenta filling the whole page background — a miss against the mockup, not a deliberate call. Mockup actually shows: white page, ~30% sidebar (logo top, contact bottom, lots of negative space) with the magenta stage shifted right and inset asymmetrically (bigger gap on the left than the right). Rebuilt as a two-column flex layout matching that; mobile still stacks via `display:contents` + `order` on the sidebar's children.

### Mobile: full-bleed + auto-hiding chrome
Per user request: mobile gets a full-bleed image (no padding/border-radius) with the logo and contact bar floating as an overlay that **hides on scroll and reappears on tap or after ~2.5s idle**. Explicitly skipped a hamburger menu — there's nothing to navigate to on a single-page site, so it'd be pure overhead. Iterated twice more per feedback: removed the drop-shadow/text-shadow (user called it "grey shadows", didn't like it), shrunk icons in portrait specifically (20px vs 28px desktop), and extended the same treatment to **landscape** phones via `(max-height: 500px) and (orientation: landscape)` in addition to the width-based portrait query — landscape phones are often wider than the 700px breakpoint and were falling back to the desktop two-column layout, which is wrong for a phone.

### Image orientation / sizing (portrait vs. landscape sources)
User flagged that source photos have mixed orientation/aspect ratio and asked whether that's fixable in code or needs consistent images from the architect. Answer given: `object-fit:cover` already centers by default, but a portrait shot cropped hard into a wide landscape stage will still lose a lot of the photo — **consistent aspect ratio from the source is the real fix**, but added a code-side mitigation too: images are now checked for orientation at preload time (`naturalWidth`/`naturalHeight`), and portrait ones letterbox (contain-fit + magenta bars) instead of being cropped like landscape ones (cover-fit). Hit a real bug doing this: the magenta letterbox came out **grey**, because `filter:grayscale()` was applied to the same element that carried the magenta `background-color`, desaturating it. Fixed by moving the background onto an unfiltered wrapper.

### The image-transition effect: three iterations, now WebGL
This was the highest-friction part of the session — three built-and-rejected attempts before landing on the right one:
1. **rotateX card-flip** (first pass) — user: "don't like 3D card flip."
2. **rotateY horizontal swing** — user: "still wrong... not standard ones please."
3. **CSS multi-slice barrel-roll** (14 horizontal bands, GSAP-staggered rotateX+depth per band, sharing one continuous background canvas computed in real pixels from natural image size) — a legitimate technique (seen on real award-winning sites) for faking curvature on a flat plane. Had a real sign-error bug (background-position math negated `offsetY` twice, leaving a permanent gap at the top of every image) — found and fixed. User still rejected the *result*: "effect unacceptable."

At that point, rather than guess a fourth time, asked the user to choose between four concrete options (true WebGL cylinder / refined CSS slices / vertical conveyor / SVG displacement) with an `AskUserQuestion`. **User picked the true WebGL cylinder.**

**Built with `@react-three/fiber` + `three` + `gsap`** (`website/src/CylinderStage.jsx`, replacing the old `CylinderFrame.jsx`, which is deleted): each image is mapped onto an actual curved arc-segment of a vertical-axis `CylinderGeometry` (cover-fit UV computed in real pixels from natural image size, same math family as the CSS version). Transitions swing the outgoing arc away and the incoming arc into place by tweening `rotation.y` with GSAP — genuine 3D curvature during the transition (confirmed visually: real perspective foreshortening on mid-roll screenshots), not an illusion. Idle/resting frame uses an **orthographic** camera so there's zero perspective skew when not transitioning — matches the site's flat, precise aesthetic.

Lazy-loaded via `React.lazy`/`Suspense` since Three.js adds ~950KB (~262KB gzip) — the main bundle is back down to ~196KB and the heavy chunk streams in during the magenta placeholder wait rather than blocking first paint.

**Three real bugs found and fixed while building this** (each confirmed via direct debugging, not guessed):
- Cross-origin WebGL texture reads need `TextureLoader.setCrossOrigin('anonymous')` explicitly — without it, textures silently fail (no error thrown; browsers require CORS opt-in to read pixel data into a texture, unlike a plain `<img>` which displays cross-origin images fine without it). Site images come from a different subdomain (`workers.dev`/`img.wowa.studio`) than the page, so this is a real production concern, not just a test artifact.
- The orthographic camera's frustum wasn't being auto-sized by `@react-three/fiber` — passing a custom `camera` prop to `<Canvas>` seems to opt out of its automatic viewport-based sizing, leaving `left/right/top/bottom` at the `OrthographicCamera` constructor defaults (±1) so nothing was ever in frame. Now set explicitly from canvas pixel size every time it changes.
- Camera was fixed at `z=800`, which was *closer to the origin than the mesh itself* (mesh sits at `z≈radius`, computed from stage width — often >1300px) — camera was effectively behind the geometry. Distance is now derived from the computed radius (`radius + 600`) so it always clears the mesh regardless of stage size.
- Diagnosed by: confirming a static `rotation.y=0` mesh rendered perfectly (isolating the bug to the animation/camera path, not texture/material), then adding real console instrumentation (`JSON.stringify`'d bounding-box/camera-frustum dumps) rather than continuing to guess — the actual fix followed directly from that data.

### Verification approach this session
Confirmed several times that the sandboxed browser here has **zero outbound network access** (even `fetch('https://example.com')` fails from within Playwright's headless Chromium, while `curl` from Bash works fine — different network paths). All visual verification of live-API behavior therefore goes through Playwright with `page.route()` mocking the `/api/images` and `/img/*` endpoints locally (using downsized copies of the real source photos), then reading back screenshots. Server-side truth (API responses, CORS headers, deployed bundle contents, DNS records) is checked directly via `curl`/Cloudflare API instead.

### Current live state
- **https://wowa.studio** — live, real domain, current deploy.
- **https://wowa-studio.pages.dev** — same deploy, alias.
- Images served from `https://wowa-images-api.agop-website.workers.dev` (the `img.wowa.studio` custom domain is provisioned but not resolving — see above).
- Repo: `github.com/adenadoume/wowa-studio`, `main` branch, up to date with everything in this session.
