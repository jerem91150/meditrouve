"use client";

interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo?: string;
  description: string;
  sameAs?: string[];
}

interface WebSiteSchemaProps {
  name: string;
  url: string;
  description: string;
  searchUrl: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

interface DrugSchemaProps {
  name: string;
  activeIngredient?: string;
  manufacturer?: string;
  dosageForm?: string;
  description?: string;
  url: string;
}

export function OrganizationSchema({
  name,
  url,
  logo,
  description,
  sameAs = [],
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo: logo || `${url}/icon.png`,
    description,
    sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "French",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema({
  name,
  url,
  description,
  searchUrl,
}: WebSiteSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "fr-FR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function DrugSchema({
  name,
  activeIngredient,
  manufacturer,
  dosageForm,
  description,
  url,
}: DrugSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Drug",
    name,
    ...(activeIngredient && { activeIngredient }),
    ...(manufacturer && {
      manufacturer: {
        "@type": "Organization",
        name: manufacturer,
      },
    }),
    ...(dosageForm && { dosageForm }),
    ...(description && { description }),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function MedicalWebPageSchema({
  name,
  description,
  url,
  datePublished,
  dateModified,
}: {
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name,
    description,
    url,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    inLanguage: "fr-FR",
    isAccessibleForFree: true,
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
