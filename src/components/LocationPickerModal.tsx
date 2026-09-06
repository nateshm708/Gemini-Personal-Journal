import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { PinnedLocation } from '../types';
import { MapPin, X, Navigation, Search, Check, AlertTriangle, ExternalLink, Globe } from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: PinnedLocation;
  onSaveLocation: (location: PinnedLocation | undefined) => void;
}

const PRESET_LOCATIONS: { name: string; address: string; lat: number; lng: number }[] = [
  { name: "Philosopher's Walk", address: "Kyoto, Japan", lat: 35.0272, lng: 135.7982 },
  { name: "Central Park", address: "New York, NY, USA", lat: 40.785091, lng: -73.968285 },
  { name: "Jardin du Luxembourg", address: "Paris, France", lat: 48.8462, lng: 2.3371 },
  { name: "Golden Gate Overlook", address: "San Francisco, CA, USA", lat: 37.8080, lng: -122.4760 },
  { name: "Shinjuku Gyoen", address: "Tokyo, Japan", lat: 35.6852, lng: 139.7100 },
  { name: "Mount Rainier National Park", address: "Washington, USA", lat: 46.8523, lng: -121.7603 },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [lat, setLat] = useState<number>(currentLocation?.lat ?? 40.785091);
  const [lng, setLng] = useState<number>(currentLocation?.lng ?? -73.968285);
  const [locationName, setLocationName] = useState<string>(currentLocation?.name ?? '');
  const [address, setAddress] = useState<string>(currentLocation?.address ?? '');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (currentLocation) {
        setLat(currentLocation.lat);
        setLng(currentLocation.lng);
        setLocationName(currentLocation.name);
        setAddress(currentLocation.address || '');
      } else {
        // Default to first preset or previous
        setLat(40.785091);
        setLng(-73.968285);
        setLocationName('Central Park');
        setAddress('New York, NY, USA');
      }
      setLocationError(null);
    }
  }, [isOpen, currentLocation]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        setLocationName(prev => (prev && prev !== 'Central Park' ? prev : 'Current Location'));
        setAddress(`${userLat.toFixed(4)}°, ${userLng.toFixed(4)}°`);
        setIsLocating(false);
      },
      error => {
        setIsLocating(false);
        let msg = 'Could not determine location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access permission was denied.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setLat(preset.lat);
    setLng(preset.lng);
    setLocationName(preset.name);
    setAddress(preset.address);
    setLocationError(null);
  };

  const handleMapClick = useCallback((e: any) => {
    const latLng = e.detail?.latLng;
    if (latLng) {
      const clickedLat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
      const clickedLng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
      setLat(clickedLat);
      setLng(clickedLng);
      setLocationName(prev => prev.trim() ? prev : 'Pinned Location');
      setAddress(`${clickedLat.toFixed(4)}°, ${clickedLng.toFixed(4)}°`);
    }
  }, []);

  const handleConfirm = () => {
    if (!locationName.trim()) {
      setLocationError('Please provide a name or landmark for this location.');
      return;
    }

    const pinned: PinnedLocation = {
      name: locationName.trim(),
      address: address.trim() || undefined,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    };
    onSaveLocation(pinned);
    onClose();
  };

  const handleRemovePin = () => {
    onSaveLocation(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="location-picker-modal"
        className="bg-[#fcfbf9] w-full max-w-2xl rounded-md shadow-2xl border border-[#e5e1da] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e1da] bg-[#f7f5f0]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-[#1a1a1a] text-white flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#1a1a1a]">Pin Location</h3>
              <p className="font-sans text-[11px] text-[#6b665c]">
                Anchor this journal reflection to a meaningful place
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#a8a297] hover:text-[#1a1a1a] p-1.5 rounded-sm hover:bg-[#eae6df] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Geolocation & Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              id="btn-use-current-location"
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0ece1] hover:bg-[#e5e0d3] text-[#1a1a1a] font-sans text-xs rounded-sm transition-colors cursor-pointer border border-[#dcd6c9] disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-700' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
            </button>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-sans">
              <span className="text-[#a8a297] text-[10px] uppercase tracking-wider shrink-0 mr-1">Presets:</span>
              {PRESET_LOCATIONS.slice(0, 4).map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2 py-1 rounded-sm border whitespace-nowrap transition-colors cursor-pointer ${
                    locationName === preset.name
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'bg-white text-[#4a453e] border-[#e5e1da] hover:bg-[#f7f5f0]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Google Map or Graceful State */}
          <div className="relative w-full h-64 sm:h-72 rounded-sm border border-[#e5e1da] overflow-hidden bg-[#eae6df] shadow-inner">
            {apiKey ? (
              <APIProvider apiKey={apiKey}>
                <Map
                  id="journal-location-map"
                  mapId="DEMO_MAP_ID"
                  defaultCenter={{ lat, lng }}
                  center={{ lat, lng }}
                  defaultZoom={13}
                  zoom={13}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  onClick={handleMapClick}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  className="w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                >
                  <AdvancedMarker position={{ lat, lng }}>
                    <Pin background="#1a1a1a" glyphColor="#ffffff" borderColor="#ffffff" />
                  </AdvancedMarker>
                </Map>
              </APIProvider>
            ) : (
              /* Graceful Configuration Banner when VITE_GOOGLE_MAPS_API_KEY is not set */
              <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-b from-[#f9f8f5] to-[#ece7de] text-[#1a1a1a]">
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xs bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-[#1a1a1a]">
                        Interactive Map Preview (Demo Key Recommended)
                      </h4>
                      <p className="font-sans text-xs text-[#6b665c] mt-0.5 leading-relaxed">
                        To render the live Google Map with satellite imagery and dynamic drag-and-drop pins, declare{' '}
                        <code className="px-1 py-0.5 bg-[#e5e0d4] rounded-xs font-mono text-[11px] text-[#1a1a1a]">
                          VITE_GOOGLE_MAPS_API_KEY
                        </code>{' '}
                        in your environment.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-sm border border-[#dcd6c9] text-xs font-sans space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1a1a1a]">Get a Free Maps Demo Key (Zero Billing):</span>
                      <a
                        href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-800 hover:text-amber-950 underline inline-flex items-center gap-1 font-medium"
                      >
                        <span>Open Demo Key Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-[#78716c]">
                      No credit card or cloud billing is required for prototyping with demo keys.
                    </p>
                  </div>
                </div>

                {/* Visual Coordinates Compass Card */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-sm border border-[#e5e1da] shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-700" />
                    <div>
                      <p className="text-[11px] font-sans font-medium text-[#1a1a1a]">
                        Coordinates Locked
                      </p>
                      <p className="text-[10px] font-mono text-[#6b665c]">
                        {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs">
                    Ready to Pin
                  </span>
                </div>
              </div>
            )}
          </div>

          {apiKey && (
            <p className="font-sans text-[11px] text-[#a8a297] text-center italic">
              Tip: Click anywhere on the map to place or reposition your pin.
            </p>
          )}

          {locationError && (
            <div className="p-2.5 rounded-sm bg-red-50 border border-red-200 text-red-700 font-sans text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Location Details Input Form */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block font-sans text-xs font-semibold text-[#1a1a1a] mb-1">
                Location Name / Landmark <span className="text-red-500">*</span>
              </label>
              <input
                id="input-location-name"
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="e.g. Kyoto Garden, San Francisco Bay, Home Sanctuary"
                className="w-full px-3 py-2 font-sans text-xs bg-white border border-[#e5e1da] rounded-sm focus:outline-none focus:border-[#1a1a1a] text-[#1a1a1a] placeholder-[#a8a297]"
              />
            </div>

            <div>
              <label className="block font-sans text-xs font-semibold text-[#1a1a1a] mb-1">
                Locality or Address
              </label>
              <input
                id="input-location-address"
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Kyoto, Japan or 123 Reflection Way"
                className="w-full px-3 py-2 font-sans text-xs bg-white border border-[#e5e1da] rounded-sm focus:outline-none focus:border-[#1a1a1a] text-[#1a1a1a] placeholder-[#a8a297]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[11px] text-[#6b665c] mb-1">
                  Latitude
                </label>
                <input
                  id="input-location-lat"
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={e => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 font-mono text-xs bg-white border border-[#e5e1da] rounded-sm text-[#1a1a1a]"
                />
              </div>
              <div>
                <label className="block font-sans text-[11px] text-[#6b665c] mb-1">
                  Longitude
                </label>
                <input
                  id="input-location-lng"
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={e => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 font-mono text-xs bg-white border border-[#e5e1da] rounded-sm text-[#1a1a1a]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#e5e1da] bg-[#f7f5f0]">
          {currentLocation ? (
            <button
              type="button"
              onClick={handleRemovePin}
              className="font-sans text-xs text-red-600 hover:text-red-800 transition-colors cursor-pointer"
            >
              Remove Pin
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-sans text-xs text-[#6b665c] hover:text-[#1a1a1a] hover:bg-[#eae6df] rounded-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-location-pin"
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 font-sans text-xs uppercase tracking-widest bg-[#1a1a1a] hover:bg-black text-white rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Pin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
