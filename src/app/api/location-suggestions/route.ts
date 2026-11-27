import { NextRequest, NextResponse } from "next/server";
import { INDIAN_LOCATIONS } from "./comprehensive-locations";

function getNearestIndianLocation(lat: number, lng: number) {
  let minDistance = Infinity;
  let nearest = INDIAN_LOCATIONS[0];

  for (const loc of INDIAN_LOCATIONS) {
    if (loc.lat == null || loc.lng == null) continue;
    const dLat = (loc.lat - lat) * (Math.PI / 180);
    const dLng = (loc.lng - lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) *
        Math.cos(loc.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = 6371 * c;
    if (d < minDistance) {
      minDistance = d;
      nearest = loc;
    }
  }

  return { nearest, minDistance };
}

export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const ipParam = searchParams.get("ip");
    const query = searchParams.get("q");

    // ── 1. Reverse Geocoding (lat/lng) ──────────────────────────────────────
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);

      if (!isNaN(lat) && !isNaN(lng)) {
        const { nearest } = getNearestIndianLocation(lat, lng);
        
        // Try Nominatim with server-side User-Agent header
        try {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: {
                "User-Agent": "XeroxQ-Print-Platform/1.0",
                "Accept-Language": "en",
              },
            }
          );
          if (nomRes.ok) {
            const data = await nomRes.json();
            const addr = data.address || {};
            const parts = [
              addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district,
              addr.city || addr.county || nearest.name,
              addr.state || nearest.state,
            ].filter(Boolean);

            if (parts.length > 0) {
              return NextResponse.json({
                fullAddress: parts.join(", "),
                lat,
                lng,
                name: parts[0],
                district: addr.county || nearest.district,
                state: addr.state || nearest.state,
              });
            }
          }
        } catch (e) {
          // Fall through to local database match
        }

        // Return nearest local database match
        return NextResponse.json({
          fullAddress: `${nearest.name}, ${nearest.district}, ${nearest.state}`,
          lat,
          lng,
          name: nearest.name,
          district: nearest.district,
          state: nearest.state,
        });
      }
    }

    // ── 2. IP-based Geolocation (ip=true) ───────────────────────────────────
    if (ipParam === "true") {
      try {
        const ipRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const lat = Number(ipData.latitude);
            const lng = Number(ipData.longitude);
            const { nearest } = getNearestIndianLocation(lat, lng);
            return NextResponse.json({
              fullAddress: `${ipData.city || nearest.name}, ${nearest.district}, ${ipData.region || nearest.state}`,
              lat,
              lng,
              name: ipData.city || nearest.name,
              district: nearest.district,
              state: ipData.region || nearest.state,
            });
          }
        }
      } catch (e) {
        // Fallback
      }

      // Default fallback
      const defaultLoc = INDIAN_LOCATIONS[1]; // Vijayawada
      return NextResponse.json({
        fullAddress: `${defaultLoc.name}, ${defaultLoc.district}, ${defaultLoc.state}`,
        lat: defaultLoc.lat,
        lng: defaultLoc.lng,
        name: defaultLoc.name,
        district: defaultLoc.district,
        state: defaultLoc.state,
      });
    }

    // ── 3. Search Query Auto-suggest (q=...) ────────────────────────────────
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Filter locations based on query
    const matches = INDIAN_LOCATIONS.filter(location => {
      const nameMatch = location.name.toLowerCase().includes(normalizedQuery);
      const stateMatch = location.state.toLowerCase().includes(normalizedQuery);
      const districtMatch = location.district.toLowerCase().includes(normalizedQuery);
      
      return nameMatch || stateMatch || districtMatch;
    });

    // Sort by relevance (exact name match first, then state, then district)
    const sortedMatches = matches.sort((a, b) => {
      const aNameExact = a.name.toLowerCase() === normalizedQuery ? 0 : 1;
      const bNameExact = b.name.toLowerCase() === normalizedQuery ? 0 : 1;
      
      if (aNameExact !== bNameExact) {
        return aNameExact - bNameExact;
      }
      
      const aNameStart = a.name.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      const bNameStart = b.name.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      
      if (aNameStart !== bNameStart) {
        return aNameStart - bNameStart;
      }
      
      return a.name.localeCompare(b.name);
    });

    // Limit results to prevent overwhelming the UI
    const limitedMatches = sortedMatches.slice(0, 50);

    // Format suggestions with unique keys
    const suggestions = limitedMatches.map((location, index) => ({
      id: `${location.name}-${location.state}-${location.district}-${index}`,
      name: location.name,
      state: location.state,
      district: location.district,
      type: location.type,
      displayText: `${location.name}, ${location.district}, ${location.state}`,
      fullAddress: `${location.name}, ${location.district}, ${location.state}`,
      lat: (location as any).lat,
      lng: (location as any).lng,
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("[location-suggestions] Error:", error);
    return NextResponse.json({ error: "Failed to fetch location suggestions" }, { status: 500 });
  }
}
