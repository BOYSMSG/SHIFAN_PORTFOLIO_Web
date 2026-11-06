export interface Project {
  id: string;
  title: string;
  tagline: string;
  category: 'Founder Venture' | 'Minecraft Architecture' | 'Web & Platform';
  role: string;
  description: string;
  longDescription?: string;
  highlights: string[];
  techStack: string[];
  url?: string;
  image?: string;
  badge?: string;
}

export interface Venture {
  title: string;
  role: string;
  type: 'Primary Founder Project' | 'Family Business' | 'Creator Venture';
  timeline: string;
  description: string;
  details: string[];
  linkText: string;
  linkUrl: string;
  tag: string;
}

export interface SkillCategory {
  category: string;
  skills: { name: string; level?: string; icon?: string }[];
}

export const PORTFOLIO_DATA = {
  profile: {
    fullName: "Mohd Shifan Gouri",
    handle: "BOYS MSG",
    tagline: "Developer · Founder · AI Practitioner · Creator",
    summary: "Managing Minecraft server communities, building modern web applications, and applying practical AI-assisted development workflows. Bridging hands-on software development with family retail business support.",
    location: "India",
    subdomain: "shifan.pokefun.in",
    avatar: "/assets/boysmsg.png",
    heroImage: "/assets/shifan-hero-zoomed.jpg",
    projectArtwork: "/assets/YoutubeThumbnailDownload.com-HTIGNHNVafw-full-hd-(1280×720).jpg",
  },

  socials: {
    github: "https://github.com/BOYSMSG",
    instagram: "https://www.instagram.com/shifangouri01/",
    youtubePersonal: "https://www.youtube.com/@msgboys9723",
    youtubePokefun: "https://www.youtube.com/@Pokefunsmp",
    youtubeGaming: "https://www.youtube.com/@MSGbhai01",
    pokefunTeam: "https://pokefun.in/team",
    discordPokefun: "https://discord.com/invite/NtE8QBkmwR",
    discordPokedrock: "https://discord.gg/9AU3kHZZDT",
    discordCobbleDrock: "https://discord.com/invite/reKPgCBguX",
    gouriFashions: "http://gourifashions.com/",
    pokefunStore: "https://store.pokefun.in/",
  },

  education: {
    institution: "Amity Online",
    degree: "Bachelor of Computer Applications (BCA)",
    status: "Pursuing Bachelor of Computer Applications (BCA) — Online Program",
    focus: "Software Engineering, Computer Science Foundations, Web Architectures & Systems",
    note: "Theoretical foundations actively connected with real-world server and web development practice.",
  },

  ventures: [
    {
      title: "Pokefun Ecosystem",
      role: "Founder & Community Lead",
      type: "Primary Founder Project",
      timeline: "Active & Ongoing",
      tag: "Flagship Project",
      description: "Founder of the Pokefun multiplayer Minecraft and Cobblemon community ecosystem, coordinating server gameplay, community engagement, and web portal management.",
      details: [
        "Coordinates Minecraft game server configurations, basic setups, and community player support.",
        "Integrates community web portals, player documentation, and store delivery links.",
        "Leads community moderation and organizes in-game player events.",
      ],
      linkText: "Explore Pokefun Team",
      linkUrl: "https://pokefun.in/team",
    },
    {
      title: "Gouri Fashions",
      role: "Family Business Support (Role wording pending owner confirmation)",
      type: "Family Business",
      timeline: "Family Business Support",
      tag: "Retail Enterprise",
      description: "Supporting our family-owned retail clothing business specializing in men's formal wear, suits, coats, traditional kurta-pyjama, and custom-fit occasion attire.",
      details: [
        "Assisting with daily retail operations, catalog organization, and customer service.",
        "Supporting digital presentation and online brand visibility.",
        "Contributing to seasonal showcase planning for formal and wedding apparel.",
      ],
      linkText: "Visit Gouri Fashions",
      linkUrl: "http://gourifashions.com/",
    },
  ] as Venture[],

  projects: [
    {
      id: "pokefun-core",
      title: "Pokefun Network & SMP",
      tagline: "Minecraft Community & Server Network",
      category: "Founder Venture",
      badge: "Core Venture",
      role: "Founder & Server Administrator",
      description: "A multiplayer Minecraft server community platform featuring SMP gameplay, automated player rank delivery, and community events.",
      highlights: [
        "Configured and maintained PaperMC game server files, plugins, and permissions",
        "Connected automated web store rank fulfillment via store.pokefun.in",
        "Lead player community management, Discord moderation, and in-game events",
      ],
      techStack: ["Java (Server Setup)", "Linux Basics", "MySQL", "Store Webhooks", "Community Management"],
      url: "https://pokefun.in/team",
      image: "/assets/YoutubeThumbnailDownload.com-HTIGNHNVafw-full-hd-(1280×720).jpg",
    },
    {
      id: "cobbledrock",
      title: "CobbleDrock",
      tagline: "Cobblemon & Bedrock Experience",
      category: "Minecraft Architecture",
      badge: "Specialized Addon",
      role: "Founder & Modpack Configurator",
      description: "A dedicated Cobblemon server setup integrating Pokémon-style gameplay mechanics into Minecraft for community players.",
      highlights: [
        "Tested and tuned Cobblemon mod files and compatibility settings",
        "Built Discord player support channels and troubleshooting guides",
        "Iterated on configurations directly from player feedback and bug reports",
      ],
      techStack: ["Cobblemon Modding", "Server Config", "Community Support", "Discord API"],
      url: "https://cobbledrock.pokefun.in/",
    },
    {
      id: "pokedrock",
      title: "Pokedrock Platform",
      tagline: "Resource Hub & Player Portal",
      category: "Minecraft Architecture",
      badge: "Player Portal",
      role: "Web Developer & Resource Curator",
      description: "A lightweight web portal providing installation tutorials, resource pack downloads, and connectivity guides for PokeDrock players.",
      highlights: [
        "Designed and built responsive portal layout for smooth player onboarding",
        "Curated and hosted client resource packs and mod installation steps",
        "Connected download portal with Discord support channels",
      ],
      techStack: ["HTML5", "CSS3 / Tailwind", "JavaScript", "Documentation Hosting"],
      url: "https://pokedrock.pokefun.in/",
    },
    {
      id: "ai-workflow-engine",
      title: "Practical AI Development Workflow",
      tagline: "Prompt Design, Manual Code Review & Verification",
      category: "Web & Platform",
      badge: "Development Practice",
      role: "Independent Developer",
      description: "A personal engineering practice combining modern LLMs with strict manual code inspection, automated build testing, and thorough verification.",
      highlights: [
        "Structured prompt workflows for rapid component scaffolding",
        "Rigorous manual line-by-line review of all AI-generated code",
        "Automated type checking and build verification gates prior to deployment",
      ],
      techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Manual Code Review", "Git"],
    },
  ] as Project[],

  skills: [
    {
      category: "Development & Languages",
      skills: [
        { name: "TypeScript / JavaScript" },
        { name: "React / Next.js" },
        { name: "Node.js / Express" },
        { name: "HTML5 / CSS3 / Tailwind" },
        { name: "Java (Minecraft Ecosystem)" },
        { name: "SQL / Relational Databases" },
      ],
    },
    {
      category: "Infrastructure & Systems",
      skills: [
        { name: "Linux Server Administration" },
        { name: "Minecraft Server Setup & Configuration" },
        { name: "Git & Version Control" },
        { name: "DNS & Subdomain Routing" },
        { name: "Server Configuration & Setup" },
        { name: "Webhooks & Automation" },
      ],
    },
    {
      category: "AI-Assisted Engineering",
      skills: [
        { name: "Prompt Orchestration & Architecture" },
        { name: "LLM Output Verification & QA" },
        { name: "Rapid Prototyping Workflows" },
        { name: "Code Review & Refactoring" },
        { name: "Tool & Model Selection" },
      ],
    },
    {
      category: "Leadership & Business",
      skills: [
        { name: "Community Moderation & Leadership" },
        { name: "Web Store & Digital Operations" },
        { name: "Retail Operations Support (Gouri Fashions)" },
        { name: "Content Production & YouTube" },
        { name: "Technical Project Scoping" },
      ],
    },
  ] as SkillCategory[],

  servicesComingSoon: [
    {
      title: "Minecraft & Cobblemon Architecture",
      description: "Guidance on Minecraft server setup, modpack configuration, and community portal integration.",
      badge: "Coming Soon",
      icon: "Server",
    },
    {
      title: "Web Platform Development",
      description: "Clean, responsive websites, landing pages, and web apps built with Next.js, TypeScript, and modern styling.",
      badge: "Coming Soon",
      icon: "Code",
    },
    {
      title: "AI-Accelerated Workflow Setup",
      description: "Advising creators and developers on integrating pragmatic AI tooling into their building workflows safely.",
      badge: "Coming Soon",
      icon: "Cpu",
    },
    {
      title: "Custom Digital Solutions & Guides",
      description: "Specialized configuration templates, mod deployment guides, and targeted automation scripts.",
      badge: "Coming Soon",
      icon: "Layers",
    },
  ],

  contentChannels: [
    {
      platform: "YouTube",
      name: "@msgboys9723",
      focus: "Personal Journey & Tech",
      url: "https://www.youtube.com/@msgboys9723",
      handle: "BOYS MSG",
    },
    {
      platform: "YouTube",
      name: "@Pokefunsmp",
      focus: "Pokefun Gameplay & Server Updates",
      url: "https://www.youtube.com/@Pokefunsmp",
      handle: "Pokefun SMP",
    },
    {
      platform: "YouTube",
      name: "@MSGbhai01",
      focus: "Gaming & Content Creation",
      url: "https://www.youtube.com/@MSGbhai01",
      handle: "MSG bhai",
    },
    {
      platform: "Instagram",
      name: "@shifangouri01",
      focus: "Behind The Scenes & Lifestyle",
      url: "https://www.instagram.com/shifangouri01/",
      handle: "Mohd Shifan",
    },
  ],
};
