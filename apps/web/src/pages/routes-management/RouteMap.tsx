// File: apps/web/src/pages/routes-management/RouteMap.tsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import type { Farm, GasStation, TollAnalysis } from './CreateRoutePage';

// --- Componente Interno para la Ruta ---
const Directions = ({
  waypoints,
  color,
  onMetricsUpdate,
  onDirectionsResult,
}: {
  waypoints: Farm[];
  color: string;
  onMetricsUpdate: (metrics: { distance: number; duration: number }) => void;
  onDirectionsResult: (result: google.maps.DirectionsResult | null) => void;
}) => {
  const map = useMap();
  const [directionsService] = useState(() => new google.maps.DirectionsService());
  const [directionsRenderer] = useState(() => new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    polylineOptions: { strokeColor: color, strokeWeight: 5, strokeOpacity: 0.8 },
  }));

  useEffect(() => {
    if (map) {
      directionsRenderer.setMap(map);
    }
    return () => {
      directionsRenderer.setMap(null);
    };
  }, [map, directionsRenderer]);

  useEffect(() => {
    if (waypoints.length < 2) {
      directionsRenderer.setDirections({ routes: [] });
      onMetricsUpdate({ distance: 0, duration: 0 });
      onDirectionsResult(null);
      return;
    }

    const origin = { lat: waypoints[0].latitude, lng: waypoints[0].longitude };
    const destination = { lat: waypoints[waypoints.length - 1].latitude, lng: waypoints[waypoints.length - 1].longitude };
    const intermediateWaypoints = waypoints.slice(1, -1).map(wp => ({
      location: { lat: wp.latitude, lng: wp.longitude },
      stopover: true,
    }));

    directionsService.route({
      origin,
      destination,
      waypoints: intermediateWaypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        
        const totalDistance = result.routes[0].legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
        const totalDuration = result.routes[0].legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);

        onMetricsUpdate({
          distance: totalDistance,
          duration: totalDuration,
        });
        
        onDirectionsResult(result);
      } else {
        onDirectionsResult(null);
      }
    });
  }, [waypoints, directionsService, directionsRenderer, onMetricsUpdate, onDirectionsResult]);

  return null;
};

// --- Componente para los Pines Personalizados ---
const CustomPin = ({ text, color }: { text: string | JSX.Element; color: string }) => (
  <div style={{
    background: color,
    color: 'white',
    padding: '5px 10px',
    borderRadius: '4px',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
  }}>
    {text}
  </div>
);

// --- Componente para Peajes con Hover ---
const TollMarker = ({ toll }: { toll: TollAnalysis }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <AdvancedMarker 
      position={{ lat: toll.gasStation.latitude, lng: toll.gasStation.longitude }}
    >
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ position: 'relative' }}
      >
        <div style={{
          background: '#f97316',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '50%',
          fontWeight: 'bold',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          fontSize: '16px',
        }}>
          🚧
        </div>
        
        {showTooltip && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{toll.gasStation.name}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Cobros: {toll.timesToCharge}x
              {toll.passesOnOutbound && toll.passesOnReturn ? ' (Ida y Vuelta)' : 
               toll.passesOnOutbound ? ' (Solo Ida)' : ' (Solo Vuelta)'}
            </div>
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
};

interface RouteMapProps {
  baseLocation: Farm;
  waypoints: Farm[];
  gasStations: GasStation[];
  onRouteCalculated: (metrics: { distance: string; duration: string }) => void;
  onTollAnalysisUpdate: (analysis: TollAnalysis[]) => void;
  onMarkerClick: (farm: Farm) => void;
}

