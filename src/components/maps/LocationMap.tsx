"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create custom icon to avoid standard bundler asset loading issues
const customIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);

      // Add marker
      const marker = L.marker([lat, lng], {
        draggable: draggable,
        icon: customIcon
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

  // Invalidate size to ensure tiles load correctly when container dimensions become active
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [lat, lng]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: "100%", borderRadius: "5.57px", overflow: "hidden" }}
    />
  );
}
