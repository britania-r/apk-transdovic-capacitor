// File: apps/web/src/pages/routes-management/route-detail/PlantMarker.tsx
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { PLANT_LOCATION } from './useRouteDetail';

export const PlantMarker = () => {
  return (
    <AdvancedMarker position={{ lat: PLANT_LOCATION.lat, lng: PLANT_LOCATION.lng }}>
      <div style={{
        background: '#1e293b',
        color: '#fff',
        padding: '6px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 700,
        border: '2px solid #fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{ fontSize: '14px' }}>🏭</span>
        Planta
      </div>
    </AdvancedMarker>
  );
};