import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyType } from '../types';
import {
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS_BY_PROVINCE,
  RWANDA_LOCATIONS_DATA,
  ALL_AMENITY_OPTIONS
} from '../data/seedData';
import { ListingQualityService } from '../services/listingQualityService';
import {
  Building,
  X,
  Sparkles,
  Plus,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Globe2
} from 'lucide-react';

const PROPERTY_TYPES: PropertyType[] = ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'TOWNHOUSE', 'DUPLEX'];

export const AddEditPropertyModal: React.FC = () => {
  const { currentUser, addProperty, updateProperty, closeModal, modalData } = useApp();

  const isEditing = Boolean(modalData?.property);
  const existingProp: Partial<Property> = modalData?.property || {};

  const [title, setTitle] = useState(existingProp.title || '');
  const [description, setDescription] = useState(existingProp.description || '');
  const [province, setProvince] = useState(existingProp.province || 'Kigali City');
  const [district, setDistrict] = useState(existingProp.district || 'Gasabo');
  const [locationSector, setLocationSector] = useState(existingProp.locationSector || 'Kimihurura');
  const [address, setAddress] = useState(existingProp.address || '');
  const [monthlyRent, setMonthlyRent] = useState(existingProp.monthlyRent || 350000);
  const [securityDeposit, setSecurityDeposit] = useState(existingProp.securityDeposit || 350000);
  const [propertyType, setPropertyType] = useState<PropertyType>(existingProp.propertyType || 'APARTMENT');
  const [bedrooms, setBedrooms] = useState(existingProp.bedrooms || 2);
  const [bathrooms, setBathrooms] = useState(existingProp.bathrooms || 2);
  const [sizeSqm, setSizeSqm] = useState(existingProp.sizeSqm || 80);
  const [isFurnished, setIsFurnished] = useState(existingProp.isFurnished ?? true);
  const [hasParking, setHasParking] = useState(existingProp.hasParking ?? true);
  const [amenities, setAmenities] = useState<string[]>(existingProp.amenities || ['High-speed WiFi', 'Water Tank & Pump', '24/7 Security Guard']);
  const [images, setImages] = useState<string[]>(
    existingProp.images || [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  // Handle province change
  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const districts = RWANDA_DISTRICTS_BY_PROVINCE[newProv as keyof typeof RWANDA_DISTRICTS_BY_PROVINCE] || [];
    if (districts.length > 0) {
      setDistrict(districts[0]);
    }
  };

  // Live quality score calculation as landlord enters data
  const currentListingDraft: Partial<Property> = {
    title,
    description,
    province,
    district,
    locationSector,
    address,
    monthlyRent,
    securityDeposit,
    bedrooms,
    bathrooms,
    sizeSqm,
    amenities,
    images
  };
  const quality = ListingQualityService.evaluate(currentListingDraft);

  const handleToggleAmenity = (item: string) => {
    setAmenities(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !address.trim() || monthlyRent <= 0) {
      alert('Please enter a valid title, address, and rental amount.');
      return;
    }

    const landlordId = currentUser?.id || 'usr-landlord-01';
    const landlordName = currentUser?.fullName || 'Jean-Paul Habimana';
    const landlordPhone = currentUser?.phoneNumber || '+250 788 123 456';
    const landlordEmail = currentUser?.email || 'landlord@smartrental.rw';

    // Auto compute approximate coordinates from location data
    const locationInfo = RWANDA_LOCATIONS_DATA[locationSector];
    const lat = locationInfo ? locationInfo.lat : -1.9542;
    const lng = locationInfo ? locationInfo.lng : 30.0886;

    if (isEditing && existingProp.id) {
      updateProperty(existingProp.id, {
        title,
        description,
        province,
        district,
        locationSector,
        address,
        monthlyRent,
        securityDeposit,
        propertyType,
        bedrooms,
        bathrooms,
        sizeSqm,
        isFurnished,
        hasParking,
        amenities,
        latitude: lat,
        longitude: lng,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80']
      });
    } else {
      addProperty({
        landlordId,
        landlordName,
        landlordPhone,
        landlordEmail,
        title,
        description,
        province,
        district,
        locationSector,
        address,
        monthlyRent,
        securityDeposit,
        propertyType,
        bedrooms,
        bathrooms,
        sizeSqm,
        isFurnished,
        hasParking,
        amenities,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80'],
        isAvailable: true,
        featured: false,
        latitude: lat,
        longitude: lng
      });
    }

    closeModal();
  };

  const availableDistricts = RWANDA_DISTRICTS_BY_PROVINCE[province as keyof typeof RWANDA_DISTRICTS_BY_PROVINCE] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? 'Edit Property Listing' : 'Publish New Rental Listing (Rwanda)'}
              </h2>
              <p className="text-xs text-slate-400">Landlord Property Creator with Live Quality Analyzer & Nationwide GIS Tagging</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Listing Quality Score Banner */}
        <div className="bg-slate-800 text-white p-4 border-b border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center">
                <span className="text-base font-black text-emerald-400">{quality.score}%</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">Quality</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Listing Quality Score</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {quality.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {quality.recommendations.length > 0
                    ? `Tip: ${quality.recommendations[0]}`
                    : 'Listing is fully optimized for maximum tenant inquiries!'}
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right text-xs text-slate-400">
              <span>Completed: {quality.completedItems.length} items</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[62vh] overflow-y-auto text-slate-800">
          
          {/* Title */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Property Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Modern 2-Bedroom Lake View Villa in Rubavu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>

          {/* Rwanda Location Hierarchy: Province, District, Sector */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Globe2 className="w-4 h-4 text-blue-600" />
              <span>Geographic Location in Rwanda</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Province *
                </label>
                <select
                  value={province}
                  onChange={e => handleProvinceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold bg-white"
                >
                  {RWANDA_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  District *
                </label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold bg-white"
                >
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Sector / Neighborhood *
                </label>
                <input
                  type="text"
                  required
                  value={locationSector}
                  onChange={e => setLocationSector(e.target.value)}
                  placeholder="e.g. Kimihurura or Muhoza"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Street Address / Landmark *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Near Lake Kivu Promenade or KG 28 Ave"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Monthly Rent (RWF) *
              </label>
              <input
                type="number"
                required
                min="50000"
                step="10000"
                value={monthlyRent}
                onChange={e => setMonthlyRent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Security Deposit (RWF)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={securityDeposit}
                onChange={e => setSecurityDeposit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Type
              </label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Beds
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={bedrooms}
                onChange={e => setBedrooms(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Baths
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={bathrooms}
                onChange={e => setBathrooms(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Floor Space (m²)
              </label>
              <input
                type="number"
                min="20"
                max="1000"
                value={sizeSqm}
                onChange={e => setSizeSqm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Furnished & Parking toggles */}
          <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={isFurnished}
                onChange={e => setIsFurnished(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Furnished Property</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={hasParking}
                onChange={e => setHasParking(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Dedicated Parking Space</span>
            </label>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Description & Highlights
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {description.length} characters (150+ recommended)
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the rooms, views, water pressure, backup electricity, neighborhood amenities, and transit proximity..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Available Amenities ({amenities.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_AMENITY_OPTIONS.map(a => {
                const active = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleToggleAmenity(a)}
                    className={`p-2 rounded-xl text-xs font-medium text-left transition-all border ${
                      active
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Gallery URLs */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Property Photos ({images.length} added)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                placeholder="Paste direct image URL (https://...)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group bg-slate-100 border border-slate-200">
                  <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Publish Property Listing'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

