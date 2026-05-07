"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMapProps {
  lat: number;
  lng: number;
  height?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  draggable?: boolean;
}

export function LocationMap({ 
  lat, 
  lng, 
  height = "150px", 
  onLocationChange,
  draggable = false 
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    // Initialize map only if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 15);

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add marker
      const marker = L.marker([lat, lng], {
        draggable: draggable
      }).addTo(mapInstanceRef.current);

      markerRef.current = marker;

      // Handle marker drag if draggable
      if (draggable && onLocationChange) {
        marker.on("dragend", (e) => {
          const marker = e.target as L.Marker;
          const position = marker.getLatLng();
          onLocationChange(position.lat, position.lng);
        });
      }
    } else {
      // Update existing map view
      mapInstanceRef.current.setView([lat, lng], 15);
      
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [lat, lng, onLocationChange, draggable]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: "100%", borderRadius: "5.57px", overflow: "hidden" }}
    />
  );
}
