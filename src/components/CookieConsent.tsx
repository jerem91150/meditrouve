"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = "cookie_consent";
const CONSENT_VERSION = "1.0";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        // Check if consent is older than 13 months
        const thirteenMonths = 13 * 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp > thirteenMonths) {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const data = { ...prefs, timestamp: Date.now(), version: CONSENT_VERSION };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    setShowBanner(false);

    // Apply preferences
    if (!prefs.analytics) {
      // Disable analytics
      document.cookie = "analytics=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    if (!prefs.marketing) {
      // Disable marketing
      document.cookie = "marketing=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  };

  const acceptAll = () => {
    savePreferences({ essential: true, analytics: true, marketing: true, timestamp: Date.now() });
  };

  const acceptEssentialOnly = () => {
    savePreferences({ essential: true, analytics: false, marketing: false, timestamp: Date.now() });
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {!showDetails ? (
          // Simple banner
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🍪</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nous respectons votre vie privée
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Nous utilisons des cookies pour améliorer votre expérience. Les cookies essentiels
                  sont nécessaires au fonctionnement du site. Vous pouvez personnaliser vos préférences.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={acceptAll}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                  >
                    Tout accepter
                  </button>
                  <button
                    onClick={acceptEssentialOnly}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Essentiel uniquement
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="px-6 py-2.5 text-teal-600 hover:underline font-medium"
                  >
                    Personnaliser
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-teal-600">Politique de confidentialité</Link>
              <span className="mx-2">•</span>
              <Link href="/terms" className="hover:text-teal-600">CGU</Link>
            </div>
          </div>
        ) : (
          // Detailed preferences
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paramètres des cookies
            </h3>

            <div className="space-y-4 mb-6">
              {/* Essential */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Cookies essentiels</h4>
                  <p className="text-sm text-gray-600">
                    Nécessaires au fonctionnement du site (session, sécurité)
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-teal-600 rounded-full"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                  <span className="ml-3 text-xs text-gray-500">Requis</span>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Cookies analytiques</h4>
                  <p className="text-sm text-gray-600">
                    Nous aident à comprendre l&apos;utilisation du site (anonymisés)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow"></div>
                </label>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Cookies marketing</h4>
                  <p className="text-sm text-gray-600">
                    Permettent d&apos;afficher des contenus personnalisés
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow"></div>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveCustom}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Enregistrer mes préférences
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-900"
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
