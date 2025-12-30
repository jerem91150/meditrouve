import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialite - AlerteMedicaments",
  description: "Politique de confidentialite d'AlerteMedicaments",
};

export default function ConfidentialitePage() {
  return (
    <article className="prose prose-teal max-w-none">
      <h1>Politique de Confidentialite</h1>
      <p className="lead">Derniere mise a jour : Decembre 2024</p>

      <h2>1. Introduction</h2>
      <p>
        AlerteMedicaments s&apos;engage a proteger votre vie privee. Cette politique
        explique comment nous collectons et utilisons vos donnees personnelles.
      </p>

      <h2>2. Donnees collectees</h2>
      <p>Nous collectons uniquement les donnees necessaires au service :</p>

      <h3>2.1 Donnees de compte</h3>
      <ul>
        <li>Adresse email</li>
        <li>Nom (optionnel)</li>
        <li>Numero de telephone (optionnel, pour les alertes SMS)</li>
        <li>Mot de passe (chiffre)</li>
      </ul>

      <h3>2.2 Donnees d&apos;alertes</h3>
      <ul>
        <li>Liste des medicaments suivis</li>
        <li>Preferences de notification</li>
        <li>Historique des alertes recues</li>
      </ul>

      <h3>2.3 Donnees techniques</h3>
      <ul>
        <li>Adresse IP (anonymisee)</li>
        <li>Pages visitees</li>
        <li>Navigateur utilise</li>
      </ul>

      <h2>3. Utilisation des donnees</h2>
      <p>Vos donnees sont utilisees pour :</p>
      <ul>
        <li>Gerer votre compte</li>
        <li>Envoyer les alertes de disponibilite</li>
        <li>Ameliorer le service</li>
        <li>Assurer la securite de la plateforme</li>
      </ul>
      <p>
        <strong>Nous ne vendons jamais vos donnees.</strong><br />
        <strong>Nous n&apos;utilisons pas vos donnees a des fins publicitaires.</strong>
      </p>

      <h2>4. Partage des donnees</h2>
      <p>Vos donnees peuvent etre partagees avec :</p>
      <ul>
        <li><strong>Hebergeur</strong> (Vercel) : pour le fonctionnement du site</li>
        <li><strong>Service email</strong> : pour l&apos;envoi des notifications</li>
      </ul>
      <p>Aucun partage commercial avec des tiers.</p>

      <h2>5. Conservation</h2>
      <ul>
        <li><strong>Compte actif</strong> : donnees conservees tant que le compte existe</li>
        <li><strong>Compte supprime</strong> : donnees effacees sous 30 jours</li>
        <li><strong>Logs techniques</strong> : 12 mois maximum</li>
      </ul>

      <h2>6. Vos droits (RGPD)</h2>
      <p>Vous pouvez a tout moment :</p>
      <ul>
        <li><strong>Acceder</strong> a vos donnees</li>
        <li><strong>Rectifier</strong> vos informations</li>
        <li><strong>Supprimer</strong> votre compte</li>
        <li><strong>Exporter</strong> vos donnees</li>
        <li><strong>Vous opposer</strong> au traitement</li>
      </ul>
      <p>Contact : dpo@alertemedicaments.fr</p>

      <h2>7. Securite</h2>
      <p>Nous protegeons vos donnees par :</p>
      <ul>
        <li>Chiffrement HTTPS</li>
        <li>Mots de passe haches</li>
        <li>Acces restreints</li>
        <li>Sauvegardes regulieres</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>Nous utilisons uniquement des cookies essentiels :</p>
      <ul>
        <li><strong>Session</strong> : maintien de la connexion</li>
        <li><strong>Preferences</strong> : parametres utilisateur</li>
      </ul>
      <p>Aucun cookie publicitaire ou de tracking.</p>

      <h2>9. Modifications</h2>
      <p>
        Cette politique peut etre mise a jour. Les changements importants
        seront notifies par email.
      </p>

      <h2>10. Contact</h2>
      <p>
        <strong>Delegue a la Protection des Donnees</strong><br />
        Email : dpo@alertemedicaments.fr
      </p>
      <p>
        Vous pouvez egalement contacter la CNIL : www.cnil.fr
      </p>
    </article>
  );
}
