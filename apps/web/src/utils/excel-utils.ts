// File: apps/web/src/utils/excel-utils.ts
import Papa from 'papaparse';

export interface ParsedWaypoint {
  farmId: string;
  farmName: string;
  ruc: string;
  plannedPickupAmount: number;
  stopOrder: number;
  zone: string;
  sapRouteId: string;
}

export interface ParsedRoute {
  tempId: string;
  date: string;
  driverId: string;
  driverNameInput: string;
  vehicleId: string;
  plateInput: string;
  precintosCount: string;
  startTime: string;
  endTime: string;
  sapRouteId: string;
  waypoints: ParsedWaypoint[];
  errors: string[];
  warnings: string[];
}

export interface ProcessingResult {
  validRoutes: ParsedRoute[];
  ignoredRows: number;
  totalRoutesDetected: number;
}

export interface ReferenceData {
  vehicles: Map<string, string>;
  drivers: Map<string, string>;
  farms: Map<string, { id: string; name: string }>;
}

// ============================================================================
// PARSER PRINCIPAL - Lee CSV generado por la macro VBA
// ============================================================================
export const processRoutesCSV = async (file: File, refData: ReferenceData): Promise<ProcessingResult> => {
  console.log('🚀 INICIANDO PROCESAMIENTO DE CSV');
  console.log(`📁 Archivo: ${file.name} | Tamaño: ${file.size} bytes`);
  console.log(`📊 Ref data: ${refData.vehicles.size} vehículos, ${refData.drivers.size} conductores, ${refData.farms.size} granjas`);

  const text = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          const parsed = procesarFilas(result.data as any[], refData);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      },
      error: (err: any) => {
        reject(new Error(`Error al leer CSV: ${err.message}`));
      }
    });
  });
};

function procesarFilas(rows: any[], refData: ReferenceData): ProcessingResult {
  console.log(`📊 Filas leídas: ${rows.length}`);

  // Agrupar por route_group_id
  const groups = new Map<string, any[]>();

  for (const row of rows) {
    const groupId = row.route_group_id?.toString().trim();
    if (!groupId) continue;

    if (!groups.has(groupId)) {
      groups.set(groupId, []);
    }
    groups.get(groupId)!.push(row);
  }

  console.log(`📊 Grupos detectados: ${groups.size}`);

  const routes: ParsedRoute[] = [];
  let ignoredRowsCount = 0;

  for (const [groupId, groupRows] of groups) {
    const first = groupRows[0];

    const plate = (first.placa || '').toString().trim().toUpperCase();
    const driver = (first.conductor || '').toString().trim().toUpperCase();
    const date = (first.fecha || '').toString().trim();
    const precintos = (first.precintos || '').toString().trim();
    const startTime = (first.salida || '').toString().trim();
    const endTime = (first.llegada || '').toString().trim();
    const sapRouteId = (first.ruta_sap || '').toString().trim();

    // Validar placa
    if (!refData.vehicles.has(plate)) {
      console.warn(`❌ Grupo ${groupId}: Placa "${plate}" no encontrada en BD - Ignorado (${groupRows.length} filas)`);
      ignoredRowsCount += groupRows.length;
      continue;
    }

    const vehicleId = refData.vehicles.get(plate)!;
    const driverId = refData.drivers.get(driver) || '';

    console.log(`🆕 Grupo ${groupId}: ${plate} | ${driver} | ${date} | SAP: ${sapRouteId} | ${groupRows.length} filas`);

    const route: ParsedRoute = {
      tempId: crypto.randomUUID(),
      date,
      driverId,
      driverNameInput: driver,
      vehicleId,
      plateInput: plate,
      precintosCount: precintos,
      startTime,
      endTime,
      sapRouteId,
      waypoints: [],
      errors: [],
      warnings: []
    };

    // Warning: conductor no registrado
    if (!driverId && driver) {
      route.warnings.push(`Conductor "${driver}" no registrado en el sistema`);
    }

    // Error: fecha inválida
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      route.errors.push(`Fecha inválida: "${date}"`);
    }

    // Procesar waypoints
    let stopOrder = 1;

    for (const row of groupRows) {
      const ruc = (row.proveedor_ruc || '').toString().trim();
      const zona = (row.zona || '').toString().trim();
      const rutaSap = (row.ruta_sap || '').toString().trim();
      const cantidad = Number(row.cantidad) || 0;

      if (!ruc) continue;

      const farmData = refData.farms.get(ruc);
      if (farmData) {
        route.waypoints.push({
          farmId: farmData.id,
          farmName: farmData.name,
          ruc,
          plannedPickupAmount: cantidad,
          stopOrder,
          zone: zona,
          sapRouteId: rutaSap
        });
        stopOrder++;
      } else {
        route.warnings.push(`Proveedor desconocido (RUC ${ruc})`);
        console.warn(`  ⚠️ Grupo ${groupId}: RUC ${ruc} no encontrado en BD`);
      }
    }

    routes.push(route);
  }

  // Resumen
  console.log('\n✅ PROCESAMIENTO COMPLETADO');
  console.log(`📊 Rutas: ${routes.length} | Ignoradas: ${ignoredRowsCount}`);
  routes.forEach((r, i) => {
    const status = r.errors.length > 0 ? '❌' : r.warnings.length > 0 ? '⚠️' : '✅';
    console.log(`  ${status} Ruta ${i + 1}: ${r.plateInput} | ${r.date} | ${r.driverNameInput} | SAP: ${r.sapRouteId} | ${r.waypoints.length} wp | ${r.warnings.length} warn | ${r.errors.length} err`);
  });

  return {
    validRoutes: routes,
    ignoredRows: ignoredRowsCount,
    totalRoutesDetected: routes.length
  };
}