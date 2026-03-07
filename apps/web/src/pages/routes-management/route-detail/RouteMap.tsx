// File: apps/web/src/pages/routes-management/route-detail/RouteMap.tsx
import { Map } from '@vis.gl/react-google-maps';
import { PLANT_LOCATION } from './useRouteDetail';
import { PlantMarker } from './PlantMarker';
import { WaypointMarker } from './WaypointMarker';
import { TollMarker } from './TollMarker';
import { RoutePolyline } from './RoutePolyline';
import type { WaypointDetail, TollStation } from './useRouteDetail';
import styles from './RouteDetailPage.module.css';

interface TollResult {
  toll: TollStation;
  isOnOutbound: boolean;
  isOnReturn: boolean;
}

interface Props {
  waypoints: WaypointDetail[];
  tolls: TollStation[];
  tollResults: TollResult[];
  onTollsDetected: (results: TollResult[]) => void;
  onDistanceCalculated: (outboundKm: number, returnKm: number) => void;
}

export const RouteMap = ({ waypoints, tolls, tollResults, onTollsDetected, onDistanceCalculated }: Props) => {
  return (
    <div className={styles.mapContainer}>
      <div className={styles.mapLegend}>
        <span><span className={styles.legendDot} style={{ background: '#16a34a' }}></span> Ida</span>
        <span><span className={styles.legendDot} style={{ background: '#dc2626' }}></span> Vuelta</span>
        <span><span className={styles.legendDot} style={{ background: '#f59e0b' }}></span> Peaje</span>
        <span><span className={styles.legendDot} style={{ background: '#1e293b' }}></span> Planta</span>
      </div>

      <Map
        defaultCenter={{ lat: PLANT_LOCATION.lat, lng: PLANT_LOCATION.lng }}
        defaultZoom={9}
        mapId="route-detail-map"
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
      >
        <PlantMarker />

        {waypoints.map(wp => (
          <WaypointMarker key={wp.id} waypoint={wp} />
        ))}

        {tollResults.map(tr => (
          <TollMarker
            key={tr.toll.id}
            toll={tr.toll}
            isOnOutbound={tr.isOnOutbound}
            isOnReturn={tr.isOnReturn}
          />
        ))}

        <RoutePolyline
          waypoints={waypoints}
          tolls={tolls}
          onTollsDetected={onTollsDetected}
          onDistanceCalculated={onDistanceCalculated}
        />
      </Map>
    </div>
  );
};