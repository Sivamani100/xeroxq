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

interface ShopLocation {
  id: string;
  name: string;
  slug: string;
  shop_location?: string;
  shop_lat?: number;
  shop_lng?: number;
  is_open?: boolean;
}

interface AllShopsMapProps {
  shops: ShopLocation[];
  centerLat?: number;
  centerLng?: number;
  height?: string;
  zoom?: number;
}

export default function AllShopsMap({
  shops,
  centerLat = 20.5937, // Default center of India
  centerLng = 78.9629,
  height = "500px",
  zoom = 5
}: AllShopsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([centerLat, centerLng], zoom);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
    } else {
      // Update center if it changed
      mapInstanceRef.current.setView([centerLat, centerLng], zoom);
    }
  }, [centerLat, centerLng, zoom]);

  // Invalidate size to trigger tile loading when container size becomes available
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [shops, centerLat, centerLng]);

  // Update markers when shops array updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    // Add new markers
    shops.forEach(shop => {
      if (!shop.shop_lat || !shop.shop_lng) return;

      const markerColor = shop.is_open ? '#10B981' : '#EF4444'; // Green or Red
      const markerText = shop.is_open ? 'OPEN' : 'CLOSED';
      
      const marker = L.marker([Number(shop.shop_lat), Number(shop.shop_lng)], { icon: customIcon }).addTo(mapInstanceRef.current!);

      // Premium styling popup content
      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 6px; width: 220px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #000;">${shop.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748B; line-height: 1.4;">${shop.shop_location || 'Address not listed'}</p>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; display: inline-block; background-color: ${markerColor};"></span>
            <span style="font-size: 10px; font-weight: 700; color: ${markerColor};">${markerText}</span>
          </div>
          <a href="/${shop.slug}" style="display: block; width: 100%; text-align: center; padding: 8px 0; background-color: #000; color: #fff; font-size: 11px; font-weight: 700; border-radius: 6px; text-decoration: none; transition: background-color 0.2s;">
            Visit Shop Queue
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [shops]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #E2E8F0" }}
      className="shadow-xl"
    />
  );
}
