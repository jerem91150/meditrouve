import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions legales - AlerteMedicaments",
  description: "Mentions legales d'AlerteMedicaments",
};

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-teal max-w-none">
      <h1>Mentions legales</h1>
      <p className="lead">Derniere mise a jour : Decembre 2024</p>

      <h2>1. Editeur du site</h2>
      <p>
        Le site AlerteMedicaments est edite par :<br />
        <strong>[Nom de la societe]</strong><br />
        [Forme juridique]<br />
        Siege social : [Adresse]<br />
        RCS : [Numero RCS]<br />
        Email : contact@alertemedicaments.fr
      </p>

      <h2>2. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est [Nom du Directeur].
      </p>

      <h2>3. Hebergement</h2>
      <p>
        Le site est heberge par :<br />
        <strong>Vercel Inc.</strong><br />
        340 S Lemon Ave #4133<br />
        Walnut, CA 91789, USA<br />
        https://vercel.com
      </p>

      <h2>4. Source des donnees</h2>
      <p>
        Les informations relatives a la disponibilite des medicaments sont issues
        des donnees publiques de l&apos;<strong>ANSM</strong> (Agence Nationale de Securite
        du Medicament et des produits de sante).
      </p>
      <p>
        AlerteMedicaments n&apos;est pas affilie a l&apos;ANSM et n&apos;est pas un service officiel
        de l&apos;administration francaise.
      </p>

      <h2>5. Limitation de responsabilite</h2>
      <p>
        AlerteMedicaments est un service d&apos;information et d&apos;alerte. Les informations
        fournies le sont a titre indicatif et peuvent comporter des erreurs ou retards
        par rapport aux donnees officielles.
      </p>
      <p>
        En cas de doute sur la disponibilite d&apos;un medicament, nous vous recommandons
        de contacter directement votre pharmacie ou l&apos;ANSM.
      </p>
      <p>
        <strong>Ce service ne remplace en aucun cas l&apos;avis d&apos;un professionnel de sante.</strong>
      </p>

      <h2>6. Propriete intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu du site AlerteMedicaments est protege par le droit
        d&apos;auteur. Toute reproduction sans autorisation est interdite.
      </p>

      <h2>7. Donnees personnelles</h2>
      <p>
        Conformement au RGPD, vous disposez d&apos;un droit d&apos;acces, de rectification
        et de suppression de vos donnees personnelles.
      </p>
      <p>
        Pour plus d&apos;informations, consultez notre{" "}
        <a href="/confidentialite">Politique de confidentialite</a>.
      </p>

      <h2>8. Contact</h2>
      <p>
        Pour toute question : contact@alertemedicaments.fr
      </p>
    </article>
  );
}
