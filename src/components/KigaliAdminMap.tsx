import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyType } from '../types';
import {
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS_BY_PROVINCE,
  RWANDA_LOCATIONS_DATA,
  RwandaProvince,
  RwandaLocationInfo
} from '../data/rwandaLocations';
import {
  MapPin,
  Layers,
  Building,
  DollarSign,
  Eye,
  ShieldAlert,
  Compass,
  Maximize2,
  Minimize2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Flame,
  ArrowUpRight,
  Sparkles,
  Globe2,
  Navigation
} from 'lucide-react';
import L from 'leaflet';

export const KIGALI_SECTORS_DATA = RWANDA_LOCATIONS_DATA;

// Center coordinates for Rwanda provinces
export const PROVINCE_VIEW_CENTERS: Record<RwandaProvince, { lat: number; lng: number; zoom: number }> = {
  'Kigali City': { lat: -1.9542, lng: 30.0886, zoom: 13 },
  'Northern Province': { lat: -1.5000, lng: 29.7000, zoom: 11 },
  'Western Province': { lat: -2.0000, lng: 29.3000, zoom: 10 },
  'Southern Province': { lat: -2.3500, lng: 29.7500, zoom: 10 },
  'Eastern Province': { lat: -1.9000, lng: 30.3500, zoom: 10 }
};

export const PROVINCE_COLORS: Record<RwandaProvince, { bg: string; border: string; badge: string }> = {
  'Kigali City': { bg: '#4f46e5', border: '#818cf8', badge: 'bg-tea-500/20 text-tea-300 border-tea-500/30' },
  'Northern Province': { bg: '#059669', border: '#34d399', badge: 'bg-tea-500/20 text-tea-300 border-tea-500/30' },
  'Western Province': { bg: '#0284c7', border: '#38bdf8', badge: 'bg-tea-500/20 text-tea-300 border-tea-500/30' },
  'Southern Province': { bg: '#d97706', border: '#fbbf24', badge: 'bg-saffron-500/20 text-saffron-300 border-saffron-500/30' },
  'Eastern Province': { bg: '#7c3aed', border: '#a78bfa', badge: 'bg-tea-500/20 text-tea-300 border-tea-500/30' }
};

