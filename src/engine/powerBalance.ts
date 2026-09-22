/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MicrogridState, PowerBalanceResult, MicrogridLoad } from '../types/microgrid';

/**
 * Executes a deterministic electrical power balance and automated prioritized load shedding calculation.
 *
 * Conservation of Energy:
 * Total Active Power Injected = Total Active Power Consumed + Losses + Storage
 *
 * Source Dispatch Hierarchy:
 * 1. Solar PV (Renewable, zero-marginal cost, self-consumption priority)
 * 2. Utility Grid (Primary baseload when connected)
 * 3. BESS Discharge (Secondary buffer during grid outage or peak deficit)
 *
 * Load Shedding Priority Hierarchy:
 * - Priority 3 (Non-essential, e.g. Workshop): Shed FIRST
 * - Priority 2 (Important, e.g. Hostel, Water Pump): Shed SECOND
 * - Priority 1 (Essential/Emergency): Protected at all costs, shed only under catastrophic collapse
 */
export function calculatePowerBalance(state: MicrogridState): PowerBalanceResult {
  // 1. Determine available generation from active sources
  const gridAvailableKW = state.gridEnabled ? Math.max(0, state.gridCapacityKW) : 0;
  const solarAvailableKW = Math.max(0, state.solarGenerationKW);

  // Usable battery discharge calculation
  // Check if SOC is strictly above minSOC
  const usableSOC = Math.max(0, state.batterySOC - state.batteryMinSOC);
  // Energy available above minSOC in kWh
  const usableEnergyKWh = (usableSOC / 100) * state.batteryCapacityKWh;
  // Maximum discharge power constrained by hardware rating and available energy reserve
  // (assuming C-rate discharge can deliver up to max discharge if energy is available)
  const maxDischargePossibleKW = usableEnergyKWh > 0.05
    ? Math.min(state.batteryMaxDischargeKW, usableEnergyKWh * 2) // can discharge up to max rating
    : 0;

  // 2. Tally total operator-enabled demand
  const enabledLoads = state.loads.filter((load) => load.enabled);
  const totalDemandRequestedKW = enabledLoads.reduce((sum, l) => sum + l.demandKW, 0);

  // 3. Evaluate Direct Generation (Grid + Solar) vs Demand
  const directGenerationKW = gridAvailableKW + solarAvailableKW;
  const directBalanceKW = directGenerationKW - totalDemandRequestedKW;

  let batteryState: 'IDLE' | 'CHARGING' | 'DISCHARGING' = 'IDLE';
  let batteryPowerKW = 0; // Positive = discharging into microgrid, Negative = charging from surplus
  let gridSuppliedKW = 0;
  let solarSuppliedKW = 0;

  let activeLoads: MicrogridLoad[] = [];
  let shedLoads: MicrogridLoad[] = [];
  const loadDecisions: PowerBalanceResult['loadDecisions'] = [];

  let deficitBeforeSheddingKW = 0;
  let deficitAfterSheddingKW = 0;
  let netSurplusKW = 0;

  if (directBalanceKW >= 0) {
    // CASE A: Direct generation meets or exceeds demand.
    // Solar is utilized first, then Grid supplies remainder if any.
    solarSuppliedKW = Math.min(solarAvailableKW, totalDemandRequestedKW);
    const remainingToSupply = Math.max(0, totalDemandRequestedKW - solarSuppliedKW);
    gridSuppliedKW = Math.min(gridAvailableKW, remainingToSupply);

    const directExcessKW = directBalanceKW;

    // Check if battery can absorb surplus power
    if (state.batterySOC < 100 && directExcessKW > 0) {
      const roomInBatteryKWh = ((100 - state.batterySOC) / 100) * state.batteryCapacityKWh;
      const maxChargeRate = Math.min(
        state.batteryMaxChargeKW,
        directExcessKW,
        roomInBatteryKWh * 2
      );

      if (maxChargeRate > 0.1) {
        batteryState = 'CHARGING';
        batteryPowerKW = maxChargeRate; // Charging power absorbed

        // If excess was solar, solar powers the charge; else grid can charge battery
        const remainingSolar = solarAvailableKW - solarSuppliedKW;
        const solarForCharging = Math.min(remainingSolar, maxChargeRate);
        solarSuppliedKW += solarForCharging;

        const gridForCharging = Math.min(
          gridAvailableKW - gridSuppliedKW,
          maxChargeRate - solarForCharging
        );
        gridSuppliedKW += gridForCharging;
      }
    }

    netSurplusKW = directExcessKW - (batteryState === 'CHARGING' ? batteryPowerKW : 0);
    deficitBeforeSheddingKW = 0;
    deficitAfterSheddingKW = 0;

    // All enabled loads can run
    activeLoads = enabledLoads.map((l) => ({ ...l, isShed: false }));
    shedLoads = [];

    for (const load of state.loads) {
      if (!load.enabled) {
        loadDecisions.push({
          loadId: load.id,
          name: load.name,
          priority: load.priority,
          demandKW: load.demandKW,
          status: 'SHED',
          reason: 'Manually switched OFF by operator',
        });
      } else {
        loadDecisions.push({
          loadId: load.id,
          name: load.name,
          priority: load.priority,
          demandKW: load.demandKW,
          status: 'ACTIVE',
          reason: 'Generation sufficient; fully energized',
        });
      }
    }
  } else {
    // CASE B: Direct generation is insufficient (Deficit exists)
    // Direct generation is fully utilized
    solarSuppliedKW = solarAvailableKW;
    gridSuppliedKW = gridAvailableKW;

    const initialDeficitKW = Math.abs(directBalanceKW);
    deficitBeforeSheddingKW = initialDeficitKW;

    // Dispatch Battery to assist
    if (maxDischargePossibleKW > 0) {
      const dischargeKW = Math.min(initialDeficitKW, maxDischargePossibleKW);
      batteryState = 'DISCHARGING';
      batteryPowerKW = dischargeKW; // Discharging power injected
    } else {
      batteryState = 'IDLE';
      batteryPowerKW = 0;
    }

    const netDeficitAfterBatteryKW = initialDeficitKW - (batteryState === 'DISCHARGING' ? batteryPowerKW : 0);

    if (netDeficitAfterBatteryKW <= 0.001) {
      // Battery was able to completely bridge the deficit!
      deficitAfterSheddingKW = 0;
      netSurplusKW = 0;
      activeLoads = enabledLoads.map((l) => ({ ...l, isShed: false }));
      shedLoads = [];

      for (const load of state.loads) {
        if (!load.enabled) {
          loadDecisions.push({
            loadId: load.id,
            name: load.name,
            priority: load.priority,
            demandKW: load.demandKW,
            status: 'SHED',
            reason: 'Manually switched OFF by operator',
          });
        } else {
          loadDecisions.push({
            loadId: load.id,
            name: load.name,
            priority: load.priority,
            demandKW: load.demandKW,
            status: 'ACTIVE',
            reason: 'Supported by BESS battery discharge buffer',
          });
        }
      }
    } else {
      // Net deficit remains: We MUST shed loads to prevent bus voltage collapse!
      // Prioritize loads for shedding:
      // Priority 3 first (descending priority number = 3, then 2, then 1)
      // Within same priority, shed largest load first to minimize disconnection count
      const sortedCandidates = [...enabledLoads].sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority; // Priority 3 before Priority 2 before Priority 1
        }
        return b.demandKW - a.demandKW; // Higher demand shed first
      });

      let remainingDeficit = netDeficitAfterBatteryKW;
      const shedSet = new Set<string>();
      const shedReasons = new Map<string, string>();

      for (const candidate of sortedCandidates) {
        if (remainingDeficit <= 0.001) {
          break;
        }

        shedSet.add(candidate.id);
        remainingDeficit = Math.max(0, remainingDeficit - candidate.demandKW);

        const priorityLabel =
          candidate.priority === 3
            ? 'Priority 3 (Non-essential)'
            : candidate.priority === 2
            ? 'Priority 2 (Important)'
            : 'Priority 1 (Essential)';

        shedReasons.set(
          candidate.id,
          `Automated load shedding: ${priorityLabel} disconnected to relieve ${netDeficitAfterBatteryKW.toFixed(1)} kW deficit`
        );
      }

      deficitAfterSheddingKW = remainingDeficit;
      netSurplusKW = remainingDeficit <= 0.001 ? Math.abs(remainingDeficit) : 0;

      // Construct active and shed lists
      activeLoads = [];
      shedLoads = [];

      for (const load of state.loads) {
        if (!load.enabled) {
          loadDecisions.push({
            loadId: load.id,
            name: load.name,
            priority: load.priority,
            demandKW: load.demandKW,
            status: 'SHED',
            reason: 'Manually switched OFF by operator',
          });
          continue;
        }

        if (shedSet.has(load.id)) {
          const reason = shedReasons.get(load.id) || 'Insufficient available generation';
          const shedLoad: MicrogridLoad = {
            ...load,
            isShed: true,
            shedReason: reason,
          };
          shedLoads.push(shedLoad);
          loadDecisions.push({
            loadId: load.id,
            name: load.name,
            priority: load.priority,
            demandKW: load.demandKW,
            status: 'SHED',
            reason,
          });
        } else {
          const activeLoad: MicrogridLoad = {
            ...load,
            isShed: false,
          };
          activeLoads.push(activeLoad);
          loadDecisions.push({
            loadId: load.id,
            name: load.name,
            priority: load.priority,
            demandKW: load.demandKW,
            status: 'ACTIVE',
            reason: `Preserved due to Priority ${load.priority} status`,
          });
        }
      }
    }
  }

  // 4. Calculate total active power drawn
  const totalActiveLoadKW = activeLoads.reduce((sum, l) => sum + l.demandKW, 0);
  const totalShedLoadKW = shedLoads.reduce((sum, l) => sum + l.demandKW, 0);

  // Total generation available includes Grid, Solar, and what the Battery CAN discharge right now
  const totalGenerationAvailableKW = gridAvailableKW + solarAvailableKW + maxDischargePossibleKW;

  // Power balance calculation as strictly requested in Prompt #3:
  // Total Generation = Grid + Solar + Battery discharge
  // Power Balance = Total Generation - Total Load
  const powerBalanceKW =
    (gridSuppliedKW + solarSuppliedKW + (batteryState === 'DISCHARGING' ? batteryPowerKW : 0)) -
    totalActiveLoadKW;

  // 5. Operating Mode Determination
  // GRID-CONNECTED: Grid is available
  // ISLANDED: Grid has failed and the microgrid operates using solar and battery
  // LOW-ENERGY: Available generation is insufficient and load shedding is occurring
  // CRITICAL: Even after load shedding, available generation cannot adequately support essential load
  let operatingMode: PowerBalanceResult['operatingMode'] = 'GRID-CONNECTED';
  let systemStatus: PowerBalanceResult['systemStatus'] = 'NORMAL';

  const essentialLoadShed = shedLoads.some((l) => l.priority === 1);

  if (essentialLoadShed || deficitAfterSheddingKW > 0.05) {
    operatingMode = 'CRITICAL';
    systemStatus = 'CRITICAL';
  } else if (shedLoads.length > 0) {
    operatingMode = 'LOW-ENERGY';
    systemStatus = 'DEGRADED';
  } else if (!state.gridEnabled || gridAvailableKW === 0) {
    operatingMode = 'ISLANDED';
    systemStatus = batteryState === 'DISCHARGING' && state.batterySOC < 30 ? 'WARNING' : 'NORMAL';
  } else {
    operatingMode = 'GRID-CONNECTED';
    systemStatus = 'NORMAL';
  }

  // SCADA Frequency & Bus Voltage realism
  // Nominal 50.00 Hz / 400.0 V with slight frequency droop when stressed
  let frequencyHz = 50.0;
  let busVoltageV = 400.0;

  if (operatingMode === 'CRITICAL') {
    frequencyHz = 48.8;
    busVoltageV = 368.0;
  } else if (operatingMode === 'LOW-ENERGY') {
    frequencyHz = 49.6;
    busVoltageV = 392.0;
  } else if (operatingMode === 'ISLANDED') {
    frequencyHz = 49.95;
    busVoltageV = 399.0;
  }

  return {
    gridAvailableKW,
    gridSuppliedKW,
    solarAvailableKW,
    solarSuppliedKW,
    batteryCapacityKWh: state.batteryCapacityKWh,
    batterySOC: state.batterySOC,
    minSOC: state.batteryMinSOC,
    batteryMaxDischargeKW: state.batteryMaxDischargeKW,
    batteryMaxChargeKW: state.batteryMaxChargeKW,
    batteryState,
    batteryPowerKW,
    totalGenerationAvailableKW,
    totalDemandRequestedKW,
    totalActiveLoadKW,
    totalShedLoadKW,
    powerBalanceKW,
    netSurplusKW,
    deficitBeforeSheddingKW,
    deficitAfterSheddingKW,
    operatingMode,
    systemStatus,
    activeLoads,
    shedLoads,
    loadDecisions,
    busVoltageV,
    frequencyHz,
  };
}
