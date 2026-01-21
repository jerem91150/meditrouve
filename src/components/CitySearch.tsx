"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, X, Loader2, ChevronRight } from "lucide-react";

interface City {
  name: string;
  postalCode: string | null;
  department: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  displayName: string;
}

interface CitySearchProps {
  onCitySelect: (city: { lat: number; lng: number; name: string }) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export default function CitySearch({
  onCitySelect,
  onClear,
  placeholder = "Rechercher une ville...",
  className = "",
}: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer les suggestions si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce pour la recherche
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/geocode/cities?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSuggestions(data.cities || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("City search error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    if (selectedCity) return; // Ne pas chercher si une ville est déjà sélectionnée

    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, fetchSuggestions, selectedCity]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectCity(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setQuery(city.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    onCitySelect({
      lat: city.latitude,
      lng: city.longitude,
      name: city.displayName,
    });
  };

  const clearSelection = () => {
    setSelectedCity(null);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
    onClear?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (selectedCity) {
      setSelectedCity(null);
      onClear?.();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
            selectedCity
              ? "border-emerald-300 bg-emerald-50 focus:ring-emerald-200"
              : "border-gray-200 bg-white focus:ring-teal-200 focus:border-teal-300"
          }`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
        {!loading && selectedCity && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Effacer la sélection"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Dropdown des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.postalCode}`}
              onClick={() => selectCity(city)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                index === selectedIndex ? "bg-teal-50" : ""
              } ${index !== suggestions.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {city.name}
                  {city.postalCode && (
                    <span className="text-gray-500 font-normal ml-1">
                      ({city.postalCode})
                    </span>
                  )}
                </p>
                {city.department && (
                  <p className="text-sm text-gray-500 truncate">
                    {city.department}
                    {city.region && `, ${city.region}`}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Message si pas de résultats */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
          <p className="text-gray-500 text-center text-sm">
            Aucune ville trouvée pour &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
