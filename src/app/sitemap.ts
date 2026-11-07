import { MetadataRoute } from 'next';
import { getPublicProjectsList, getPublicJournalEntries } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shifan.pokefun.in';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  try {
    const [projects, journalData] = await Promise.all([
      getPublicProjectsList(),
      getPublicJournalEntries(1, 100),
    ]);

    const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
      url: `${baseUrl}/projects/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(p.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const journalRoutes: MetadataRoute.Sitemap = journalData.entries.map((j) => ({
      url: `${baseUrl}/journal/${j.slug}`,
      lastModified: j.updated_at ? new Date(j.updated_at) : new Date(j.published_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...projectRoutes, ...journalRoutes];
  } catch (e) {
    return staticRoutes;
  }
}
