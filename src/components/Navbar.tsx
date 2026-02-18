import Link from "next/link";
import { Pill } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-r from-teal-500 to-cyan-600 p-2 rounded-xl">
                <Pill className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">MediTrouve</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/medications" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Medicaments</Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Blog Sante</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Connexion</Link>
            <Link href="/register" className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
              <span className="relative px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-200 inline-block">Creer une alerte</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
