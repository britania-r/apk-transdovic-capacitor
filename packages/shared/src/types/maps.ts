export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  name: string;
  waypoints: Coordinates[];
  createdBy: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  currentLocation: Coordinates;
  assignedRoute?: string;
  status: 'active' | 'inactive' | 'on_route';
  lastUpdate: string;
}

export interface RouteProgress {
  driverId: string;
  routeId: string;
  currentPosition: Coordinates;
  completedWaypoints: number;
  totalWaypoints: number;
  estimatedTimeRemaining: number;
}