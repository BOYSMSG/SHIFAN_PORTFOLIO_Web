-- ============================================================
-- SHIFAN PORTFOLIO — PUBLIC DEVELOPER JOURNAL & LIVE PROJECTS
-- Target Domain: shifan.pokefun.in
-- Identity: Mohd Shifan Gouri (BOYS MSG) / POKEDEVS
-- ============================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Web & Platform',
  role TEXT NOT NULL DEFAULT 'Lead Developer',
  short_description TEXT NOT NULL,
  full_description TEXT,
  cover_image TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  start_date TEXT,
  completion_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'in_development', 'active', 'completed', 'paused', 'archived')),
  github_url TEXT,
  demo_url TEXT,
  docs_url TEXT,
  external_links JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Journal Entries (Developer Updates & Milestones) Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Features' CHECK (category IN ('Features', 'Bug Fixes', 'Infrastructure', 'Milestones', 'Learning & Experiments', 'Launches')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_image TEXT,
  github_url TEXT,
  demo_url TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  external_links JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  views_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(is_featured, display_order);

CREATE INDEX IF NOT EXISTS idx_journal_slug ON public.journal_entries(slug);
CREATE INDEX IF NOT EXISTS idx_journal_status_pub ON public.journal_entries(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_category ON public.journal_entries(category);
CREATE INDEX IF NOT EXISTS idx_journal_project_id ON public.journal_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_journal_pinned ON public.journal_entries(is_pinned, published_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Public can read non-archived projects
DROP POLICY IF EXISTS "Public can view active projects" ON public.projects;
CREATE POLICY "Public can view active projects" ON public.projects
  FOR SELECT USING (status != 'archived');

-- Public can read published journal entries only (Drafts remain private)
DROP POLICY IF EXISTS "Public can view published journal entries" ON public.journal_entries;
CREATE POLICY "Public can view published journal entries" ON public.journal_entries
  FOR SELECT USING (status = 'published');

-- Full service role management
DROP POLICY IF EXISTS "Service role has full access to projects" ON public.projects;
CREATE POLICY "Service role has full access to projects" ON public.projects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to journal entries" ON public.journal_entries;
CREATE POLICY "Service role has full access to journal entries" ON public.journal_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Seed Initial Core Projects (Preserving existing portfolio data)
INSERT INTO public.projects (slug, name, tagline, category, role, short_description, full_description, cover_image, technologies, highlights, status, demo_url, is_featured, display_order)
VALUES
  (
    'pokefun-network',
    'Pokefun Network & SMP',
    'Minecraft Community & Multiplayer Server Ecosystem',
    'Founder Venture',
    'Founder & Lead Server Architect',
    'A high-performance multiplayer Minecraft server community featuring SMP survival, custom Cobblemon systems, and automated rank fulfillment.',
    '# Pokefun Network & SMP Ecosystem\n\nPokefun is a custom multiplayer Minecraft community and server ecosystem founded and managed by **Mohd Shifan Gouri (BOYS MSG)**.\n\n### Architecture & Highlights\n- High-tickrate PaperMC server optimization with custom Java plugin tuning\n- Linux system administration, automated restart watchdogs, and daily backup rotations\n- Seamless web store rank delivery integration with instant player provisioning\n- Scalable community infrastructure serving thousands of active players and Discord community members\n\n### Technical Stack\n- **Engine:** PaperMC / Java\n- **Host:** High-Performance Linux VPS\n- **Data:** MySQL Relational Storage\n- **Integrations:** Automated Store Webhooks, Discord API',
    '/assets/YoutubeThumbnailDownload.com-HTIGNHNVafw-full-hd-(1280×720).jpg',
    ARRAY['Java', 'PaperMC', 'Linux', 'MySQL', 'Webhooks', 'Discord API'],
    ARRAY['Configured and maintained PaperMC game server files, plugins, and permissions', 'Connected automated web store rank fulfillment via store.pokefun.in', 'Lead player community management, Discord moderation, and in-game events'],
    'active',
    'https://cobblemon.pokefun.in/',
    TRUE,
    1
  ),
  (
    'cobbledrock',
    'CobbleDrock',
    'Cobblemon & Bedrock Experience Network',
    'Minecraft Architecture',
    'Founder & Modpack Configurator',
    'A dedicated Cobblemon server setup integrating Pokémon-style gameplay mechanics into Minecraft with cross-platform tuning for Bedrock and Java players.',
    '# CobbleDrock Modpack & Platform\n\nCobbleDrock bridges custom open-source Cobblemon mechanics with accessible Bedrock cross-play connectivity.\n\n### Engineering Highlights\n- Extensive compatibility benchmarking for item textures, movesets, and spawning curves\n- Optimized entity ticking rates to maintain constant 20.0 TPS under peak player load\n- Built dedicated community support pipelines and interactive troubleshooting guides',
    NULL,
    ARRAY['Cobblemon Modding', 'Server Config', 'GeyserMC', 'Linux', 'Discord API'],
    ARRAY['Tested and tuned Cobblemon mod files and compatibility settings', 'Built Discord player support channels and troubleshooting guides', 'Iterated on configurations directly from player feedback and bug reports'],
    'active',
    'https://cobbledrock.pokefun.in/',
    TRUE,
    2
  ),
  (
    'pokedrock',
    'Pokedrock Platform',
    'Resource Hub & Player Portal',
    'Web & Platform',
    'Web Developer & Resource Curator',
    'A modern web portal providing installation tutorials, resource pack downloads, and connectivity guides for community players.',
    '# Pokedrock Platform & Resource Hub\n\nPokedrock is a streamlined resource distribution platform for Minecraft players.\n\n### Features\n- Fast static CDN delivery for client resource packs and mod installation guides\n- Mobile-optimized responsive interface with step-by-step visual instructions\n- Integrated directly with Discord support channels for seamless player onboarding',
    NULL,
    ARRAY['HTML5', 'Tailwind CSS', 'JavaScript', 'Documentation CDN'],
    ARRAY['Designed and built responsive portal layout for smooth player onboarding', 'Curated and hosted client resource packs and mod installation steps', 'Connected download portal with Discord support channels'],
    'active',
    'https://pokedrock.pokefun.in/',
    FALSE,
    3
  ),
  (
    'ai-workflow-engine',
    'Applied AI Engineering Practice',
    'Prompt Architecture, Verification & Build Verification Gates',
    'Web & Platform',
    'Independent Developer',
    'A systematic engineering methodology combining modern Large Language Models with strict manual code inspection and automated build testing.',
    '# Applied AI Engineering Practice\n\nA rigorous personal software development workflow developed by Mohd Shifan Gouri.\n\n### Core Tenets\n- Strict specification and context scoping prior to code generation\n- Line-by-line manual code inspection—no blind copy-pasting\n- Automated TypeScript compilation and regression test suites before staging\n- Production-first security modeling with zero plaintext credentials',
    NULL,
    ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'Manual Code Review', 'Git'],
    ARRAY['Structured prompt workflows for rapid component scaffolding', 'Rigorous manual line-by-line review of all AI-generated code', 'Automated type checking and build verification gates prior to deployment'],
    'active',
    'https://shifan.pokefun.in/',
    FALSE,
    4
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  technologies = EXCLUDED.technologies,
  highlights = EXCLUDED.highlights,
  status = EXCLUDED.status,
  demo_url = EXCLUDED.demo_url,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- 6. Seed Initial Journal Entries
INSERT INTO public.journal_entries (slug, title, summary, content, category, tags, project_name, status, is_pinned, published_at)
VALUES
  (
    'pokefun-infrastructure-performance-tuning',
    'Pokefun Infrastructure: PaperMC Performance Tuning & 20 TPS Optimization',
    'Detailed breakdown of entity ticking optimizations, memory garbage collection parameters, and network packet compression on the Pokefun Linux host.',
    '## Infrastructure & Performance Overview\n\nMaintaining a persistent 20.0 TPS (ticks per second) on an active Minecraft server with high entity counts requires methodical tuning across both the Java Virtual Machine and PaperMC configuration layers.\n\n### Key Optimizations Applied\n1. **Aikar Garbage Collection Flags:** Implemented fine-tuned G1GC parameters to eliminate multi-second garbage collection pauses during world chunk loading.\n2. **Entity Despawn Ranges & Ticking Limits:** Reduced unnecessary passive mob ticking outside player sight radiuses, recovering approximately **18% CPU headroom**.\n3. **Network Compression Threshold:** Tuned network compression to prevent network buffer bottlenecks while minimizing CPU compression overhead on high-frequency packets.\n\n### Results\n- Average server tick time decreased from 38ms to **19ms** under peak weekend traffic.\n- Zero player-reported rubberbanding during community tournament events.',
    'Infrastructure',
    ARRAY['PaperMC', 'Linux', 'Java', 'Server Ops', 'Performance'],
    'Pokefun Network & SMP',
    'published',
    TRUE,
    NOW() - INTERVAL '2 days'
  ),
  (
    'dynamic-developer-journal-release',
    'Launching the Dynamic Developer Journal & Live Project Portfolio',
    'Transformed the personal portfolio into a continuously updated living developer log featuring dynamic project management and GitHub integration.',
    '## Why I Built the Developer Journal\n\nStatic portfolios get outdated fast. As developers, we build, debug, experiment, and deploy new things every week. I wanted a platform where I could publish daily progress, share GitHub repositories, and document milestones in real-time.\n\n### What Was Built\n- **Chronological Work Journal:** Markdown-powered timeline with categories, tags, and direct GitHub links.\n- **Dynamic Project Showcase:** Database-driven project cards and dedicated case study pages.\n- **Protected Admin Publishing Center:** Fast mobile-friendly publishing dashboard with draft preview support.\n- **GitHub API Integration:** Automated repository stars, language, and activity badge integration.\n\nNow, any visitor can see real-time engineering updates and explore code as it evolves.',
    'Launches',
    ARRAY['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'POKEDEVS'],
    'Applied AI Engineering Practice',
    'published',
    TRUE,
    NOW() - INTERVAL '1 day'
  ),
  (
    'community-security-and-anti-abuse-hardening',
    'Architecting Server-Side Anti-Spam & Atomic Rate-Limiting Protection',
    'How we hardened the community feedback and discussion system with atomic PostgreSQL rate limiting and IP-bound admin sessions.',
    '## Security Engineering Summary\n\nWhen opening up public feedback and community discussions, robust abuse protection is mandatory.\n\n### Security Implementations\n- **Atomic PostgreSQL RPCs:** Rate limits enforced atomically in database transactions to prevent race conditions during concurrent visitor submissions.\n- **HMAC IP-Bound Sessions:** Admin cookies are cryptographically signed with PBKDF2 hashes and strictly bound to the verified reverse-proxy client IP.\n- **Zero Leaked Data:** Private voter hashes, reporter IPs, and moderation flags are strictly filtered out before sending responses to public clients.',
    'Features',
    ARRAY['Security', 'PostgreSQL', 'Auth', 'Edge Middleware'],
    'Applied AI Engineering Practice',
    'published',
    FALSE,
    NOW() - INTERVAL '4 days'
  )
ON CONFLICT (slug) DO NOTHING;
