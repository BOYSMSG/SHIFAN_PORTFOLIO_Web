# Technical Architecture Proposal

Recommended stack: Next.js App Router + TypeScript, Tailwind CSS, Framer Motion (GSAP only if justified), Three.js / React Three Fiber for hero, Lucide icons. Hosting candidate: Vercel, subject to owner approval.

Principles:
- Separate personal portfolio repository and deployment.
- `shifan.pokefun.in` is a separate subdomain target.
- Do not alter root `pokefun.in` records or existing services.
- No secrets in source control; use environment variables.
- Avoid database unless needed.
- Keep content in typed data files separate from UI.
- Contact form must genuinely work with validation and spam protection; otherwise use direct contact links.
- Lazy-load heavy 3D; optimize images; avoid layout shift.
- Include SEO metadata, Open Graph, sitemap and robots.txt.
- Test on mid-range Android and slower networks.
