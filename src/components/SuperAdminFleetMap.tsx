'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '@/lib/api-client';

const POLL_INTERVAL = 10000;

// Default center (Kathmandu, Nepal)
const defaultCenter: [number, number] = [27.7172, 85.3240];

// Color tokens
const C = {
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#F59E0B',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  bgSurface: '#FFFFFF',
  bgCanvas: '#F9FAFB',
  bgHover: '#F3F4F6',
  bgSelected: '#EEF2FF',
  selectedBorder: '#4F46E5',
  started: '#3B82F6',
  scheduled: '#9CA3AF',
  delayed: '#DC2626',
  completed: '#16A34A',
};

// ============= TYPES =============

type StatusFilter = 'all' | 'active' | 'scheduled' | 'completed';

interface BusLocation {
  id: string;
  name: string;
  status: string;
  channel: string;
  route: string;
  driver: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  lastUpdated?: string;
}

interface FleetData {
  buses: BusLocation[];
  summary: {
    total: number;
    onTrip: number;
    idle: number;
  };
}

// ============= HELPERS =============

function timeAgo(isoString: string): string {
  if (!isoString) return '—';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'started': return 'EN ROUTE';
    case 'delayed': return 'DELAYED';
    case 'scheduled': return 'SCHEDULED';
    case 'completed': return 'ARRIVED';
    case 'ON_TRIP': return 'ON TRIP';
    case 'ACTIVE': return 'ACTIVE';
    case 'IDLE': return 'IDLE';
    case 'OFFLINE': return 'OFFLINE';
    default: return status.toUpperCase();
  }
}

function normalizeStatus(status: string): string {
  if (status === 'ON_TRIP' || status === 'ACTIVE' || status === 'started') return 'started';
  if (status === 'delayed') return 'delayed';
  if (status === 'completed') return 'completed';
  if (status === 'scheduled') return 'scheduled';
  return 'idle';
}

function getStatusColor(status: string): string {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'started': return C.started;
    case 'delayed': return C.delayed;
    case 'scheduled': return C.scheduled;
    case 'completed': return C.completed;
    default: return C.textTertiary;
  }
}

function getMarkerBgColor(status: string): string {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'started': return '#DBEAFE';
    case 'delayed': return '#FEE2E2';
    case 'scheduled': return '#F3F4F6';
    case 'completed': return '#DCFCE7';
    default: return '#F3F4F6';
  }
}

