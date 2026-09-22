/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 1. Definition of Building Loads (Hostels)
export type PowerSourceType = 'Grid' | 'Solar/Inverter';
export type AllocationStatus = 'Powered' | 'Limited' | 'Disconnected';

export interface BuildingLoad {
  id: string;
  name: string;
  demandKW: number;
  priority: number; // 1 = Highest priority, 4 = Lowest priority
  preferredSource: PowerSourceType;
  allocatedKW: number;
  status: AllocationStatus;
}

// 2. Definition of Power Sources
export interface MicrogridSources {
  gridPowerKW: number;
  isGridOnline: boolean;
  solarPowerKW: number;
}

// 3. Calculation & System Status Output
export interface MicrogridCalculation {
  totalAvailablePowerKW: number;
  totalLoadKW: number;
  powerBalanceKW: number; // Positive = surplus, Negative = deficit
  isDeficit: boolean;
  deficitKW: number;
  surplusKW: number;
  systemStatusText: 'SYSTEM STABLE' | 'POWER DEFICIT';
  buildings: BuildingLoad[];
}

// 4. Live Telemetry Data Point for Motion Graph
export interface TelemetryPoint {
  id: string;
  time: string;
  availableKW: number;
  demandKW: number;
  gridKW: number;
  solarKW: number;
  balanceKW: number;
  isDeficit: boolean;
}
