// File: apps/web/src/pages/my-routes/active-route/types.ts

// ══════════════════════════════
// Entidades base (reflejan tablas de BD)
// ══════════════════════════════

export interface Profile {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string | null;
  role: string;
  dni: string | null;
  drivers_license: string | null;
  date_of_birth: string | null;
}

export interface Vehicle {
  id: string;
  plate: string;
  capacity_kg: number | null;
  tuse: string | null;
}

export interface Farm {
  id: string;
  name: string;
  ruc: string;
  latitude: number;
  longitude: number;
}

// ══════════════════════════════
// Route & Waypoints
// ══════════════════════════════

export interface RouteWaypoint {
  id: string;
  route_id: string;
  farm_id: string;
  stop_order: number;
  planned_pickup_amount: number;
  zone: string;
  sap_route_id: string | null;
  farm: Farm | null;
}

export interface Route {
  id: string;
  route_date: string;
  driver_id: string;
  vehicle_id: string;
  precintos_count: string | null;
  programed_start_time: string | null;
  programed_arrival_time: string | null;
  status: string;
  sap_route_id: string | null;
  started_at: string | null;
  completed_at: string | null;
}

// ══════════════════════════════
// Active Route (con relaciones expandidas)
// ══════════════════════════════

export interface ActiveRouteDetail {
  id: string;
  route_date: string;
  status: string;
  sap_route_id: string | null;
  precintos_count: string | null;
  programed_start_time: string | null;
  programed_arrival_time: string | null;
  started_at: string | null;
  completed_at: string | null;
  driver: Pick<Profile, 'first_name' | 'paternal_last_name'> | null;
  vehicle: Pick<Vehicle, 'plate'> | null;
  route_waypoints: ActiveWaypoint[];
}

export interface ActiveWaypoint {
  id: string;
  stop_order: number;
  planned_pickup_amount: number;
  zone: string;
  sap_route_id: string | null;
  farm: Farm | null;
}

// ══════════════════════════════
// Waypoint Collections
// ══════════════════════════════

export type CollectionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface WaypointCollection {
  id: string;
  waypoint_id: string;
  route_id: string;
  arrival_time: string | null;
  departure_time: string | null;
  precinto_ingreso: string | null;
  precinto_salida: string | null;
  guia_transportista_number: string | null;
  guia_remision_number: string | null;
  guia_transportista_file: string | null;
  guia_remision_file: string | null;
  saldo: number | null;
  observations: string | null;
  status: CollectionStatus;
}

export interface WaypointCollectionInput {
  precinto_ingreso?: string;
  precinto_salida?: string;
  guia_transportista_number?: string;
  guia_remision_number?: string;
  guia_transportista_file?: string;
  guia_remision_file?: string;
  saldo?: number | null;
  observations?: string;
  status?: string;
  arrival_time?: string;
  departure_time?: string;
}

export interface CollectionSummary {
  id: string;
  waypoint_id: string;
  status: CollectionStatus;
}

// ══════════════════════════════
// Tank Readings
// ══════════════════════════════

export interface TankReading {
  id: string;
  collection_id: string;
  tank_id: string;
  reading_cm: number | null;
  reading_mm: number | null;
  table_liters: number | null;
  manual_liters: number | null;
  factor: number;
  kg: number | null;
  kg_direct: number | null;
  temperature: number | null;
  lab_authorized: boolean | null;
  observation: string | null;
  photo_file: string | null;
}

export interface TankReadingInput {
  reading_cm?: number | null;
  reading_mm?: number | null;
  table_liters?: number | null;
  manual_liters?: number | null;
  factor?: number;
  kg?: number | null;
  kg_direct?: number | null;
  temperature?: number | null;
  lab_authorized?: boolean | null;
  observation?: string | null;
  photo_file?: string | null;
}

// Metadatos para estampar en la foto
export interface PhotoMetadata {
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  plate: string;
  driverName: string;
  farmName: string;
}

// ══════════════════════════════
// Farm Tanks
// ══════════════════════════════

export type ConversionType = 'decimal' | 'integer';

export interface FarmTank {
  id: string;
  name: string;
  farm_id: string;
}

export interface FarmTankWithType extends FarmTank {
  conversion_type: ConversionType | null;
}

// ══════════════════════════════
// MyRoutes (lista del conductor)
// ══════════════════════════════

export interface MyRoute {
  id: string;
  route_date: string;
  status: string;
  programed_start_time: string;
  sap_route_id: string | null;
  vehicle: Pick<Vehicle, 'plate'> | null;
  route_waypoints: { count: number }[];
}