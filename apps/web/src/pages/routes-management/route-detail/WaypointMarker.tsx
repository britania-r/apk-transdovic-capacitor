// File: apps/web/src/pages/routes-management/route-detail/WaypointMarker.tsx
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import type { WaypointDetail } from './useRouteDetail';

interface Props {
  waypoint: WaypointDetail;
}

export const WaypointMarker = ({ waypoint }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [markerRef, marker] = useAdvancedMarkerRef();

  if (!waypoint.farm?.latitude || !waypoint.farm?.longitude) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: waypoint.farm.latitude, lng: waypoint.farm.longitude }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{
          background: '#16a34a',
          color: '#fff',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 700,
          border: '2px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          cursor: 'pointer'
        }}>
          {waypoint.stop_order}
        </div>
      </AdvancedMarker>

      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div style={{ padding: '4px 0', minWidth: '180px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
              {waypoint.farm.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
              RUC: {waypoint.farm.ruc}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
              Zona: {waypoint.zone} | SAP: {waypoint.sap_route_id}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', marginTop: '4px' }}>
              {waypoint.planned_pickup_amount?.toLocaleString()} litros
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};