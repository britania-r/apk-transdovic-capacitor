// File: RoutePolyline.tsx
/// <reference types="google.maps" />
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { PLANT_LOCATION } from './useRouteDetail';
import type { WaypointDetail, TollStation } from './useRouteDetail';

interface Props {
  waypoints: WaypointDetail[];
  tolls: TollStation[];
  onTollsDetected: (result: { toll: TollStation; isOnOutbound: boolean; isOnReturn: boolean }[]) => void;
  onDistanceCalculated: (outboundKm: number, returnKm: number) => void;
}

const PROXIMITY_THRESHOLD = 2000;

function isPointNearPath(
  point: google.maps.LatLngLiteral,
  path: google.maps.LatLng[],
  threshold: number
): boolean {
  const p = new google.maps.LatLng(point.lat, point.lng);
  for (const pathPoint of path) {
    if (google.maps.geometry.spherical.computeDistanceBetween(p, pathPoint) < threshold) {
      return true;
    }
  }
  return false;
}

export const RoutePolyline = ({ waypoints, tolls, onTollsDetected, onDistanceCalculated }: Props) => {
  const map = useMap();
  const outboundRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const returnRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const hasRendered = useRef(false);

  useEffect(() => {
    if (!map || hasRendered.current) return;

    const validWps = waypoints.filter(wp => wp.farm?.latitude && wp.farm?.longitude);
    if (validWps.length === 0) return;

    // Esperar a que google.maps.DirectionsService esté disponible
    if (!google?.maps?.DirectionsService) {
      console.warn('⚠️ Google Maps DirectionsService no disponible aún');
      return;
    }

    hasRendered.current = true;

    const service = new google.maps.DirectionsService();
    const plant = { lat: PLANT_LOCATION.lat, lng: PLANT_LOCATION.lng };
    const lastWp = validWps[validWps.length - 1];
    const lastPoint = { lat: lastWp.farm!.latitude, lng: lastWp.farm!.longitude };

    const intermediateWps: google.maps.DirectionsWaypoint[] = validWps.slice(0, -1).map(wp => ({
      location: { lat: wp.farm!.latitude, lng: wp.farm!.longitude },
      stopover: true
    }));

    // Limpiar previos
    outboundRef.current?.setMap(null);
    returnRef.current?.setMap(null);

    // IDA: Planta → Waypoints → Último
    service.route(
      {
        origin: plant,
        destination: lastPoint,
        waypoints: intermediateWps,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      },
      (outResult: google.maps.DirectionsResult | null, outStatus: google.maps.DirectionsStatus) => {
        if (outStatus !== google.maps.DirectionsStatus.OK || !outResult) {
          console.error('❌ Error ruta ida:', outStatus);
          return;
        }

        const outRenderer = new google.maps.DirectionsRenderer({
          map,
          directions: outResult,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#16a34a', strokeWeight: 5, strokeOpacity: 0.8 }
        });
        outboundRef.current = outRenderer;

        const outKm = outResult.routes[0].legs.reduce(
          (sum: number, leg: google.maps.DirectionsLeg) => sum + (leg.distance?.value || 0), 0
        ) / 1000;

        const outPath = outResult.routes[0].overview_path;

        // VUELTA: Último → Planta
        service.route(
          {
            origin: lastPoint,
            destination: plant,
            travelMode: google.maps.TravelMode.DRIVING
          },
          (retResult: google.maps.DirectionsResult | null, retStatus: google.maps.DirectionsStatus) => {
            if (retStatus !== google.maps.DirectionsStatus.OK || !retResult) {
              console.error('❌ Error ruta vuelta:', retStatus);
              return;
            }

            const retRenderer = new google.maps.DirectionsRenderer({
              map,
              directions: retResult,
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#dc2626', strokeWeight: 5, strokeOpacity: 0.8 }
            });
            returnRef.current = retRenderer;

            const retKm = retResult.routes[0].legs.reduce(
              (sum: number, leg: google.maps.DirectionsLeg) => sum + (leg.distance?.value || 0), 0
            ) / 1000;

            onDistanceCalculated(outKm, retKm);

            const retPath = retResult.routes[0].overview_path;

            // Detectar peajes
            const detected = tolls
              .map(toll => ({
                toll,
                isOnOutbound: isPointNearPath({ lat: toll.latitude, lng: toll.longitude }, outPath, PROXIMITY_THRESHOLD),
                isOnReturn: isPointNearPath({ lat: toll.latitude, lng: toll.longitude }, retPath, PROXIMITY_THRESHOLD)
              }))
              .filter(t => t.isOnOutbound || t.isOnReturn);

            onTollsDetected(detected);
            console.log(`✅ Rutas trazadas: Ida ${outKm.toFixed(1)}km | Vuelta ${retKm.toFixed(1)}km | Peajes: ${detected.length}`);
          }
        );
      }
    );

    return () => {
      outboundRef.current?.setMap(null);
      returnRef.current?.setMap(null);
    };
  }, [map, waypoints, tolls]);

  return null;
};