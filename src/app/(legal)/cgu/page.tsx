import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Generales d'Utilisation - AlerteMedicaments",
  description: "CGU d'AlerteMedicaments",
};

export default function CGUPage() {
  return (
    <article className="prose prose-teal max-w-none">
      <h1>Conditions Generales d&apos;Utilisation</h1>
      <p className="lead">Derniere mise a jour : Decembre 2024</p>

      <h2>1. Objet</h2>
      <p>
        Les presentes Conditions Generales d&apos;Utilisation (CGU) definissent les
        modalites d&apos;utilisation du service AlerteMedicaments, plateforme gratuite
        de suivi des ruptures et tensions d&apos;approvisionnement de medicaments en France.
      </p>

      <h2>2. Description du service</h2>
      <p>AlerteMedicaments propose :</p>
      <ul>
        <li>Consultation de la liste des medicaments en rupture ou tension</li>
        <li>Recherche de medicaments par nom, laboratoire ou molecule</li>
        <li>Creation d&apos;alertes personnalisees par email</li>
        <li>Notifications lors des changements de disponibilite</li>
      </ul>
      <p>
        <strong>Service 100% gratuit</strong> - aucun abonnement payant n&apos;est propose.
      </p>

      <h2>3. Source des donnees</h2>
      <p>
        Les informations sur la disponibilite des medicaments proviennent des
        donnees publiques de l&apos;ANSM (Agence Nationale de Securite du Medicament).
      </p>
      <p>
        AlerteMedicaments n&apos;est pas un service officiel de l&apos;administration
        et ne peut garantir l&apos;exactitude ou l&apos;exhaustivite des informations.
      </p>

      <h2>4. Inscription</h2>
      <p>
        La creation d&apos;un compte est necessaire pour configurer des alertes.
        L&apos;utilisateur s&apos;engage a fournir une adresse email valide.
      </p>

      <h2>5. Avertissement medical</h2>
      <p>
        <strong>IMPORTANT :</strong> AlerteMedicaments est un service d&apos;information.
        Les informations fournies ne constituent pas un avis medical.
      </p>
      <p>
        En cas de question sur votre traitement ou la disponibilite d&apos;un medicament,
        consultez votre medecin, pharmacien ou l&apos;ANSM.
      </p>
      <p>
        Ne modifiez jamais votre traitement sans avis medical.
      </p>

      <h2>6. Limitation de responsabilite</h2>
      <p>
        AlerteMedicaments fait ses meilleurs efforts pour fournir des informations
        a jour, mais ne peut garantir :
      </p>
      <ul>
        <li>L&apos;exactitude des informations en temps reel</li>
        <li>La disponibilite permanente du service</li>
        <li>L&apos;envoi de toutes les notifications</li>
      </ul>
      <p>
        La societe editrice ne saurait etre tenue responsable des dommages
        resultant de l&apos;utilisation ou de l&apos;impossibilite d&apos;utiliser le service.
      </p>

      <h2>7. Donnees personnelles</h2>
      <p>
        Nous collectons uniquement les donnees necessaires au fonctionnement
        du service (email, preferences de notification).
      </p>
      <p>
        Consultez notre <a href="/confidentialite">Politique de confidentialite</a>
        pour plus de details.
      </p>

      <h2>8. Suppression de compte</h2>
      <p>
        Vous pouvez supprimer votre compte et vos donnees a tout moment
        depuis votre profil ou en nous contactant.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Ces CGU peuvent etre modifiees. Les utilisateurs seront informes
        des changements importants par email.
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Ces CGU sont soumises au droit francais.
      </p>

      <h2>11. Contact</h2>
      <p>
        Pour toute question : contact@alertemedicaments.fr
      </p>
    </article>
  );
}
