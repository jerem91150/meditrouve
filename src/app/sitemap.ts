import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.meditrouve.fr";

  // Pages statiques principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/ruptures`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/carte`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    // Landing pages SEO
    {
      url: `${baseUrl}/ozempic-rupture`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    // B2B
    {
      url: `${baseUrl}/pour-pharmaciens`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pour-pharmaciens/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Auth
    {
      url: `${baseUrl}/inscription`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Gamification
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.6,
    },
    // Blog
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/comprendre-ruptures-medicaments-france`,
      lastModified: new Date("2025-01-15"),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    // Legal
    {
      url: `${baseUrl}/cgu`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/confidentialite`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Pages dynamiques des medicaments en rupture/tension (SEO critique)
  let medicationPages: MetadataRoute.Sitemap = [];

  try {
    const medications = await prisma.medication.findMany({
      where: {
        status: { in: ["RUPTURE", "TENSION"] },
      },
      select: {
        cisCode: true,
        name: true,
        updatedAt: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    medicationPages = medications.map((med) => ({
      url: `${baseUrl}/medicament/${med.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${med.cisCode}`,
      lastModified: med.updatedAt,
      changeFrequency: "daily" as const,
      priority: med.status === "RUPTURE" ? 0.85 : 0.75,
    }));
  } catch (error) {
    console.error("Error fetching medications for sitemap:", error);
  }

  return [...staticPages, ...medicationPages];
}
