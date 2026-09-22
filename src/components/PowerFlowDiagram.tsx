/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  PowerBalanceResult,
  MicrogridState,
} from '../types/microgrid';
import {
  Zap,
  Sun,
  BatteryCharging,
  BatteryMedium,
  BatteryWarning,
  Cpu,
  ShieldCheck,
  Building,
  Droplet,
  Wrench,
  AlertOctagon,
  ArrowRight,
  Radio,
} from 'lucide-react';

interface PowerFlowDiagramProps {
  state: MicrogridState;
  result: PowerBalanceResult;
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({ state, result }) => {
  const isGridFlowing = result.gridSuppliedKW > 0;
  const isSolarFlowing = result.solarSuppliedKW > 0;
  const isBatteryDischarging = result.batteryState === 'DISCHARGING' && result.batteryPowerKW > 0;
  const isBatteryCharging = result.batteryState === 'CHARGING' && result.batteryPowerKW > 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
            SCADA Single-Line Power Flow Topology
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-amber-400 inline-block rounded" /> Grid
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-yellow-400 inline-block rounded" /> Solar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-cyan-400 inline-block rounded" /> Battery
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-emerald-400 inline-block rounded" /> Load Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-red-500 inline-block rounded" /> Shed
          </span>
        </div>
      </div>

      {/* Grid Failure Banner overlay if tripped */}
      {!state.gridEnabled && (
        <div className="my-3 bg-red-950/60 border border-red-500/60 rounded-lg p-2.5 flex items-center justify-between text-red-300 text-xs font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-bold">GRID FAILURE DETECTED:</span>
            <span>Utility interconnection disconnected. Microgrid operating in Islanded mode.</span>
          </div>
          <span className="text-[10px] bg-red-900/80 px-2 py-0.5 rounded border border-red-700 font-bold">
            BREAKER OPEN (0 kW)
          </span>
        </div>
      )}

      {/* Flow visualization container */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* SOURCE NODES (Left Column - 4 cols) */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* 1. UTILITY GRID NODE */}
          <div
            className={`p-3 rounded-lg border transition-all relative ${
              state.gridEnabled
                ? 'bg-slate-950/90 border-amber-500/40 shadow-sm shadow-amber-950/20'
                : 'bg-red-950/20 border-red-900/50 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center font-mono ${
                    state.gridEnabled ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    UTILITY GRID
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        state.gridEnabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {state.gridEnabled ? 'CONNECTED' : 'TRIPPED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Capacity: {state.gridCapacityKW} kW
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">Injecting</div>
                <div className="text-sm font-bold text-amber-400">
                  {result.gridSuppliedKW.toFixed(1)} kW
                </div>
              </div>
            </div>
            {/* Flow indicator light */}
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60">
              <span>Status: {state.gridEnabled ? 'Active Feeder' : 'Open Circuit'}</span>
              <span className={isGridFlowing ? 'text-amber-400 animate-pulse' : 'text-slate-600'}>
                {isGridFlowing ? '► FLOWING TO BUS' : 'IDLE'}
              </span>
            </div>
          </div>

          {/* 2. SOLAR PV NODE */}
          <div className="p-3 rounded-lg border bg-slate-950/90 border-yellow-500/40 shadow-sm shadow-yellow-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-mono">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    SOLAR PV ARRAY
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-yellow-950 text-yellow-300 border border-yellow-800 font-mono">
                      {state.solarPreset.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Rating: {state.solarCapacityKW} kWp • Available: {result.solarAvailableKW} kW
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">Generating</div>
                <div className="text-sm font-bold text-yellow-400">
                  {result.solarSuppliedKW.toFixed(1)} kW
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60">
              <span>Sun Irradiance: {((result.solarAvailableKW / state.solarCapacityKW) * 100).toFixed(0)}%</span>
              <span className={isSolarFlowing ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}>
                {isSolarFlowing ? '► FLOWING TO BUS' : '0 kW (NO SUN)'}
              </span>
            </div>
          </div>

          {/* 3. BESS BATTERY STORAGE NODE */}
          <div className="p-3 rounded-lg border bg-slate-950/90 border-cyan-500/40 shadow-sm shadow-cyan-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono">
                  {result.batteryState === 'CHARGING' ? (
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  ) : result.batterySOC <= state.batteryMinSOC ? (
                    <BatteryWarning className="w-4 h-4 text-amber-400" />
                  ) : (
                    <BatteryMedium className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    BESS STORAGE
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        result.batteryState === 'CHARGING'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : result.batteryState === 'DISCHARGING'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {result.batteryState}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Cap: {state.batteryCapacityKWh} kWh • Max Disch: {state.batteryMaxDischargeKW} kW
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">
                  {result.batteryState === 'CHARGING' ? 'Absorbing' : 'Delivering'}
                </div>
                <div
                  className={`text-sm font-bold ${
                    result.batteryState === 'CHARGING'
                      ? 'text-emerald-400'
                      : result.batteryState === 'DISCHARGING'
                      ? 'text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  {result.batteryPowerKW.toFixed(1)} kW
                </div>
              </div>
            </div>

            {/* SOC Bar */}
            <div className="mt-2 pt-1.5 border-t border-slate-800/60">
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-slate-400">
                  SOC: <strong className="text-cyan-300">{result.batterySOC.toFixed(1)}%</strong>
                </span>
                <span className="text-slate-500">Min Reserve: {state.batteryMinSOC}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                {/* Min SOC threshold marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${state.batteryMinSOC}%` }}
                  title={`Min SOC Limit (${state.batteryMinSOC}%)`}
                />
                <div
                  className={`h-full transition-all duration-500 ${
                    result.batterySOC <= state.batteryMinSOC
                      ? 'bg-red-500'
                      : result.batterySOC < 40
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, result.batterySOC))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CENTRAL EMS MICROGRID BUS (Middle Column - 4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center px-2 py-2">
          {/* Visual SVG Bus Conduit Interconnect */}
          <div className="w-full relative bg-slate-950/80 border-2 border-emerald-500/50 rounded-xl p-4 shadow-lg shadow-emerald-950/30 text-center">
            {/* Pulsing indicator tag */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-900 border border-emerald-500/80 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1 shadow">
              <Cpu className="w-3 h-3" /> EMS INTELLIGENT BUS
            </div>

            <div className="mt-2 space-y-2">
              <div className="text-[11px] font-mono text-slate-400">Total Generation Available</div>
              <div className="text-2xl font-bold font-mono text-white flex items-center justify-center gap-1">
                {result.totalGenerationAvailableKW.toFixed(1)} <span className="text-sm text-emerald-400">kW</span>
              </div>

              {/* Energy Flow Balance Equation display */}
              <div className="grid grid-cols-2 gap-2 text-left bg-slate-900/90 rounded p-2 border border-slate-800 text-[11px] font-mono">
                <div>
                  <div className="text-slate-500">Active Demand:</div>
                  <div className="font-bold text-slate-200">{result.totalActiveLoadKW.toFixed(1)} kW</div>
                </div>
                <div>
                  <div className="text-slate-500">Power Balance:</div>
                  <div
                    className={`font-bold ${
                      result.netSurplusKW > 0
                        ? 'text-emerald-400'
                        : result.deficitAfterSheddingKW > 0
                        ? 'text-red-400'
                        : 'text-sky-300'
                    }`}
                  >
                    {result.netSurplusKW > 0
                      ? `+${result.netSurplusKW.toFixed(1)} kW (Surplus)`
                      : result.deficitAfterSheddingKW > 0
                      ? `-${result.deficitAfterSheddingKW.toFixed(1)} kW (Deficit)`
                      : 'Balanced (0.0 kW)'}
                  </div>
                </div>
              </div>

              {/* Real-time SCADA Frequency & Voltage Bar */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                <span>Bus Voltage: <strong className="text-sky-300">{result.busVoltageV} V</strong></span>
                <span>Freq: <strong className="text-emerald-300">{result.frequencyHz.toFixed(2)} Hz</strong></span>
              </div>
            </div>

            {/* Directional Flow Arrows Graphic */}
            <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400">
                Sources <ArrowRight className="w-3 h-3" />
              </span>
              <span className="text-slate-400">EMS Dispatch Engine</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ArrowRight className="w-3 h-3" /> Microgrid Loads
              </span>
            </div>
          </div>
        </div>

        {/* LOADS CLUSTER (Right Column - 4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between px-1">
            <span>MICROGRID CONSUMERS</span>
            <span className="text-[10px] text-slate-400">
              Active: {result.activeLoads.length} / {state.loads.length}
            </span>
          </div>

          {state.loads.map((load) => {
            const isShed = result.shedLoads.some((l) => l.id === load.id);
            const isManuallyOff = !load.enabled;

            const getIcon = () => {
              switch (load.id) {
                case 'essential-load':
                  return <ShieldCheck className="w-4 h-4 text-rose-400" />;
                case 'hostel-load':
                  return <Building className="w-4 h-4 text-sky-400" />;
                case 'water-pump':
                  return <Droplet className="w-4 h-4 text-cyan-400" />;
                case 'workshop-load':
                  return <Wrench className="w-4 h-4 text-amber-400" />;
                default:
                  return <Zap className="w-4 h-4 text-emerald-400" />;
              }
            };

            const getPriorityBadge = (p: number) => {
              if (p === 1) return <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">P1 ESSENTIAL</span>;
              if (p === 2) return <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">P2 IMPORTANT</span>;
              return <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">P3 NON-ESSENTIAL</span>;
            };

            return (
              <div
                key={load.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  isShed
                    ? 'bg-red-950/20 border-red-900/60 opacity-80'
                    : isManuallyOff
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : 'bg-slate-950/90 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
                      {getIcon()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        {load.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getPriorityBadge(load.priority)}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {load.demandKW} kW
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isShed
                          ? 'bg-red-900/90 text-red-200 border border-red-600 animate-pulse'
                          : isManuallyOff
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      {isShed ? 'SHED' : isManuallyOff ? 'OFF' : 'ENERGIZED'}
                    </span>
                  </div>
                </div>

                {isShed && (
                  <div className="mt-1.5 text-[10px] font-mono text-red-400 bg-red-950/40 px-2 py-1 rounded border border-red-900/40">
                    Shedding Reason: Disconnected by EMS priority algorithm to relieve power deficit.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
