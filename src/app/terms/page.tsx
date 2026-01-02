"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-white/80 hover:text-white mb-4 inline-block">
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-white/90 mt-2">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation
              du service Alerte Médicaments, accessible via le site web et les applications mobiles.
              En utilisant ce service, vous acceptez ces conditions dans leur intégralité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du service</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Alerte Médicaments est un service d&apos;information sur la disponibilité des médicaments
              en France. Il permet de :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Consulter le statut de disponibilité des médicaments</li>
              <li>Configurer des alertes personnalisées</li>
              <li>Scanner des ordonnances pour identifier les médicaments</li>
              <li>Localiser des pharmacies à proximité</li>
            </ul>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>⚠️ Avertissement médical :</strong> Ce service est fourni à titre informatif uniquement.
                Il ne remplace en aucun cas l&apos;avis d&apos;un professionnel de santé. Consultez toujours
                votre médecin ou pharmacien avant toute décision concernant votre traitement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Inscription et compte</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              L&apos;utilisation de certaines fonctionnalités nécessite la création d&apos;un compte.
              Vous vous engagez à :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la confidentialité de vos identifiants</li>
              <li>Notifier immédiatement toute utilisation non autorisée</li>
              <li>Ne pas créer plusieurs comptes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Données de santé</h2>
            <p className="text-gray-600 leading-relaxed">
              Les données relatives aux médicaments que vous suivez sont des données de santé
              protégées par le RGPD. En utilisant ce service, vous consentez expressément au
              traitement de ces données conformément à notre <Link href="/privacy" className="text-teal-600 hover:underline">Politique de Confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sources des données</h2>
            <p className="text-gray-600 leading-relaxed">
              Les informations sur la disponibilité des médicaments proviennent de sources officielles,
              notamment l&apos;ANSM (Agence Nationale de Sécurité du Médicament) et la Base de Données
              Publique des Médicaments. Nous mettons tout en œuvre pour maintenir ces données à jour,
              mais ne garantissons pas leur exactitude en temps réel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriété intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed">
              L&apos;ensemble des contenus (textes, images, logos, code) sont protégés par le droit
              de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation de responsabilité</h2>
            <p className="text-gray-600 leading-relaxed">
              Alerte Médicaments décline toute responsabilité en cas de :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
              <li>Informations inexactes ou obsolètes</li>
              <li>Interruption du service</li>
              <li>Décisions médicales prises sur la base des informations fournies</li>
              <li>Utilisation frauduleuse de votre compte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Résiliation</h2>
            <p className="text-gray-600 leading-relaxed">
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l&apos;application.
              Nous nous réservons le droit de suspendre ou résilier un compte en cas de violation des CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Droit applicable</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes CGU sont régies par le droit français. Tout litige sera soumis
              aux tribunaux compétents de Paris.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question : <a href="mailto:contact@alertemedicaments.fr" className="text-teal-600 hover:underline">contact@alertemedicaments.fr</a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} Alerte Médicaments - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}
