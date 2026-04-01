// File: apps/web/src/pages/routes-management/route-detail/LiveTrackingMarker.tsx
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { TrackingPoint } from './hooks/useLiveTracking';

interface Props {
  point: TrackingPoint;
}

export const LiveTrackingMarker = ({ point }: Props) => {
  return (
    <AdvancedMarker
      position={{ lat: point.latitude, lng: point.longitude }}
      title="Ubicación del conductor"
    >
      <div style={{
        position: 'relative',
        width: '24px',
        height: '24px',
      }}>
        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(26, 86, 219, 0.2)',
          animation: 'pulse-ring 2s ease-out infinite',
        }} />

        {/* Accuracy ring */}
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(26, 86, 219, 0.1)',
          border: '1px solid rgba(26, 86, 219, 0.3)',
        }} />

        {/* Center dot */}
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#1a56db',
          border: '3px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }} />
      </div>

      {/* Inline keyframes via style tag */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </AdvancedMarker>
  );
};