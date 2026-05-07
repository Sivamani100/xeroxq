import { NextRequest, NextResponse } from "next/server";
import { INDIAN_LOCATIONS } from "./comprehensive-locations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

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
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("[location-suggestions] Error:", error);
    return NextResponse.json({ error: "Failed to fetch location suggestions" }, { status: 500 });
  }
}
