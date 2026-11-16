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
  Plus,
  Trash2,
  CheckCircle2,
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

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const districts = RWANDA_DISTRICTS_BY_PROVINCE[newProv as keyof typeof RWANDA_DISTRICTS_BY_PROVINCE] || [];
    if (districts.length > 0) {
      setDistrict(districts[0]);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto">
      <div
        className="animate-pop bg-stone-50 rounded-3xl max-w-3xl w-full border border-stone-200 overflow-hidden my-6 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="palette-light topo p-5 sm:p-6 bg-tea-700 text-white flex items-center justify-between border-b border-tea-600">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-tea-700/25 border border-tea-500/40 flex items-center justify-center text-saffron-300">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">
                {isEditing ? 'Edit property listing' : 'Publish a new listing'}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Live quality score · Rwanda locations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-tea-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Listing Quality Score Banner */}
        <div className="palette-light bg-ink-950 text-white p-4 border-b border-tea-600">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-tea-700 border border-ink-700 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-saffron-300">{quality.score}%</span>
                <span className="text-[9px] uppercase font-semibold text-stone-500">Quality</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">Listing quality</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-tea-700/20 text-saffron-300 border border-tea-500/40">
                    {quality.tier.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {quality.recommendations.length > 0
                    ? `Tip: ${quality.recommendations[0]}`
                    : 'Listing looks strong — ready to attract inquiries.'}
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right text-xs text-stone-500">
              <span>Completed: {quality.completedItems.length} items</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[62vh] overflow-y-auto text-ink-900">
          <div>
            <label className="text-label block mb-1.5">Property title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Modern 2-Bedroom Lake View Villa in Rubavu"
              className="input-base w-full"
            />
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-900">
              <Globe2 className="w-4 h-4 text-tea-600" />
              <span>Location in Rwanda</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-label block mb-1">Province *</label>
                <select
                  value={province}
                  onChange={e => handleProvinceChange(e.target.value)}
                  className="input-base w-full text-xs font-semibold"
                >
                  {RWANDA_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label block mb-1">District *</label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="input-base w-full text-xs font-semibold"
                >
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label block mb-1">Sector / neighborhood *</label>
                <input
                  type="text"
                  required
                  value={locationSector}
                  onChange={e => setLocationSector(e.target.value)}
                  placeholder="e.g. Kimihurura"
                  className="input-base w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-label block mb-1">Street address / landmark *</label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Near Lake Kivu Promenade or KG 28 Ave"
                className="input-base w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-1.5">Monthly rent (RWF) *</label>
              <input
                type="number"
                required
                min={50000}
                step={10000}
                value={monthlyRent}
                onChange={e => setMonthlyRent(Number(e.target.value))}
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="text-label block mb-1.5">Security deposit (RWF)</label>
              <input
                type="number"
                min={0}
                step={10000}
                value={securityDeposit}
                onChange={e => setSecurityDeposit(Number(e.target.value))}
                className="input-base w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-label block mb-1">Type</label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value as PropertyType)}
                className="input-base w-full text-xs font-semibold"
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-label block mb-1">Beds</label>
              <input
                type="number"
                min={1}
                max={10}
                value={bedrooms}
                onChange={e => setBedrooms(Number(e.target.value))}
                className="input-base w-full text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-label block mb-1">Baths</label>
              <input
                type="number"
                min={1}
                max={10}
                value={bathrooms}
                onChange={e => setBathrooms(Number(e.target.value))}
                className="input-base w-full text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-label block mb-1">Size (m²)</label>
              <input
                type="number"
                min={20}
                max={1000}
                value={sizeSqm}
                onChange={e => setSizeSqm(Number(e.target.value))}
                className="input-base w-full text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 p-3.5 rounded-xl bg-white border border-stone-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink-900">
              <input
                type="checkbox"
                checked={isFurnished}
                onChange={e => setIsFurnished(e.target.checked)}
                className="w-4 h-4 rounded text-tea-600 focus:ring-tea-500 border-stone-300"
              />
              <span>Furnished</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink-900">
              <input
                type="checkbox"
                checked={hasParking}
                onChange={e => setHasParking(e.target.checked)}
                className="w-4 h-4 rounded text-tea-600 focus:ring-tea-500 border-stone-300"
              />
              <span>Dedicated parking</span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-label">Description & highlights</label>
              <span className="text-[11px] text-stone-500 font-mono">
                {description.length} chars (150+ recommended)
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the rooms, views, water pressure, backup electricity, neighborhood amenities, and transit proximity..."
              className="input-base w-full"
            />
          </div>

          <div>
            <label className="text-label block mb-1.5">
              Amenities ({amenities.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_AMENITY_OPTIONS.map(a => {
                const active = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleToggleAmenity(a)}
                    className={`p-2 rounded-lg text-xs font-medium text-left transition-all border ${
                      active
                        ? 'bg-saffron-50 border-tea-400 text-saffron-900 font-semibold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-label block mb-1.5">
              Photos ({images.length} added)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL (https://...)"
                className="input-base flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="btn-primary px-3.5 py-2 text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group bg-stone-100 border border-stone-200">
                  <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-tea-700 text-white opacity-90 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-accent flex items-center gap-1.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save changes' : 'Publish listing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