export const RwandaAdminMap: React.FC = () => {
  const {
    properties,
    reports,
    openModal,
    togglePropertyAvailability,
    deleteProperty
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'REPORTED' | 'OCCUPIED'>('ALL');
  const [viewMode, setViewMode] = useState<'PINS' | 'HEATMAP' | 'REGIONS'>('PINS');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Reported property IDs
  const reportedPropertyIds = useMemo(() => {
    return new Set(reports.filter(r => r.status === 'PENDING').map(r => r.propertyId));
  }, [reports]);

  // Location / Sector Aggregations across all Rwanda
  const locationMetrics = useMemo(() => {
    const metrics: Record<
      string,
      {
        count: number;
        availableCount: number;
        reportedCount: number;
        avgRent: number;
        totalRent: number;
        district: string;
        province: string;
      }
    > = {};

    Object.keys(RWANDA_LOCATIONS_DATA).forEach(locKey => {
      const info = RWANDA_LOCATIONS_DATA[locKey];
      metrics[locKey] = {
        count: 0,
        availableCount: 0,
        reportedCount: 0,
        avgRent: 0,
        totalRent: 0,
        district: info.district,
        province: info.province
      };
    });

    properties.forEach(p => {
      const locKey = p.locationSector;
      if (!metrics[locKey]) {
        metrics[locKey] = {
          count: 0,
          availableCount: 0,
          reportedCount: 0,
          avgRent: 0,
          totalRent: 0,
          district: p.district || 'Rwanda',
          province: p.province || 'Kigali City'
        };
      }
      metrics[locKey].count += 1;
      metrics[locKey].totalRent += p.monthlyRent;
      if (p.isAvailable) metrics[locKey].availableCount += 1;
      if (reportedPropertyIds.has(p.id)) metrics[locKey].reportedCount += 1;
    });

    Object.keys(metrics).forEach(s => {
      metrics[s].avgRent = metrics[s].count > 0 ? Math.round(metrics[s].totalRent / metrics[s].count) : 0;
    });

    return metrics;
  }, [properties, reportedPropertyIds]);

  // Filtered Properties for Map
  const filteredMapProperties = useMemo(() => {
    return properties.filter(p => {
      if (selectedProvince !== 'ALL' && (p.province || 'Kigali City') !== selectedProvince) {
        return false;
      }
      if (selectedDistrict !== 'ALL' && (p.district || '') !== selectedDistrict) {
        return false;
      }
      if (selectedLocation !== 'ALL' && p.locationSector !== selectedLocation) {
        return false;
      }
      if (statusFilter === 'AVAILABLE' && !p.isAvailable) return false;
      if (statusFilter === 'OCCUPIED' && p.isAvailable) return false;
      if (statusFilter === 'REPORTED' && !reportedPropertyIds.has(p.id)) return false;
      return true;
    });
  }, [properties, selectedProvince, selectedDistrict, selectedLocation, statusFilter, reportedPropertyIds]);

  // Initialize Leaflet Map (Centered on Rwanda)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Whole Rwanda geographic center coordinates
      const map = L.map(mapContainerRef.current, {
        center: [-1.9403, 29.8739],
        zoom: 9,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // OpenStreetMap high-contrast clean tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Rwanda National Property Registry',
        maxZoom: 18
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Overlays when data or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (viewMode === 'HEATMAP') {
      // Render regional pricing & density bubbles across all Rwandan locations
      Object.entries(RWANDA_LOCATIONS_DATA).forEach(([locName, info]) => {
        if (selectedProvince !== 'ALL' && info.province !== selectedProvince) return;

        const stats = locationMetrics[locName];
        const count = stats?.count || 0;
        const avgRent = stats?.avgRent || info.avgPriceGuide;

        // Color based on province
        const provTheme = PROVINCE_COLORS[info.province] || { bg: '#3b82f6', border: '#ffffff' };
        const radius = Math.max(28, Math.min(54, 24 + count * 7));

        const bubbleHtml = `
          <div style="
            background: ${provTheme.bg}EB;
            color: white;
            border: 2px solid white;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            border-radius: 9999px;
            width: ${radius * 2}px;
            height: ${radius * 2}px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: sans-serif;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; max-width: ${radius * 1.7}px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${locName.split(' ')[0]}
            </div>
            <div style="font-size: 10px; font-weight: 700; opacity: 0.95;">${count} listings</div>
            <div style="font-size: 9px; opacity: 0.9; font-family: monospace;">RWF ${(avgRent / 1000).toFixed(0)}k</div>
          </div>
        `;

        const icon = L.divIcon({
          html: bubbleHtml,
          className: 'rwanda-heatmap-marker',
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius]
        });

        const marker = L.marker([info.lat, info.lng], { icon });
        marker.on('click', () => {
          setSelectedLocation(locName);
          setSelectedProvince(info.province);
          map.flyTo([info.lat, info.lng], 13, { duration: 1 });
        });

        layer.addLayer(marker);
      });
    } else {
      // Render Individual Property Pins across all Rwanda
      filteredMapProperties.forEach(prop => {
        const isReported = reportedPropertyIds.has(prop.id);
        const isAvail = prop.isAvailable;

        const propProv = (prop.province as RwandaProvince) || 'Kigali City';
        const provTheme = PROVINCE_COLORS[propProv] || { bg: '#2563eb' };

        let pinBg = provTheme.bg;
        let pinBorder = '#ffffff';

        if (isReported) {
          pinBg = '#e11d48'; // red reported
        } else if (!isAvail) {
          pinBg = '#64748b'; // slate occupied
        }

        const formattedRent = (prop.monthlyRent / 1000).toFixed(0) + 'k';

        const pinHtml = `
          <div style="
            background: ${pinBg};
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
            border: 2px solid ${pinBorder};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transform: translate(-50%, -100%);
            white-space: nowrap;
          ">
            <span>RWF ${formattedRent}</span>
            ${isReported ? '<span style="background:white; color:#e11d48; border-radius:4px; padding:0 3px; font-size:9px; font-weight:800;">!</span>' : ''}
          </div>
        `;

        const icon = L.divIcon({
          html: pinHtml,
          className: 'property-pin-marker',
          iconAnchor: [0, 0]
        });

        const lat = prop.latitude || -1.9542 + (Math.random() - 0.5) * 0.006;
        const lng = prop.longitude || 30.0886 + (Math.random() - 0.5) * 0.006;

        const marker = L.marker([lat, lng], { icon });

        marker.on('click', () => {
          setSelectedProperty(prop);
          map.panTo([lat, lng]);
        });

        layer.addLayer(marker);
      });

      // Add regional city & district location badges
      Object.entries(RWANDA_LOCATIONS_DATA).forEach(([locName, info]) => {
        if (selectedProvince !== 'ALL' && info.province !== selectedProvince) return;
        if (selectedLocation !== 'ALL' && selectedLocation !== locName) return;

        const labelHtml = `
          <div style="
            background: rgba(15, 23, 42, 0.88);
            color: #cbd5e1;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.15);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            pointer-events: none;
            white-space: nowrap;
          ">
            ${info.name} • ${info.district}
          </div>
        `;

        const icon = L.divIcon({
          html: labelHtml,
          className: 'rwanda-bg-label',
          iconAnchor: [30, 20]
        });

        const labelMarker = L.marker([info.lat, info.lng], { icon, interactive: false });
        layer.addLayer(labelMarker);
      });
    }
  }, [filteredMapProperties, viewMode, selectedProvince, selectedLocation, locationMetrics, reportedPropertyIds]);

  const resetToAllRwanda = () => {
    setSelectedProvince('ALL');
    setSelectedDistrict('ALL');
    setSelectedLocation('ALL');
    setStatusFilter('ALL');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-1.9403, 29.8739], 9, { duration: 1.2 });
    }
  };

  const handleSelectProvince = (prov: string) => {
    setSelectedProvince(prov);
    setSelectedDistrict('ALL');
    setSelectedLocation('ALL');

    if (prov === 'ALL') {
      resetToAllRwanda();
    } else {
      const center = PROVINCE_VIEW_CENTERS[prov as RwandaProvince];
      if (center && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([center.lat, center.lng], center.zoom, { duration: 1.2 });
      }
    }
  };

  const focusOnLocation = (locName: string) => {
    setSelectedLocation(locName);
    const info = RWANDA_LOCATIONS_DATA[locName];
    if (info) {
      setSelectedProvince(info.province);
      setSelectedDistrict(info.district);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([info.lat, info.lng], 13, { duration: 1 });
      }
    }
  };

  return (
    <div
      id="rwanda-admin-spatial-map"
      className={`bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full'
      }`}
    >
      {/* Header & National GIS Controls */}
      <div className="p-4 sm:p-5 bg-tea-800 text-white border-b border-ink-800 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-tea-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Rwanda National Spatial Map & GIS Registry
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-tea-500/20 text-tea-300 border border-tea-500/40">
                  5 Provinces • 30 Districts
                </span>
              </div>
              <p className="text-xs text-ink-400">
                Interactive real-time map of rental listings across Kigali, Northern, Western, Southern, and Eastern provinces
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-xl bg-tea-800 p-1 border border-ink-700 text-xs font-semibold">
              <button
                onClick={() => setViewMode('PINS')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'PINS' ? 'bg-tea-600 text-white shadow-xs' : 'text-ink-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Property Pins ({filteredMapProperties.length})</span>
              </button>
              <button
                onClick={() => setViewMode('HEATMAP')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'HEATMAP' ? 'bg-tea-600 text-white shadow-xs' : 'text-ink-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-saffron-400" />
                <span>Regional Density & Pricing</span>
              </button>
            </div>

            <button
              onClick={resetToAllRwanda}
              className="px-3 py-1.5 rounded-xl bg-tea-800 hover:bg-tea-700 text-ink-200 border border-ink-700 text-xs font-semibold transition-colors flex items-center gap-1"
              title="Reset Zoom to Entire Country of Rwanda"
            >
              <Compass className="w-3.5 h-3.5 text-tea-400" />
              <span>All Rwanda</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-tea-800 hover:bg-tea-700 text-ink-300 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Province Filter Tabs */}
        <div className="pt-2 border-t border-ink-800/80 flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-ink-400 mr-1">
            <Layers className="w-3.5 h-3.5 text-tea-400" />
            <span className="font-bold">Province:</span>
          </div>

          <button
            onClick={() => handleSelectProvince('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedProvince === 'ALL'
                ? 'bg-tea-600 text-white shadow-xs'
                : 'bg-tea-800 hover:bg-tea-700 text-ink-300'
            }`}
          >
            All Rwanda ({properties.length})
          </button>

          {RWANDA_PROVINCES.map(prov => {
            const count = properties.filter(p => (p.province || 'Kigali City') === prov).length;
            const isSelected = selectedProvince === prov;
            return (
              <button
                key={prov}
                onClick={() => handleSelectProvince(prov)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-100 text-ink-900 ring-2 ring-tea-500'
                    : 'bg-tea-800/90 hover:bg-tea-700 text-ink-300'
                }`}
              >
                <span>{prov}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-tea-600 text-white' : 'bg-tea-700 text-ink-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* City/Sector Sub-Pills for Selected Province */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] overflow-x-auto pb-0.5">
          <span className="text-ink-400 font-semibold mr-1 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-ink-500" />
            Key Hubs:
          </span>

          <button
            onClick={() => setSelectedLocation('ALL')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
              selectedLocation === 'ALL' ? 'bg-tea-500/30 text-tea-300 font-bold' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            All Areas
          </button>

          {Object.entries(RWANDA_LOCATIONS_DATA)
            .filter(([_, info]) => selectedProvince === 'ALL' || info.province === selectedProvince)
            .slice(0, 10)
            .map(([locName, info]) => {
              const count = locationMetrics[locName]?.count || 0;
              const isSel = selectedLocation === locName;
              return (
                <button
                  key={locName}
                  onClick={() => focusOnLocation(locName)}
                  className={`px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                    isSel
                      ? 'bg-tea-600 text-white font-bold'
                      : 'bg-tea-800/60 text-ink-300 hover:bg-tea-700'
                  }`}
                >
                  <span>{locName.split(' ')[0]}</span>
                  {count > 0 && <span className="text-[9px] opacity-75 font-mono">({count})</span>}
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Map Body & Slide-out Info Panel */}
      <div className="relative flex-1 min-h-[480px] lg:min-h-[560px] bg-stone-100 flex flex-col md:flex-row">
        
        {/* Leaflet Render Canvas */}
        <div
          ref={mapContainerRef}
          id="leaflet-rwanda-canvas"
          className="flex-1 w-full h-[480px] lg:h-[560px] z-10"
        />

        {/* Selected Property Popup Drawer */}
        {selectedProperty && (
          <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-stone-200 p-5 shadow-xl z-20 flex flex-col justify-between overflow-y-auto max-h-[480px] lg:max-h-[560px] text-left">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-tea-50 text-tea-700 border border-tea-200">
                  {selectedProperty.propertyType} • {selectedProperty.locationSector}
                </span>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-xs font-bold text-ink-400 hover:text-ink-600 px-2 py-1 rounded-lg hover:bg-stone-100"
                >
                  ✕ Close
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-video bg-stone-100">
                <img
                  src={selectedProperty.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80'}
                  alt={selectedProperty.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-tea-800/80 text-white text-[11px] font-bold backdrop-blur">
                  RWF {selectedProperty.monthlyRent.toLocaleString()} / mo
                </div>
                {reportedPropertyIds.has(selectedProperty.id) && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Reported Listing</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm text-ink-900 line-clamp-2">
                  {selectedProperty.title}
                </h3>
                <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-ink-400 shrink-0" />
                  <span className="truncate">{selectedProperty.address}</span>
                </p>
                <p className="text-[11px] text-tea-600 font-semibold mt-0.5">
                  {selectedProperty.province || 'Kigali City'} • {selectedProperty.district || 'Gasabo'}
                </p>
              </div>

              {/* Property quick specs */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-100 text-center text-xs">
                <div className="bg-stone-50 p-2 rounded-lg">
                  <span className="text-[10px] text-ink-400 block font-medium">Bedrooms</span>
                  <span className="font-bold text-ink-800">{selectedProperty.bedrooms} Beds</span>
                </div>
                <div className="bg-stone-50 p-2 rounded-lg">
                  <span className="text-[10px] text-ink-400 block font-medium">Bathrooms</span>
                  <span className="font-bold text-ink-800">{selectedProperty.bathrooms} Baths</span>
                </div>
                <div className="bg-stone-50 p-2 rounded-lg">
                  <span className="text-[10px] text-ink-400 block font-medium">Status</span>
                  <span className={`font-bold ${selectedProperty.isAvailable ? 'text-tea-600' : 'text-ink-500'}`}>
                    {selectedProperty.isAvailable ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>

              {/* Landlord Contact Info */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-ink-400">Landlord Details</span>
                <div className="font-bold text-ink-900">{selectedProperty.landlordName}</div>
                <div className="text-ink-500 font-mono text-[11px]">
                  {selectedProperty.landlordPhone || '+250 788 000 000'}
                </div>
              </div>
            </div>

            {/* Admin Direct Actions on Selected Property */}
            <div className="space-y-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => openModal('PROPERTY_DETAILS', { property: selectedProperty })}
                className="w-full py-2 px-3 rounded-xl bg-tea-600 hover:bg-tea-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full Property Details & Tenant View</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePropertyAvailability(selectedProperty.id)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-ink-700 text-xs font-semibold transition-colors"
                >
                  {selectedProperty.isAvailable ? 'Mark Occupied' : 'Mark Available'}
                </button>

                <button
                  onClick={() => {
                    deleteProperty(selectedProperty.id);
                    setSelectedProperty(null);
                  }}
                  className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-50 text-red-800 text-xs font-semibold transition-colors"
                  title="Remove listing from platform"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rwanda Province Breakdown & Market Pricing Matrix */}
      <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-stone-200/80 gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-800">
            <Layers className="w-4 h-4 text-tea-600" />
            <span>Rwanda Regional Rental Index & Market Pricing Matrix</span>
          </div>
          <span className="text-[11px] text-ink-500">
            Live metrics aggregated from 5 Provinces and Secondary Cities
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {RWANDA_PROVINCES.map(province => {
            const provProps = properties.filter(p => (p.province || 'Kigali City') === province);
            const count = provProps.length;
            const avgRent = count > 0
              ? Math.round(provProps.reduce((sum, p) => sum + p.monthlyRent, 0) / count)
              : 0;

            const isSel = selectedProvince === province;

            return (
              <button
                key={province}
                onClick={() => handleSelectProvince(province)}
                className={`p-3.5 rounded-2xl border text-left transition-all group ${
                  isSel
                    ? 'bg-tea-50/80 border-tea-300 ring-2 ring-tea-500/20 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-900 group-hover:text-tea-600 transition-colors">
                    {province}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-ink-600">
                    {RWANDA_DISTRICTS_BY_PROVINCE[province].length} Districts
                  </span>
                </div>
                <div className="text-base font-bold text-ink-900 mt-1.5">
                  {count} <span className="text-xs font-normal text-ink-500">active listings</span>
                </div>
                <div className="text-xs text-tea-600 font-semibold font-mono mt-0.5">
                  {avgRent > 0 ? `Avg ~${(avgRent / 1000).toFixed(0)}k RWF/mo` : 'Market Index Active'}
                </div>
                <div className="mt-2 text-[10px] text-ink-400 truncate">
                  {RWANDA_DISTRICTS_BY_PROVINCE[province].slice(0, 3).join(', ')}...
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const KigaliAdminMap = RwandaAdminMap;
