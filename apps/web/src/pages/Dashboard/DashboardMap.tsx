// File: apps/web/src/pages/dashboard/DashboardMap.tsx
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { LiveTrackingTrail } from '../routes-management/route-detail/LiveTrackingTrail';
import type { ActiveRouteToday } from './hooks/useActiveRoutesToday';
import type { TrackingPoint } from './hooks/useLiveTrackingMulti';
import styles from './Dashboard.module.css';

// Planta Transdovic
const PLANT = { lat: -8.135258486791704, lng: -79.01138128594722 };

interface Props {
  routes: ActiveRouteToday[];
  latestByRoute: Map<string, TrackingPoint>;
  selectedRouteId: string | null;
  selectedTrail: TrackingPoint[];
  onSelectRoute: (routeId: string) => void;
}

// Colores para conductores (se ciclan)
const DRIVER_COLORS = ['#1a56db', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DashboardMap = ({ routes, latestByRoute, selectedRouteId, selectedTrail, onSelectRoute }: Props) => {
  const map = useMap();

  // Centrar en conductor seleccionado
  useEffect(() => {
    if (!map || !selectedRouteId) return;
    const point = latestByRoute.get(selectedRouteId);
    if (point) {
      map.panTo({ lat: point.latitude, lng: point.longitude });
      map.setZoom(12);
    }
  }, [map, selectedRouteId, latestByRoute]);

  return (
    <div className={styles.mapContainer}>
      {/* Indicador en vivo */}
      <div className={styles.liveIndicator}>
        <span className={styles.liveDot}></span>
        EN VIVO
      </div>

      <Map
        defaultCenter={PLANT}
        defaultZoom={9}
        mapId="dashboard-live-map"
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
      >
        {/* Marcador de planta */}
        <AdvancedMarker position={PLANT} title="Planta Transdovic">
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#1e293b',
            border: '3px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }} />
        </AdvancedMarker>

        {/* Marcadores de conductores */}
        {routes.map((route, index) => {
          const point = latestByRoute.get(route.id);
          if (!point) return null;

          const color = DRIVER_COLORS[index % DRIVER_COLORS.length];
          const isSelected = route.id === selectedRouteId;
          const driverName = route.driver
            ? `${route.driver.first_name} ${route.driver.paternal_last_name}`
            : 'Sin conductor';

          return (
            <AdvancedMarker
              key={route.id}
              position={{ lat: point.latitude, lng: point.longitude }}
              title={`${driverName} - ${route.vehicle?.plate || ''}`}
              onClick={() => onSelectRoute(route.id)}
            >
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                {/* Pulse */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '-10px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: `${color}33`,
                    animation: 'driverPulse 2s ease-out infinite',
                  }} />
                )}

                {/* Dot */}
                <div style={{
                  width: isSelected ? '20px' : '14px',
                  height: isSelected ? '20px' : '14px',
                  borderRadius: '50%',
                  background: color,
                  border: `${isSelected ? '4px' : '3px'} solid #fff`,
                  boxShadow: `0 2px 6px rgba(0,0,0,${isSelected ? '0.4' : '0.25'})`,
                  transition: 'all 0.2s ease',
                }} />

                {/* Nombre (solo seleccionado) */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '-28px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255,255,255,0.95)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}>
                    {route.vehicle?.plate}
                  </div>
                )}
              </div>
            </AdvancedMarker>
          );
        })}

        {/* Trail de la ruta seleccionada */}
        {selectedRouteId && selectedTrail.length > 1 && (
          <LiveTrackingTrail points={selectedTrail} />
        )}
      </Map>

      <style>{`
        @keyframes driverPulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};