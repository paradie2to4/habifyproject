import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Property } from '../types';

interface ListingsMapProps {
  properties: Property[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (property: Property) => void;
  /** Single-listing mode: show one pin, no price pills, fixed zoom. */
  single?: boolean;
  /** Driving route to draw (single mode): path as [lat, lng] points plus the starting point. */
  route?: { path: [number, number][]; origin: [number, number] } | null;
  className?: string;
}

const KIGALI: L.LatLngTuple = [-1.9441, 30.0619];

function shortPrice(rent: number): string {
  if (rent >= 1_000_000) return `${(rent / 1_000_000).toFixed(rent % 1_000_000 === 0 ? 0 : 1)}M`;
  return `${Math.round(rent / 1000)}k`;
}

function hasCoords(p: Property) {
  return Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && (p.latitude !== 0 || p.longitude !== 0);
}

/** Leaflet map with price-pill markers that stay in sync with the hovered card. */
export const ListingsMap: React.FC<ListingsMapProps> = ({
  properties,
  activeId,
  onHover,
  onSelect,
  single = false,
  route = null,
  className = ''
}) => {
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const handlersRef = useRef({ onHover, onSelect });
  handlersRef.current = { onHover, onSelect };

  // Create the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: KIGALI,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: !single,
      attributionControl: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Leaflet measures its container on init; re-measure once layout settles
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, [single]);

  // Rebuild markers when the result set changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    const located = properties.filter(hasCoords);
    located.forEach(p => {
      const icon = single
        ? L.divIcon({
            className: 'price-marker-wrap',
            html: '<span class="price-marker is-active">●</span>',
            iconSize: [0, 0]
          })
        : L.divIcon({
            className: 'price-marker-wrap',
            html: `<span class="price-marker">${shortPrice(p.monthlyRent)}</span>`,
            iconSize: [0, 0]
          });
      const marker = L.marker([p.latitude, p.longitude], {
        icon,
        keyboard: true,
        title: `${p.title} — ${p.monthlyRent.toLocaleString()} RWF`,
        riseOnHover: true
      });
      if (!single) {
        marker.on('mouseover', () => handlersRef.current.onHover?.(p.id));
        marker.on('mouseout', () => handlersRef.current.onHover?.(null));
        marker.on('click', () => handlersRef.current.onSelect?.(p));
      }
      marker.addTo(layer);
      markersRef.current.set(p.id, marker);
    });

    if (located.length === 1 || single) {
      const p = located[0];
      if (p) map.setView([p.latitude, p.longitude], single ? 14 : 13);
    } else if (located.length > 1) {
      map.fitBounds(L.latLngBounds(located.map(p => [p.latitude, p.longitude] as L.LatLngTuple)), {
        padding: [40, 40],
        maxZoom: 14
      });
    }
  }, [properties, single]);

  // Driving route: a casing + line (reads on light and dark tiles) and a "You" marker
  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!route || route.path.length < 2) return;
    L.polyline(route.path, { color: '#ffffff', weight: 9, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
    L.polyline(route.path, { color: '#1F5C45', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
    L.marker(route.origin, {
      icon: L.divIcon({ className: 'price-marker-wrap', html: '<span class="you-marker"><span></span></span>', iconSize: [0, 0] }),
      title: 'Your location',
      keyboard: false
    }).addTo(layer);
    map.fitBounds(L.latLngBounds(route.path), { padding: [36, 36] });
  }, [route]);

  // Highlight the active marker without rebuilding
  useEffect(() => {
    if (single) return;
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector('.price-marker');
      if (!el) return;
      const active = id === activeId;
      el.classList.toggle('is-active', active);
      marker.setZIndexOffset(active ? 1000 : 0);
    });
  }, [activeId, properties, single]);

  return (
    <div
      ref={containerRef}
      // `isolate` keeps Leaflet's internal z-indexes (400+) from covering sticky headers
      className={`isolate relative z-0 w-full h-full bg-stone-100 ${className}`}
      role="region"
      aria-label={single ? 'Property location map' : 'Map of listings'}
    />
  );
};
