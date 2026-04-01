// File: apps/web/src/pages/routes-management/route-detail/LiveTrackingTrail.tsx
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import type { TrackingPoint } from './hooks/useLiveTracking';

interface Props {
  points: TrackingPoint[];
}

export const LiveTrackingTrail = ({ points }: Props) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib || points.length < 2) return;

    // Remover polyline anterior
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const path = points.map(p => ({
      lat: p.latitude,
      lng: p.longitude,
    }));

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#1a56db',
      strokeOpacity: 0.7,
      strokeWeight: 4,
      map,
    });

    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, points]);

  return null;
};