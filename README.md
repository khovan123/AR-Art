# AR Art

Browser-based augmented reality for physical artwork. Visitors open a website, grant camera permission, point at an image target, and see a digital Three.js layer anchored to the artwork.

## What is implemented

- Next.js App Router + React
- MindAR image-target tracking
- Three.js animated AR overlay
- Optional video-texture overlay for animated artwork
- shadcn/ui-compatible component setup
- Atomic Design for shared UI (`atoms` → `molecules` → `organisms` → `templates`)
- Feature-based AR module with Clean Architecture boundaries
- Mobile-first `/ar` scanner UI
- `/demo-target` route for the default tracking image
- Environment-based target replacement

## Architecture

```text
src/
├── app/                         # Next.js routes only
├── components/
│   ├── atoms/                   # shadcn-compatible primitives
│   ├── molecules/
│   ├── organisms/
│   └── templates/
├── config/
├── features/
│   └── ar-experience/
│       ├── domain/              # entities/types; framework-free
│       ├── application/         # ports + use cases
│       ├── infrastructure/      # MindAR/Three adapter
│       └── presentation/        # React hook + viewer
└── lib/
```

The dependency direction is `presentation → application → domain`; infrastructure implements application ports. Next.js pages are kept thin.

## Tech choices

- **Next.js 16 / React 19 / Tailwind CSS 4** for the web app.
- **MindAR 1.2.5** because it is free, open source, and supports browser image tracking.
- **Three.js 0.160.1 is intentionally pinned**. MindAR supports Three.js r137+, but newer Three releases changed APIs used by MindAR 1.2.5. This pin prioritizes a known-compatible AR runtime over a nominally newer but unstable pairing.
- **shadcn/ui pattern**: UI source lives in-repo rather than depending on a paid component service.

No paid AR SDK, database, auth provider, or proprietary runtime is required for the MVP.

## Run locally

Requirements: Node.js 22+

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Camera APIs work on localhost for development. For testing from a phone, deploy the site over **HTTPS** (for example, Vercel's free tier).

## Test the AR flow

1. Open `/demo-target` on a laptop/second screen.
2. Open `/ar` on a phone.
3. Tap **Start camera** and allow camera permission.
4. Point the phone at the target image.
5. The 3D object should lock to the image and animate while you move the camera.

## Replace the demo artwork

MindAR tracks a compiled `.mind` target file. Create one from your artwork using the free MindAR compiler, then configure:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_AR_TARGET_URL=/targets/my-artwork.mind
NEXT_PUBLIC_AR_TARGET_IMAGE_URL=/targets/my-artwork.jpg
NEXT_PUBLIC_AR_TARGET_INDEX=0
NEXT_PUBLIC_AR_OVERLAY_VIDEO_URL=/overlays/my-artwork.webm
NEXT_PUBLIC_AR_OVERLAY_ASPECT_RATIO=1.8116
```

Place self-hosted target files under `public/targets/` and video assets under `public/overlays/` for production. If no overlay video URL is configured, the app renders a procedural Three.js demo. The sample defaults use MindAR's public target only so a fresh checkout works immediately.

## Next product increments

Keep the core simple. Add these as separate features only when needed:

- artwork manifest (many targets and overlays)
- transparent video overlays
- GLB/GLTF artwork assets
- artist/exhibition CMS
- QR entry links per exhibition
- analytics and content preloading

Do not put these concerns inside the tracking engine; expose them through new application ports/use cases.
