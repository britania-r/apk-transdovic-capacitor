// File: apps/web/src/pages/routes-management/route-detail/TollMarker.tsx
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import type { TollStation } from './useRouteDetail';

interface Props {
  toll: TollStation;
  isOnOutbound: boolean; // está en ruta de ida
  isOnReturn: boolean;   // está en ruta de vuelta
}

export const TollMarker = ({ toll, isOnOutbound, isOnReturn }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [markerRef, marker] = useAdvancedMarkerRef();

  const charges = toll.billing_frequency === 2
    ? (isOnOutbound && isOnReturn ? 2 : 1)
    : (isOnOutbound ? 1 : 0);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: toll.latitude, lng: toll.longitude }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{
          background: '#f59e0b',
          color: '#000',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700,
          border: '2px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          cursor: 'pointer'
        }}>
          <span style={{ fontSize: '13px' }}>🚧</span>
          {toll.name}
        </div>
      </AdvancedMarker>

      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div style={{ padding: '4px 0', minWidth: '160px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
              {toll.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
              Frecuencia: {toll.billing_frequency === 2 ? 'Ida y vuelta' : 'Solo ida'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>
              Cobros en esta ruta: {charges}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};