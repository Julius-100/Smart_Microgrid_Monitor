/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BuildingLoad,
  MicrogridSources,
  MicrogridCalculation,
} from '../types';

/**
 * Baseline building loads for the campus microgrid
 */
export const INITIAL_BUILDINGS: BuildingLoad[] = [
  {
    id: 'moremi',
    name: 'Moremi Hostel',
    demandKW: 18,
    priority: 1, // Highest priority: medical/essential services
    preferredSource: 'Solar/Inverter',
    allocatedKW: 18,
    status: 'Powered',
  },
  {
    id: 'makama',
    name: 'Makama Hostel',
    demandKW: 10,
    priority: 2,
    preferredSource: 'Solar/Inverter',
    allocatedKW: 10,
    status: 'Powered',
  },
  {
    id: 'mariere',
    name: 'Mariere Hostel',
    demandKW: 15,
    priority: 3,
    preferredSource: 'Grid',
    allocatedKW: 15,
    status: 'Powered',
  },
  {
    id: 'eni-njoku',
    name: 'Eni Njoku Hostel',
    demandKW: 12,
    priority: 4, // Lowest priority: shed first on deficit
    preferredSource: 'Grid',
    allocatedKW: 12,
    status: 'Powered',
  },
];

/**
 * Baseline power sources
 */
export const INITIAL_SOURCES: MicrogridSources = {
  gridPowerKW: 34.5,
  isGridOnline: true,
  solarPowerKW: 23.0,
};

/**
 * Core Microgrid Calculation Function
 *
 * 1. Calculate Total Available Power = Grid Power + Solar/Inverter Power
 * 2. Calculate Total Load = Sum of all building demands
 * 3. Compare Available Power with Total Load
 * 4. Allocate power to buildings based on priority hierarchy
 */
export function calculateMicrogrid(
  sources: MicrogridSources,
  buildings: BuildingLoad[]
): MicrogridCalculation {
  // 1. Calculate active grid power (0 if grid is offline/tripped)
  const activeGridKW = sources.isGridOnline ? Math.max(0, sources.gridPowerKW) : 0;
  const activeSolarKW = Math.max(0, sources.solarPowerKW);

  // Total Available Power = Grid + Solar/Inverter
  const totalAvailablePowerKW = Number((activeGridKW + activeSolarKW).toFixed(1));

  // 2. Total Load = Sum of Building Demands
  const totalLoadKW = Number(
    buildings.reduce((sum, b) => sum + b.demandKW, 0).toFixed(1)
  );

  // 3. Power Balance Calculation (Available - Load)
  const powerBalanceKW = Number((totalAvailablePowerKW - totalLoadKW).toFixed(1));
  const isDeficit = powerBalanceKW < 0;
  const deficitKW = isDeficit ? Math.abs(powerBalanceKW) : 0;
  const surplusKW = !isDeficit ? powerBalanceKW : 0;

  const systemStatusText = isDeficit ? 'POWER DEFICIT' : 'SYSTEM STABLE';

  // 4. Power Allocation & Load Management
  // If we have enough power, all buildings are fully powered.
  // If there is a deficit, distribute remaining power by priority (Priority 1 first, Priority 4 last).
  let remainingPowerToDistribute = totalAvailablePowerKW;

  // Sort by priority (1 is highest) for power dispatch
  const sortedBuildings = [...buildings].sort((a, b) => a.priority - b.priority);

  const updatedBuildingsMap = new Map<string, { allocatedKW: number; status: 'Powered' | 'Limited' | 'Disconnected' }>();

  for (const building of sortedBuildings) {
    if (remainingPowerToDistribute >= building.demandKW) {
      // Sufficient power available for this entire building
      updatedBuildingsMap.set(building.id, {
        allocatedKW: building.demandKW,
        status: 'Powered',
      });
      remainingPowerToDistribute = Number((remainingPowerToDistribute - building.demandKW).toFixed(1));
    } else if (remainingPowerToDistribute > 0) {
      // Partial power available: building operates in limited/curtailed mode
      updatedBuildingsMap.set(building.id, {
        allocatedKW: remainingPowerToDistribute,
        status: 'Limited',
      });
      remainingPowerToDistribute = 0;
    } else {
      // No power remaining: building is disconnected
      updatedBuildingsMap.set(building.id, {
        allocatedKW: 0,
        status: 'Disconnected',
      });
    }
  }

  // Restore original ordering
  const calculatedBuildings: BuildingLoad[] = buildings.map((b) => {
    const alloc = updatedBuildingsMap.get(b.id)!;
    return {
      ...b,
      allocatedKW: alloc.allocatedKW,
      status: alloc.status,
    };
  });

  return {
    totalAvailablePowerKW,
    totalLoadKW,
    powerBalanceKW,
    isDeficit,
    deficitKW,
    surplusKW,
    systemStatusText,
    buildings: calculatedBuildings,
  };
}
