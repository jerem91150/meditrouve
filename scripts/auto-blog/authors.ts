// ============================================
// 📝 AUTEURS FICTIFS POUR LE BLOG
// Génère un nom d'auteur crédible pour chaque article
// ============================================

export interface Author {
  name: string;
  title: string; // Titre professionnel
  specialty?: string; // Spécialité médicale (optionnel)
}

// Pool d'auteurs (prénoms simples)
const AUTHORS: Author[] = [
  {
    name: "Maëlle",
    title: "Équipe MediTrouve",
    specialty: "Pharmacologie clinique"
  },
  {
    name: "Ellie",
    title: "Équipe MediTrouve",
    specialty: "Vulgarisation scientifique"
  },
  {
    name: "Camille",
    title: "Équipe MediTrouve",
    specialty: "Actualités médicales"
  },
  {
    name: "Jules",
    title: "Équipe MediTrouve",
    specialty: "Médecine de premier recours"
  },
  {
    name: "Jérémy",
    title: "Équipe MediTrouve",
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
  // Sélection aléatoire simple (tous les auteurs sont équivalents maintenant)
  return getRandomAuthor();
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
    "Maëlle": "Membre de l'équipe MediTrouve, spécialisée en pharmacologie clinique.",
    "Ellie": "Rédactrice médicale passionnée par la vulgarisation scientifique.",
    "Camille": "Journaliste santé spécialisée dans l'actualité médicale.",
    "Jules": "Contributeur MediTrouve, expert en médecine de premier recours.",
    "Jérémy": "Fondateur de MediTrouve, passionné par l'innovation en santé."
  };

  return bios[author.name] || `Membre de l'équipe MediTrouve.`;
}
