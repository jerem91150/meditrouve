import Link from "next/link";
import { Pill, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-2 rounded-xl"><Pill className="h-6 w-6 text-white" /></div>
              <span className="text-xl font-bold text-white">MediTrouve</span>
            </div>
            <p className="text-gray-500 leading-relaxed">Service gratuit de suivi des ruptures et tensions d&apos;approvisionnement de medicaments en France.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li><Link href="/medications" className="hover:text-white transition-colors">Medicaments</Link></li>
              <li><a href="/#features" className="hover:text-white transition-colors">Fonctionnalites</a></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog Sante</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions legales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialite</Link></li>
              <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Source</h4>
            <p className="text-gray-500 text-sm leading-relaxed">Les donnees de disponibilite sont issues de l&apos;ANSM (Agence Nationale de Securite du Medicament).</p>
          </div>
        </div>
        <div className="py-6 border-t border-gray-800 mb-6">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            <strong className="text-gray-400">Information importante :</strong> MediTrouve est un service d&apos;information et ne constitue pas un dispositif medical. Les informations fournies ne remplacent en aucun cas l&apos;avis d&apos;un professionnel de sante. Consultez toujours votre medecin ou pharmacien pour toute question relative a votre traitement. En cas d&apos;urgence, contactez le 15 (SAMU) ou le 112.
          </p>
        </div>
        <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; 2025 MediTrouve. Tous droits reserves.</p>
          <div className="flex items-center gap-2"><Lock className="h-4 w-4" /><span className="text-sm">Donnees securisees</span></div>
        </div>
      </div>
    </footer>
  );
}