export const RouteMap = ({ 
  baseLocation, 
  waypoints, 
  gasStations,
  onRouteCalculated, 
  onTollAnalysisUpdate,
  onMarkerClick 
}: RouteMapProps) => {
  const [outboundMetrics, setOutboundMetrics] = useState({ distance: 0, duration: 0 });
  const [returnMetrics, setReturnMetrics] = useState({ distance: 0, duration: 0 });
  const [outboundDirections, setOutboundDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [returnDirections, setReturnDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  const previousMetricsRef = useRef({ distance: '', duration: '' });
  const previousTollsRef = useRef<string>('');

  // Detectar peajes en las rutas
  useEffect(() => {
    if (!outboundDirections || waypoints.length === 0) {
      onTollAnalysisUpdate([]);
      previousTollsRef.current = '';
      return;
    }

    const detectTollsOnRoute = () => {
      const tollsDetected: TollAnalysis[] = [];
      
      gasStations.forEach(station => {
        const stationLatLng = new google.maps.LatLng(station.latitude, station.longitude);
        
        // Verificar en ruta de ida
        const isOnOutbound = outboundDirections.routes[0].overview_path.some(point => 
          google.maps.geometry.spherical.computeDistanceBetween(point, stationLatLng) < 100
        );
        
        // Verificar en ruta de vuelta
        let isOnReturn = false;
        if (returnDirections) {
          isOnReturn = returnDirections.routes[0].overview_path.some(point => 
            google.maps.geometry.spherical.computeDistanceBetween(point, stationLatLng) < 100
          );
        }
        
        // Si pasa por el peaje en al menos una dirección
        if (isOnOutbound || isOnReturn) {
          let timesToCharge = 0;
          
          if (station.billing_frequency === 1) {
            // Cobra solo 1 vez, sin importar si pasa ida y vuelta
            timesToCharge = 1;
          } else if (station.billing_frequency === 2) {
            // Cobra 2 veces (ida y vuelta), pero solo si pasa por ambas
            if (isOnOutbound && isOnReturn) {
              timesToCharge = 2;
            } else {
              timesToCharge = 1; // Solo pasa por una dirección
            }
          }
          
          tollsDetected.push({
            gasStation: station,
            passesOnOutbound: isOnOutbound,
            passesOnReturn: isOnReturn,
            timesToCharge,
          });
        }
      });
      
      // Solo actualizar si hay cambios
      const newTollsSignature = JSON.stringify(tollsDetected.map(t => ({ 
        id: t.gasStation.id, 
        charges: t.timesToCharge 
      })));
      
      if (newTollsSignature !== previousTollsRef.current) {
        previousTollsRef.current = newTollsSignature;
        onTollAnalysisUpdate(tollsDetected);
      }
    };

    detectTollsOnRoute();
  }, [outboundDirections, returnDirections, gasStations, waypoints.length, onTollAnalysisUpdate]);

  // Actualizar métricas de distancia y duración
  useEffect(() => {
    const totalDistance = outboundMetrics.distance + returnMetrics.distance;
    const totalDuration = outboundMetrics.duration + returnMetrics.duration;
    
    const newMetrics = {
      distance: `${(totalDistance / 1000).toFixed(1)} km`,
      duration: `${Math.round(totalDuration / 60)} min`,
    };
    
    if (
      previousMetricsRef.current.distance !== newMetrics.distance ||
      previousMetricsRef.current.duration !== newMetrics.duration
    ) {
      previousMetricsRef.current = newMetrics;
      onRouteCalculated(newMetrics);
    }
  }, [outboundMetrics, returnMetrics, onRouteCalculated]);
  
  const flagIcon = useMemo(() => <i className='bx bxs-flag-checkered' />, []);
  
  const outboundRoute = useMemo(() => [baseLocation, ...waypoints], [baseLocation, waypoints]);
  const returnRoute = useMemo(() => 
    waypoints.length > 0 ? [...waypoints.slice(-1), baseLocation] : [],
    [waypoints, baseLocation]
  );

  // Obtener los peajes detectados para mostrar
  const [detectedTolls, setDetectedTolls] = useState<TollAnalysis[]>([]);
  
  useEffect(() => {
    // Este efecto se ejecuta cuando cambian las direcciones
    if (outboundDirections && waypoints.length > 0) {
      const tollsDetected: TollAnalysis[] = [];
      
      gasStations.forEach(station => {
        const stationLatLng = new google.maps.LatLng(station.latitude, station.longitude);
        
        const isOnOutbound = outboundDirections.routes[0].overview_path.some(point => 
          google.maps.geometry.spherical.computeDistanceBetween(point, stationLatLng) < 100
        );
        
        let isOnReturn = false;
        if (returnDirections) {
          isOnReturn = returnDirections.routes[0].overview_path.some(point => 
            google.maps.geometry.spherical.computeDistanceBetween(point, stationLatLng) < 100
          );
        }
        
        if (isOnOutbound || isOnReturn) {
          let timesToCharge = 0;
          
          if (station.billing_frequency === 1) {
            timesToCharge = 1;
          } else if (station.billing_frequency === 2) {
            if (isOnOutbound && isOnReturn) {
              timesToCharge = 2;
            } else {
              timesToCharge = 1;
            }
          }
          
          tollsDetected.push({
            gasStation: station,
            passesOnOutbound: isOnOutbound,
            passesOnReturn: isOnReturn,
            timesToCharge,
          });
        }
      });
      
      setDetectedTolls(tollsDetected);
    } else {
      setDetectedTolls([]);
    }
  }, [outboundDirections, returnDirections, gasStations, waypoints.length]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        defaultCenter={{ lat: -8.11189, lng: -79.02878 }}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId={'transdovic-routes-map'}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker position={{ lat: baseLocation.latitude, lng: baseLocation.longitude }}>
          <CustomPin text={flagIcon} color="#22c55e" />
        </AdvancedMarker>

        {waypoints.map((wp, index) => (
          <AdvancedMarker 
            key={wp.id} 
            position={{ lat: wp.latitude, lng: wp.longitude }} 
            onClick={() => onMarkerClick(wp)}
          >
            <CustomPin text={String(index + 1)} color="#3b82f6" />
          </AdvancedMarker>
        ))}
        
        {/* Mostrar peajes detectados */}
        {detectedTolls.map((toll) => (
          <TollMarker key={toll.gasStation.id} toll={toll} />
        ))}
        
        <Directions
          key={`outbound-${waypoints.map(wp => wp.id).join('-')}`}
          waypoints={outboundRoute}
          color="#ef4444"
          onMetricsUpdate={setOutboundMetrics}
          onDirectionsResult={setOutboundDirections}
        />
        
        {waypoints.length > 0 && (
          <Directions
            key={`return-${waypoints.map(wp => wp.id).join('-')}`}
            waypoints={returnRoute}
            color="#3b82f6"
            onMetricsUpdate={setReturnMetrics}
            onDirectionsResult={setReturnDirections}
          />
        )}
      </Map>
    </div>
  );
};