"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-white/80 hover:text-white mb-4 inline-block">
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
          <p className="text-white/90 mt-2">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Alerte Médicaments (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) s&apos;engage à protéger votre vie privée.
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons
              vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD)
              et à la loi Informatique et Libertés.
            </p>
          </section>

          {/* Responsable du traitement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Responsable du traitement</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600">
                <strong>Alerte Médicaments</strong><br />
                Email : contact@alertemedicaments.fr<br />
                DPO (Délégué à la Protection des Données) : dpo@alertemedicaments.fr
              </p>
            </div>
          </section>

          {/* Données collectées */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Données personnelles collectées</h2>
            <p className="text-gray-600 mb-4">Nous collectons les catégories de données suivantes :</p>

            <div className="space-y-4">
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-semibold text-gray-900">Données d&apos;identification</h3>
                <p className="text-gray-600 text-sm">Nom, prénom, adresse email, mot de passe (chiffré)</p>
              </div>

              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-semibold text-gray-900">Données de santé</h3>
                <p className="text-gray-600 text-sm">
                  Médicaments suivis, alertes configurées, ordonnances scannées (si utilisé).
                  Ces données sont considérées comme sensibles au sens du RGPD.
                </p>
              </div>

              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-semibold text-gray-900">Données techniques</h3>
                <p className="text-gray-600 text-sm">
                  Adresse IP, type d&apos;appareil, identifiants de notification push,
                  données de géolocalisation (si autorisé)
                </p>
              </div>

              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-semibold text-gray-900">Données d&apos;utilisation</h3>
                <p className="text-gray-600 text-sm">
                  Historique de recherche, interactions avec l&apos;application,
                  préférences de notification
                </p>
              </div>
            </div>
          </section>

          {/* Base légale */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base légale du traitement</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold">Finalité</th>
                    <th className="text-left p-3 font-semibold">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3 text-gray-600">Création et gestion de compte</td>
                    <td className="p-3 text-gray-600">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-600">Alertes de disponibilité</td>
                    <td className="p-3 text-gray-600">Consentement explicite</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-600">Traitement des données de santé</td>
                    <td className="p-3 text-gray-600">Consentement explicite (Art. 9 RGPD)</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-600">Amélioration du service</td>
                    <td className="p-3 text-gray-600">Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-600">Notifications marketing</td>
                    <td className="p-3 text-gray-600">Consentement</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Durée de conservation</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Données de compte :</strong> Conservées pendant la durée de votre inscription + 3 ans après suppression</li>
              <li><strong>Données de santé :</strong> Supprimées immédiatement à la demande ou 1 an après la dernière activité</li>
              <li><strong>Logs techniques :</strong> 12 mois maximum</li>
              <li><strong>Cookies :</strong> 13 mois maximum</li>
            </ul>
          </section>

          {/* Vos droits */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Vos droits RGPD</h2>
            <p className="text-gray-600 mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-800">Droit d&apos;accès</h3>
                <p className="text-sm text-teal-700">Obtenir une copie de vos données personnelles</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-800">Droit de rectification</h3>
                <p className="text-sm text-teal-700">Corriger vos données inexactes</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-800">Droit à l&apos;effacement</h3>
                <p className="text-sm text-teal-700">Demander la suppression de vos données</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-800">Droit à la portabilité</h3>
                <p className="text-sm text-teal-700">Recevoir vos données dans un format lisible</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-800">Droit d&apos;opposition</h3>
                <p className="text-sm text-teal-700">S&apos;opposer au traitement de vos données</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-800">Droit à la limitation</h3>
                <p className="text-sm text-teal-700">Limiter le traitement de vos données</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Pour exercer vos droits :</strong> Rendez-vous dans Profil → Mes données,
                ou contactez-nous à <a href="mailto:dpo@alertemedicaments.fr" className="underline">dpo@alertemedicaments.fr</a>
              </p>
            </div>
          </section>

          {/* Sécurité */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Sécurité des données</h2>
            <p className="text-gray-600 mb-4">Nous mettons en œuvre les mesures suivantes :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)</li>
              <li>Mots de passe hachés avec bcrypt (facteur de coût 12)</li>
              <li>Authentification à deux facteurs disponible</li>
              <li>Tokens JWT avec expiration courte (30 jours)</li>
              <li>Protection contre les attaques CSRF, XSS, injection SQL</li>
              <li>Rate limiting sur toutes les API</li>
              <li>Audits de sécurité réguliers</li>
              <li>Accès aux données limité au personnel autorisé</li>
            </ul>
          </section>

          {/* Transferts */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Transferts de données</h2>
            <p className="text-gray-600">
              Vos données sont hébergées au sein de l&apos;Union Européenne.
              En cas de transfert hors UE (services tiers), nous nous assurons que des
              garanties appropriées sont en place (Clauses Contractuelles Types, décision d&apos;adéquation).
            </p>
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Sous-traitants :</h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Vercel (hébergement) - UE/US avec CCT</li>
                <li>Firebase (notifications) - UE/US avec CCT</li>
                <li>PostgreSQL (base de données) - UE</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies</h2>
            <p className="text-gray-600 mb-4">Nous utilisons les cookies suivants :</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold">Cookie</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Durée</th>
                    <th className="text-left p-3 font-semibold">Finalité</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3 text-gray-600">session</td>
                    <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Essentiel</span></td>
                    <td className="p-3 text-gray-600">Session</td>
                    <td className="p-3 text-gray-600">Authentification</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-600">consent</td>
                    <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Essentiel</span></td>
                    <td className="p-3 text-gray-600">13 mois</td>
                    <td className="p-3 text-gray-600">Préférences cookies</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-600">analytics</td>
                    <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Statistiques</span></td>
                    <td className="p-3 text-gray-600">13 mois</td>
                    <td className="p-3 text-gray-600">Analyse d&apos;usage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact et réclamations</h2>
            <p className="text-gray-600 mb-4">
              Pour toute question concernant cette politique ou vos données personnelles :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-gray-600">
                <strong>Email :</strong> <a href="mailto:dpo@alertemedicaments.fr" className="text-teal-600 hover:underline">dpo@alertemedicaments.fr</a>
              </p>
              <p className="text-gray-600">
                <strong>Réclamation CNIL :</strong> Si vous estimez que vos droits ne sont pas respectés,
                vous pouvez introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" className="text-teal-600 hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
              </p>
            </div>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modifications</h2>
            <p className="text-gray-600">
              Nous pouvons modifier cette politique à tout moment. En cas de modification substantielle,
              nous vous en informerons par email ou notification dans l&apos;application.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} Alerte Médicaments - Tous droits réservés</p>
          <div className="mt-2 space-x-4">
            <Link href="/terms" className="hover:text-teal-600">Conditions d&apos;utilisation</Link>
            <Link href="/privacy" className="hover:text-teal-600">Politique de confidentialité</Link>
            <Link href="/legal" className="hover:text-teal-600">Mentions légales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
