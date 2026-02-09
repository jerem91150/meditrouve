// ============================================
// 📝 AUTEURS FICTIFS POUR LE BLOG
// Génère un nom d'auteur crédible pour chaque article
// ============================================

export interface Author {
  name: string;
  title: string; // Titre professionnel
  specialty?: string; // Spécialité médicale (optionnel)
}

// Pool d'auteurs avec leurs spécialités
const AUTHORS: Author[] = [
  {
    name: "Dr. Maëlle Dupont",
    title: "Pharmacienne",
    specialty: "Pharmacologie clinique"
  },
  {
    name: "Ellie Martin",
    title: "Rédactrice médicale",
    specialty: "Vulgarisation scientifique"
  },
  {
    name: "Camille Bernard",
    title: "Journaliste santé",
    specialty: "Actualités médicales"
  },
  {
    name: "Dr. Jules Moreau",
    title: "Médecin généraliste",
    specialty: "Médecine de premier recours"
  },
  {
    name: "Jérémy Porteron",
    title: "Chef de projet R&D",
    specialty: "Innovation en santé"
  }
];

/**
 * Sélectionne un auteur aléatoire dans le pool
 */
export function getRandomAuthor(): Author {
  const randomIndex = Math.floor(Math.random() * AUTHORS.length);
  return AUTHORS[randomIndex];
}

/**
 * Sélectionne un auteur en fonction du type d'article
 * @param category - Catégorie de l'article (Actualités, Innovations, etc.)
 * @param isProfessional - Si true, favorise les auteurs médecins/pharmaciens
 */
export function getAuthorForArticle(
  category: string,
  isProfessional: boolean = false
): Author {
  // Si article professionnel, favoriser les auteurs avec "Dr."
  if (isProfessional) {
    const professionalAuthors = AUTHORS.filter(a => a.name.startsWith('Dr.'));
    const randomIndex = Math.floor(Math.random() * professionalAuthors.length);
    return professionalAuthors[randomIndex];
  }

  // Sinon, sélection en fonction de la catégorie
  switch (category.toLowerCase()) {
    case 'innovations':
    case 'traitements':
      // Favoriser les médecins/pharmaciens pour les sujets techniques
      return AUTHORS.filter(a => a.name.startsWith('Dr.'))[
        Math.floor(Math.random() * 2)
      ];
    
    case 'actualités':
    case 'ruptures':
      // Favoriser les journalistes/rédacteurs pour l'actualité
      return AUTHORS.filter(a => !a.name.startsWith('Dr.'))[
        Math.floor(Math.random() * 3)
      ];
    
    default:
      // Aléatoire par défaut
      return getRandomAuthor();
  }
}

/**
 * Formate le nom d'auteur pour l'affichage
 * @param author - Objet auteur
 * @param withTitle - Si true, inclut le titre (ex: "Dr. Maëlle Dupont, Pharmacienne")
 */
export function formatAuthor(author: Author, withTitle: boolean = false): string {
  if (withTitle) {
    return `${author.name}, ${author.title}`;
  }
  return author.name;
}

/**
 * Génère une bio courte pour l'auteur (optionnel, pour le footer d'article)
 */
export function getAuthorBio(author: Author): string {
  const bios: Record<string, string> = {
    "Dr. Maëlle Dupont": "Pharmacienne clinicienne et spécialiste en pharmacologie. Collabore avec MediTrouve pour vulgariser l'information médicale.",
    "Ellie Martin": "Rédactrice médicale passionnée par la communication en santé. Diplômée en biologie et journalisme scientifique.",
    "Camille Bernard": "Journaliste santé depuis 8 ans, spécialisée dans les politiques de santé publique et l'accès aux médicaments.",
    "Dr. Jules Moreau": "Médecin généraliste en exercice, contributeur régulier pour des articles de vulgarisation médicale.",
    "Jérémy Porteron": "Ingénieur R&D et fondateur de MediTrouve. Passionné par l'innovation au service de la santé."
  };

  return bios[author.name] || `${author.title} chez MediTrouve.`;
}
