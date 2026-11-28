"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, LocateFixed } from "lucide-react";

interface LocationSuggestion {
  id: string;
  display: string;
  name: string;
  district: string;
  state: string;
  type: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  isDark?: boolean;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "e.g., Rajamundry, Andhra Pradesh",
  className = "",
  disabled = false,
  required = false,
  isDark = false
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [geoError, setGeoError] = useState<string | null>(null);
  const isAutoSelecting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isAutoSelecting.current) {
      isAutoSelecting.current = false;
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/location-suggestions?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error("[LocationAutocomplete] Error fetching suggestions:", error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    isAutoSelecting.current = true;
    onChange(suggestion.fullAddress, suggestion.lat, suggestion.lng);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUseCurrentLocation = async () => {
    setGeoLoading(true);
    setGeoError(null);

    const tryBrowserGeo = (): Promise<{ latitude: number; longitude: number }> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("No geolocation"));
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
      });
    };

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const coords = await tryBrowserGeo();
        lat = coords.latitude;
        lng = coords.longitude;
      } catch (e) {
        console.warn("[LocationAutocomplete] Browser geolocation failed, trying server IP:", e);
      }

      // ── IF BROWSER GEOLOCATION OBTAINED LAT/LNG: ──────────────────────────
      if (lat != null && lng != null) {
        let fullAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(`/api/location-suggestions?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.fullAddress) {
              fullAddress = data.fullAddress;
            }
          }
        } catch (_) {}

        isAutoSelecting.current = true;
        onChange(fullAddress, lat, lng);
        setGeoLoading(false);
        return;
      }

      // ── IF BROWSER GEOLOCATION FAILED, TRY SERVER IP GEOLOCATION: ──────────
      try {
        const res = await fetch(`/api/location-suggestions?ip=true`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.fullAddress && data.lat != null && data.lng != null) {
            isAutoSelecting.current = true;
            onChange(data.fullAddress, data.lat, data.lng);
            setGeoLoading(false);
            return;
          }
        }
      } catch (_) {}

      // ── ONLY IF BOTH BROWSER GPS AND SERVER IP GEOLOCATION FAILED: ────────
      setGeoError("Could not auto-detect location. Please type your shop location in the search box.");
    } catch (err) {
      console.error("[LocationAutocomplete] Failed to auto-detect location:", err);
      setGeoError("Could not auto-detect location. Please type your shop location in the search box.");
    } finally {
      setGeoLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-3 pr-10 text-[13px] font-medium border rounded-lg outline-none transition-colors ${
            isDark
              ? "bg-[#232325] text-[#EDEDED] placeholder:text-[#85858B] border-white/[0.10] focus:border-white/30"
              : "bg-white dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border-[#171717]/[0.12] dark:border-white/[0.10] focus:border-[#171717]/40 dark:focus:border-white/30"
          } ${className}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? "border-white/20 border-t-white" : "border-black/20 dark:border-white/20 border-t-black dark:border-t-white"}`} />
          ) : (
            <MapPin className={`w-4 h-4 ${isDark ? "text-[#85858B]" : "text-[#737373] dark:text-[#85858B]"}`} strokeWidth={1.75} />
          )}
        </div>
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          className={`absolute z-50 w-full mt-1 border rounded-xl shadow-lg max-h-60 overflow-y-auto ${
            isDark
              ? "bg-[#19191B] border-white/[0.10]"
              : "bg-white dark:bg-[#19191B] border-[#171717]/[0.10] dark:border-white/[0.10]"
          }`}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              onClick={() => selectSuggestion(suggestion)}
              className={`px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                isDark
                  ? `border-white/[0.06] ${index === selectedIndex ? "bg-[#232325] text-[#EDEDED]" : "hover:bg-[#232325] text-[#EDEDED]"}`
                  : `border-[#171717]/[0.06] dark:border-white/[0.06] ${index === selectedIndex ? "bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED]" : "hover:bg-[#F4F4F5] dark:hover:bg-[#232325] text-[#171717] dark:text-[#EDEDED]"}`
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? "text-[#85858B]" : "text-[#737373] dark:text-[#85858B]"}`} strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px]">{suggestion.name}</div>
                  <div className={`text-[11px] ${isDark ? "text-[#A1A1A6]" : "text-[#525252] dark:text-[#A1A1A6]"}`}>
                    {suggestion.district}, {suggestion.state}
                  </div>
                  <div className={`text-[10px] capitalize mt-0.5 ${isDark ? "text-[#85858B]" : "text-[#737373] dark:text-[#85858B]"}`}>
                    {suggestion.type}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Use Current Location button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={disabled || geoLoading}
        className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-primary-blue hover:underline disabled:opacity-50 transition-all"
      >
        {geoLoading ? (
          <div className="w-3.5 h-3.5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
        ) : (
          <LocateFixed className="w-3.5 h-3.5" />
        )}
        {geoLoading ? "Detecting location..." : "Use current location"}
      </button>
      {geoError && (
        <p className="mt-1 text-[11px] text-[#DC2626] dark:text-[#E5484D]">{geoError}</p>
      )}
    </div>
  );
}
