// File: apps/web/src/pages/routes-management/route-detail/EditRouteMapPreview.tsx
/// <reference types="google.maps" />
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { PLANT_LOCATION } from './useRouteDetail';
import type { EditableWaypoint } from './EditRouteWaypointItem';
import styles from './EditRouteModal.module.css';

interface Props {
  waypoints: EditableWaypoint[];
}

const MapRouteRenderer = ({ waypoints }: Props) => {
  const map = useMap();
  const outboundRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const returnRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map || !google?.maps?.DirectionsService) return;

    // Limpiar rutas previas
    outboundRef.current?.setMap(null);
    returnRef.current?.setMap(null);
    outboundRef.current = null;
    returnRef.current = null;

    const validWps = waypoints.filter(wp => wp.latitude && wp.longitude);
    if (validWps.length === 0) return;

    const service = new google.maps.DirectionsService();
    const plant = { lat: PLANT_LOCATION.lat, lng: PLANT_LOCATION.lng };
    const lastWp = validWps[validWps.length - 1];
    const lastPoint = { lat: lastWp.latitude, lng: lastWp.longitude };

    const intermediateWps: google.maps.DirectionsWaypoint[] = validWps.slice(0, -1).map(wp => ({
      location: { lat: wp.latitude, lng: wp.longitude },
      stopover: true
    }));

    // Ida
    service.route(
      {
        origin: plant,
        destination: lastPoint,
        waypoints: intermediateWps,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status !== google.maps.DirectionsStatus.OK || !result) return;
        outboundRef.current = new google.maps.DirectionsRenderer({
          map,
          directions: result,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#16a34a', strokeWeight: 4, strokeOpacity: 0.8 }
        });
      }
    );

    // Vuelta
    service.route(
      {
        origin: lastPoint,
        destination: plant,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status !== google.maps.DirectionsStatus.OK || !result) return;
        returnRef.current = new google.maps.DirectionsRenderer({
          map,
          directions: result,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#dc2626', strokeWeight: 4, strokeOpacity: 0.8 }
        });
      }
    );

    return () => {
      outboundRef.current?.setMap(null);
      returnRef.current?.setMap(null);
    };
  }, [map, waypoints]);

  return null;
};

export const EditRouteMapPreview = ({ waypoints }: Props) => {
  return (
    <div className={styles.mapPreview}>
      <Map
        defaultCenter={{ lat: PLANT_LOCATION.lat, lng: PLANT_LOCATION.lng }}
        defaultZoom={9}
        mapId="edit-route-preview-map"
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        disableDefaultUI={true}
        zoomControl={true}
      >
        {/* Planta */}
        <AdvancedMarker position={{ lat: PLANT_LOCATION.lat, lng: PLANT_LOCATION.lng }}>
          <div style={{
            background: '#1e293b', color: '#fff', padding: '4px 8px',
            borderRadius: '6px', fontSize: '11px', fontWeight: 700,
            border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '3px'
          }}>
            🏭 Planta
          </div>
        </AdvancedMarker>

        {/* Waypoints */}
        {waypoints.filter(wp => wp.latitude && wp.longitude).map((wp, idx) => (
          <AdvancedMarker
            key={wp.id}
            position={{ lat: wp.latitude, lng: wp.longitude }}
          >
            <div style={{
              background: '#16a34a', color: '#fff', width: '24px', height: '24px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {idx + 1}
            </div>
          </AdvancedMarker>
        ))}

        <MapRouteRenderer waypoints={waypoints} />
      </Map>
    </div>
  );
};