// Custom bus icon as Leaflet DivIcon
function createBusIcon(status: string): L.DivIcon {
  const color = getStatusColor(status);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="3"/>
      <svg x="9" y="9" width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18 8H6V6h12v2z"/>
      </svg>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ============= POPUP CONTENT =============

function BusPopupContent({ bus }: { bus: BusLocation }) {
  const statusColor = getStatusColor(bus.status);
  const statusLabel = getStatusLabel(bus.status);
  const normalized = normalizeStatus(bus.status);

  return (
    <div style={{ minWidth: 260, fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13, color: C.textPrimary }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.textPrimary }}>{bus.name}</div>
        </div>
        <div style={{ background: statusColor, color: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {statusLabel}
        </div>
      </div>

      <div style={{ background: C.bgCanvas, padding: '8px 10px', borderRadius: 6, marginBottom: 8, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>{bus.channel}</span>
        </div>
        {bus.route && (
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
            <span style={{ fontWeight: 500 }}>Route:</span> {bus.route}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {bus.driver && (
          <div style={{ background: C.bgCanvas, padding: '6px 8px', borderRadius: 4, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.textTertiary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Driver</div>
            <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 500, marginTop: 2 }}>{bus.driver}</div>
          </div>
        )}
        {bus.lastUpdated && (
          <div style={{ background: C.bgCanvas, padding: '6px 8px', borderRadius: 4, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.textTertiary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Updated</div>
            <div style={{ fontSize: 12, color: normalized === 'started' ? C.success : C.textSecondary, fontWeight: 500, marginTop: 2 }}>
              {timeAgo(bus.lastUpdated)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============= STATUS FILTER TABS =============

function StatusFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  counts: { all: number; active: number; scheduled: number; completed: number };
}) {
  const filters: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: C.primary },
    { key: 'active', label: 'On Trip', color: C.started },
    { key: 'scheduled', label: 'Scheduled', color: C.textTertiary },
    { key: 'completed', label: 'Completed', color: C.completed },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: '4px',
      background: C.bgCanvas,
      borderRadius: 6,
      border: `1px solid ${C.border}`,
    }}>
      {filters.map(filter => {
        const isActive = activeFilter === filter.key;
        const count = counts[filter.key];

        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            style={{
              flex: 1,
              padding: '6px 12px',
              border: 'none',
              borderRadius: 4,
              background: isActive ? C.bgSurface : 'transparent',
              color: isActive ? filter.color : C.textSecondary,
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>{filter.label}</span>
            {count > 0 && (
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 10,
                background: isActive ? `${filter.color}20` : C.border,
                color: isActive ? filter.color : C.textTertiary,
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============= FLEET PANEL =============

function FleetPanel({
  buses,
  onClose,
  onLocate,
  selectedBusId,
  activeFilter,
  onFilterChange,
  hiddenBusIds,
  onToggleVisibility,
}: {
  buses: BusLocation[];
  onClose: () => void;
  onLocate: (bus: BusLocation) => void;
  selectedBusId: string | null;
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  hiddenBusIds: Set<string>;
  onToggleVisibility: (busId: string) => void;
}) {
  const filteredBuses = buses.filter(bus => {
    const normalized = normalizeStatus(bus.status);
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return normalized === 'started' || normalized === 'delayed';
    if (activeFilter === 'scheduled') return normalized === 'scheduled';
    if (activeFilter === 'completed') return normalized === 'completed';
    return true;
  });

  const counts = {
    all: buses.length,
    active: buses.filter(b => { const n = normalizeStatus(b.status); return n === 'started' || n === 'delayed'; }).length,
    scheduled: buses.filter(b => normalizeStatus(b.status) === 'scheduled').length,
    completed: buses.filter(b => normalizeStatus(b.status) === 'completed').length,
  };

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 1001,
      width: 400, background: C.bgSurface,
      borderLeft: `1px solid ${C.border}`,
      boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill={C.primary}>
              <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18 8H6V6h12v2z" />
            </svg>
            Fleet Overview
          </div>
          <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
            {buses.length} total · {counts.active} en route · All channels
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, border: `1px solid ${C.border}`, borderRadius: 4,
            background: C.bgSurface, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: C.textSecondary, padding: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.bgHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.bgSurface; }}
          aria-label="Close panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <StatusFilterTabs
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          counts={counts}
        />
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1fr 80px 36px',
        padding: '8px 20px', background: C.bgCanvas, borderBottom: `1px solid ${C.border}`,
        fontSize: 10, fontWeight: 600, color: C.textTertiary, textTransform: 'uppercase',
        letterSpacing: '0.8px', flexShrink: 0,
      }}>
        <span>Bus / Channel</span>
        <span>Route / Driver</span>
        <span>Status</span>
        <span></span>
      </div>

      {/* Rows - scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredBuses.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>
            No buses match the selected filter
          </div>
        )}

        {filteredBuses.map(bus => (
          <FleetRow
            key={bus.id}
            bus={bus}
            onLocate={onLocate}
            isSelected={selectedBusId === bus.id}
            isHidden={hiddenBusIds.has(bus.id)}
            onToggleVisibility={onToggleVisibility}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 20px', borderTop: `1px solid ${C.border}`, background: C.bgCanvas,
        fontSize: 11, color: C.textTertiary, display: 'flex', alignItems: 'center', gap: 6,
        flexShrink: 0,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        Auto-updating every {POLL_INTERVAL / 1000}s · Super Admin View
      </div>
    </div>
  );
}

// ============= FLEET ROW =============

function FleetRow({
  bus,
  onLocate,
  isSelected,
  isHidden,
  onToggleVisibility,
}: {
  bus: BusLocation;
  onLocate: (bus: BusLocation) => void;
  isSelected: boolean;
  isHidden: boolean;
  onToggleVisibility: (busId: string) => void;
}) {
  const normalized = normalizeStatus(bus.status);
  const hasLocation = bus.latitude !== undefined && bus.latitude !== 0 && bus.longitude !== undefined && bus.longitude !== 0;
  const statusLabel = getStatusLabel(bus.status);
  const statusColor = getStatusColor(bus.status);
  const markerBg = getMarkerBgColor(bus.status);

  return (
    <div
      onClick={() => { if (hasLocation) onLocate(bus); }}
      style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1fr 80px 36px',
        padding: '10px 20px',
        borderBottom: `1px solid ${C.border}`,
        background: isSelected ? C.bgSelected : C.bgSurface,
        borderLeft: isSelected ? `3px solid ${C.selectedBorder}` : '3px solid transparent',
        cursor: hasLocation ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = C.bgHover; }}
      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = isSelected ? C.bgSelected : C.bgSurface; }}
    >
      {/* Bus + Channel */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bus.name}
        </div>
        <div style={{ fontSize: 11, color: C.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {bus.channel || '—'}
        </div>
      </div>

      {/* Route / Driver */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bus.route || '—'}
        </div>
        <div style={{ fontSize: 11, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bus.driver || 'No driver'}
        </div>
      </div>

      {/* Status */}
      <div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: statusColor,
          padding: '2px 6px', borderRadius: 3,
          background: markerBg,
          letterSpacing: '0.3px',
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Visibility toggle */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          title={isHidden ? 'Show on map' : 'Hide from map'}
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(bus.id); }}
          style={{
            width: 28, height: 28, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isHidden ? C.textTertiary : C.primary,
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
        >
          {isHidden ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ============= MAP CONTROLLER =============

function MapController({ center, zoom, onMapReady }: { center: [number, number]; zoom: number; onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  const prevCenter = useRef<[number, number]>(center);
  const prevZoom = useRef(zoom);

  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (
      prevCenter.current[0] !== center[0] ||
      prevCenter.current[1] !== center[1] ||
      prevZoom.current !== zoom
    ) {
      map.flyTo(center, zoom, { duration: 0.5 });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

// ============= MAIN COMPONENT =============

export default function SuperAdminFleetMap() {
  const [buses, setBuses] = useState<BusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showFleetPanel, setShowFleetPanel] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<BusLocation | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [hiddenBusIds, setHiddenBusIds] = useState<Set<string>>(new Set());
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const handleMapReady = useCallback((map: L.Map) => { leafletMapRef.current = map; }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await apiClient.get('/super-admin/fleet/locations');
      const data: FleetData = res.data.data || res.data;
      const busList = data.buses || [];
      setBuses(busList);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch fleet locations:', err);
      if (buses.length === 0) setError('Failed to load fleet data');
    } finally {
      setIsLoading(false);
    }
  }, [buses.length]);

  useEffect(() => {
    fetchLocations();
    intervalRef.current = setInterval(fetchLocations, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLocations]);

  // Filter buses based on active filter
  const filteredBuses = buses.filter(bus => {
    const normalized = normalizeStatus(bus.status);
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return normalized === 'started' || normalized === 'delayed';
    if (activeFilter === 'scheduled') return normalized === 'scheduled';
    if (activeFilter === 'completed') return normalized === 'completed';
    return true;
  });

  const activeBuses = filteredBuses.filter(b => {
    const n = normalizeStatus(b.status);
    return (n === 'started' || n === 'delayed') && b.latitude !== undefined && b.latitude !== 0;
  });
  const scheduledBuses = filteredBuses.filter(b => normalizeStatus(b.status) === 'scheduled');
  const completedBuses = filteredBuses.filter(b => normalizeStatus(b.status) === 'completed');

  const toggleBusVisibility = useCallback((busId: string) => {
    setHiddenBusIds(prev => {
      const next = new Set(prev);
      if (next.has(busId)) next.delete(busId);
      else next.add(busId);
      return next;
    });
  }, []);

  const handleLocate = useCallback((bus: BusLocation) => {
    if (!bus.latitude || !bus.longitude) return;
    setSelectedBusId(bus.id);
    setSelectedMarker(bus);
    setMapCenter([bus.latitude, bus.longitude]);
    setMapZoom(16);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: C.bgCanvas, borderRadius: 12,
        flexDirection: 'column', gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, border: `3px solid ${C.border}`,
          borderTop: `3px solid ${C.primary}`, borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ color: C.textSecondary, fontSize: 13, fontWeight: 400 }}>Loading fleet data...</div>
      </div>
    );
  }

  const validBuses = filteredBuses.filter(b =>
    b.latitude !== undefined && b.latitude !== 0 &&
    b.longitude !== undefined && b.longitude !== 0 &&
    !hiddenBusIds.has(b.id)
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Map area - shrinks when panel open */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        right: showFleetPanel ? 400 : 0,
        transition: 'right 0.25s ease',
      }}>
        {/* Leaflet Map */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} zoom={mapZoom} onMapReady={handleMapReady} />

          {/* Bus Markers */}
          {validBuses.map(bus => (
            <Marker
              key={bus.id}
              position={[bus.latitude!, bus.longitude!]}
              icon={createBusIcon(bus.status)}
              eventHandlers={{ click: () => setSelectedMarker(bus) }}
            />
          ))}

          {/* Popup */}
          {selectedMarker && selectedMarker.latitude && selectedMarker.longitude && (
            <Popup
              position={[selectedMarker.latitude, selectedMarker.longitude]}
              eventHandlers={{
                remove: () => setSelectedMarker(null),
              }}
            >
              <BusPopupContent bus={selectedMarker} />
            </Popup>
          )}
        </MapContainer>

        {/* Custom zoom controls */}
        <div style={{
          position: 'absolute', bottom: 24, left: 11, zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <div style={{
            background: C.bgSurface, border: '2px solid rgba(0,0,0,0.25)',
            borderRadius: 4, overflow: 'hidden',
            boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
          }}>
            <button
              onClick={() => leafletMapRef.current?.zoomIn()}
              title="Zoom in"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, background: 'transparent', border: 'none',
                borderBottom: `1px solid rgba(0,0,0,0.15)`,
                cursor: 'pointer', fontSize: 22, fontWeight: 300,
                color: C.textPrimary, lineHeight: 1,
              }}
            >+</button>
            <button
              onClick={() => leafletMapRef.current?.zoomOut()}
              title="Zoom out"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, background: 'transparent', border: 'none',
                cursor: 'pointer', fontSize: 22, fontWeight: 300,
                color: C.textPrimary, lineHeight: 1,
              }}
            >−</button>
          </div>
          <span style={{ fontSize: 10, color: C.textTertiary, fontWeight: 500, letterSpacing: '0.3px' }}>Zoom</span>
        </div>

        {/* Live fleet label */}
        {!showFleetPanel && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 1000,
            background: C.bgSurface, padding: '8px 16px', borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Super Admin · Live Fleet</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary, display: 'inline-block', animation: 'bus-pulse 2s ease-in-out infinite' }} />
          </div>
        )}

        {/* Status bar - clickable to open panel */}
        {!showFleetPanel && (
          <div
            onClick={() => setShowFleetPanel(true)}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 1000,
              background: C.bgSurface,
              padding: '8px 16px',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: `1px solid ${C.border}`,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              fontSize: 13,
              fontFamily: "'Inter', -apple-system, sans-serif",
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.started }} />
              <span style={{ fontWeight: 600, color: C.textPrimary }}>{activeBuses.length}</span>
              <span style={{ color: C.textSecondary, fontSize: 12 }}>active</span>
            </div>
            <div style={{ width: 1, height: 16, background: C.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.completed }} />
              <span style={{ fontWeight: 600, color: C.textPrimary }}>{completedBuses.length}</span>
              <span style={{ color: C.textSecondary, fontSize: 12 }}>completed</span>
            </div>
            <div style={{ width: 1, height: 16, background: C.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.textTertiary }} />
              <span style={{ fontWeight: 600, color: C.textPrimary }}>{scheduledBuses.length}</span>
              <span style={{ color: C.textSecondary, fontSize: 12 }}>scheduled</span>
            </div>
            {lastUpdate && (
              <>
                <div style={{ width: 1, height: 16, background: C.border }} />
                <span style={{ color: C.textTertiary, fontSize: 11 }}>
                  Updated {timeAgo(lastUpdate.toISOString())}
                </span>
              </>
            )}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={C.primary} strokeWidth="2.5" strokeLinecap="round"
              style={{ marginLeft: 4 }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        )}

        {/* Empty state */}
        {buses.length === 0 && !error && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            <div style={{
              background: C.bgSurface, borderRadius: 8, padding: '32px 40px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: `1px solid ${C.border}`,
              minWidth: 340, textAlign: 'center',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 6, background: C.bgCanvas, border: `1px solid ${C.border}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill={C.primary}>
                  <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18 8H6V6h12v2z" />
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, color: C.textPrimary, marginBottom: 6 }}>No active fleet tracking</div>
              <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
                No buses are currently being tracked. Fleet data will appear here when buses are active.
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            <div style={{
              background: C.bgSurface, borderRadius: 8, padding: '28px 36px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: `1px solid ${C.border}`,
              minWidth: 300, textAlign: 'center',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.danger, borderRadius: '8px 8px 0 0' }} />
              <div style={{ width: 40, height: 40, borderRadius: 6, background: '#FEE2E2', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.textPrimary, marginBottom: 4 }}>{error}</div>
              <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>Auto-retrying every {POLL_INTERVAL / 1000} seconds.</div>
            </div>
          </div>
        )}
      </div>

      {/* Fleet Panel sidebar */}
      {showFleetPanel && (
        <FleetPanel
          buses={buses}
          onClose={() => setShowFleetPanel(false)}
          onLocate={handleLocate}
          selectedBusId={selectedBusId}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          hiddenBusIds={hiddenBusIds}
          onToggleVisibility={toggleBusVisibility}
        />
      )}

      {/* CSS animation keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bus-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
