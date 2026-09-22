/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LoadPriority = 1 | 2 | 3;

export interface MicrogridLoad {
  id: string;
  name: string;
  category: 'critical' | 'infrastructure' | 'industrial' | 'residential';
  demandKW: number;
  priority: LoadPriority; // 1 = Essential, 2 = Important, 3 = Non-essential
  enabled: boolean; // Operator manual control switch
  isShed: boolean; // Automated load shedding state
  shedReason?: string;
  shedTimestamp?: string;
}

export type OperatingMode = 'GRID-CONNECTED' | 'ISLANDED' | 'LOW-ENERGY' | 'CRITICAL';

export type SystemStatus = 'NORMAL' | 'WARNING' | 'DEGRADED' | 'CRITICAL';

export type BatteryState = 'IDLE' | 'CHARGING' | 'DISCHARGING';

export interface PowerBalanceResult {
  // Direct Generation
  gridAvailableKW: number;
  gridSuppliedKW: number;
  solarAvailableKW: number;
  solarSuppliedKW: number;

  // Battery BESS
  batteryCapacityKWh: number;
  batterySOC: number;
  minSOC: number;
  batteryMaxDischargeKW: number;
  batteryMaxChargeKW: number;
  batteryState: BatteryState;
  batteryPowerKW: number; // Discharging (+) or Charging (-) or 0

  // Total Available Generation = Grid Available + Solar Available + Max Usable Battery Discharge
  totalGenerationAvailableKW: number;

  // Load Totals
  totalDemandRequestedKW: number;
  totalActiveLoadKW: number;
  totalShedLoadKW: number;

  // Power Balance calculations
  // Power Balance = Total Injected - Total Load
  powerBalanceKW: number;
  netSurplusKW: number;
  deficitBeforeSheddingKW: number;
  deficitAfterSheddingKW: number;

  // System States
  operatingMode: OperatingMode;
  systemStatus: SystemStatus;

  // Load breakdown
  activeLoads: MicrogridLoad[];
  shedLoads: MicrogridLoad[];
  loadDecisions: Array<{
    loadId: string;
    name: string;
    priority: LoadPriority;
    demandKW: number;
    status: 'ACTIVE' | 'SHED';
    reason: string;
  }>;

  // SCADA Electrical parameters (simulated)
  busVoltageV: number;
  frequencyHz: number;
}

export interface MicrogridState {
  gridEnabled: boolean;
  gridCapacityKW: number;

  solarCapacityKW: number;
  solarGenerationKW: number;
  solarPreset: string;

  batteryCapacityKWh: number;
  batterySOC: number;
  batteryMinSOC: number;
  batteryMaxDischargeKW: number;
  batteryMaxChargeKW: number;

  loads: MicrogridLoad[];
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'ACTION';
  message: string;
}

export interface HistoryPoint {
  timeLabel: string;
  gridKW: number;
  solarKW: number;
  batteryKW: number;
  demandKW: number;
  activeKW: number;
  batterySOC: number;
}

export interface TestScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  expectedResult: string;
  state: {
    gridEnabled: boolean;
    gridCapacityKW: number;
    solarGenerationKW: number;
    solarPreset: string;
    batterySOC: number;
    loads: { id: string; demandKW: number; enabled: boolean }[];
  };
}
