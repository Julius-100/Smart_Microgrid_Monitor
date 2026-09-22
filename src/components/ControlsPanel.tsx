/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  MicrogridState,
  PowerBalanceResult,
  LoadPriority,
} from '../types/microgrid';
import { SOLAR_PRESETS } from '../engine/initialState';
import {
  Sun,
  Zap,
  Battery,
  Sliders,
  ShieldCheck,
  Building,
  Droplet,
  Wrench,
  ToggleLeft,
  ToggleRight,
  SunMedium,
  Sunset,
  Sunrise,
  Moon,
  Cloud,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface ControlsPanelProps {
  state: MicrogridState;
  result: PowerBalanceResult;
  onUpdateState: (updates: Partial<MicrogridState>) => void;
  onUpdateLoad: (loadId: string, updates: Partial<{ demandKW: number; enabled: boolean; priority: LoadPriority }>) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  state,
  result,
  onUpdateState,
  onUpdateLoad,
}) => {
  const getPresetIcon = (icon: string) => {
    switch (icon) {
      case 'Moon':
        return <Moon className="w-3.5 h-3.5" />;
      case 'Sunrise':
        return <Sunrise className="w-3.5 h-3.5" />;
      case 'SunMedium':
        return <SunMedium className="w-3.5 h-3.5" />;
      case 'Sunset':
        return <Sunset className="w-3.5 h-3.5" />;
      case 'Cloud':
        return <Cloud className="w-3.5 h-3.5" />;
      case 'Sun':
        return <Sun className="w-3.5 h-3.5" />;
      default:
        return <Sun className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* LEFT: POWER GENERATION CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
              Power Generation Sources
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Available: <strong className="text-emerald-300">{(result.gridAvailableKW + result.solarAvailableKW).toFixed(1)} kW</strong>
          </span>
        </div>

        {/* 1. Utility Grid Control */}
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono text-slate-200">Utility Grid Feeder</span>
            </div>
            <button
              onClick={() => onUpdateState({ gridEnabled: !state.gridEnabled })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                state.gridEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-red-950 text-red-300 border border-red-700'
              }`}
            >
              {state.gridEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {state.gridEnabled ? 'GRID ON' : 'GRID OFF (TRIPPED)'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Grid Feeder Capacity</span>
              <span className="text-amber-300 font-bold">
                {state.gridEnabled ? `${state.gridCapacityKW} kW` : '0 kW (Offline)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              disabled={!state.gridEnabled}
              value={state.gridCapacityKW}
              onChange={(e) => onUpdateState({ gridCapacityKW: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600">
              <span>0 kW</span>
              <span>25 kW</span>
              <span>50 kW</span>
            </div>
          </div>
        </div>

        {/* 2. Solar PV Simulation & Presets */}
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold font-mono text-slate-200">Solar PV Simulation</span>
            </div>
            <span className="text-xs font-mono font-bold text-yellow-300">
              {state.solarGenerationKW} kW <span className="text-slate-500 font-normal">/ {state.solarCapacityKW} kWp</span>
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Solar Generation Slider</span>
              <span className="text-yellow-400 font-mono">
                {((state.solarGenerationKW / state.solarCapacityKW) * 100).toFixed(0)}% Irradiance
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={state.solarCapacityKW}
              step="1"
              value={state.solarGenerationKW}
              onChange={(e) =>
                onUpdateState({
                  solarGenerationKW: Number(e.target.value),
                  solarPreset: `Manual (${e.target.value} kW)`,
                })
              }
              className="w-full accent-yellow-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600">
              <span>0 kW (Night)</span>
              <span>15 kW</span>
              <span>{state.solarCapacityKW} kW (Max)</span>
            </div>
          </div>

          {/* Solar presets */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 block mb-1.5">Solar Weather Presets:</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {SOLAR_PRESETS.map((p) => {
                const isActive = state.solarGenerationKW === p.kw;
                return (
                  <button
                    key={p.label}
                    onClick={() =>
                      onUpdateState({
                        solarGenerationKW: p.kw,
                        solarPreset: `${p.label} (${p.kw} kW)`,
                      })
                    }
                    className={`px-2 py-1.5 rounded text-[11px] font-mono flex flex-col items-center gap-1 border transition-all ${
                      isActive
                        ? 'bg-yellow-950/80 border-yellow-500 text-yellow-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title={p.desc}
                  >
                    <span className={isActive ? 'text-yellow-400' : 'text-slate-500'}>
                      {getPresetIcon(p.icon)}
                    </span>
                    <span>{p.label.split(' ')[0]}</span>
                    <span className="text-[9px] text-slate-500">{p.kw} kW</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Battery BESS Model & Settings */}
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-slate-200">Battery Energy Storage (BESS)</span>
            </div>
            <div className="text-xs font-mono text-cyan-300 font-bold">
              SOC: {state.batterySOC.toFixed(1)}%
            </div>
          </div>

          {/* Real-time Battery Status Card */}
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500">BESS Status: </span>
              <strong
                className={
                  result.batteryState === 'CHARGING'
                    ? 'text-emerald-400'
                    : result.batteryState === 'DISCHARGING'
                    ? 'text-cyan-400'
                    : 'text-slate-400'
                }
              >
                {result.batteryState}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Power: </span>
              <strong className="text-white">{result.batteryPowerKW.toFixed(1)} kW</strong>
            </div>
            <div>
              <span className="text-slate-500">Capacity: </span>
              <span className="text-slate-300">{state.batteryCapacityKWh} kWh</span>
            </div>
          </div>

          {/* Current SOC Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Current State of Charge (SOC)</span>
              <span className="text-cyan-400 font-mono">{state.batterySOC.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={state.batterySOC}
              onChange={(e) => onUpdateState({ batterySOC: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600">
              <span>0% (Empty)</span>
              <span>Min Reserve ({state.batteryMinSOC}%)</span>
              <span>100% (Full)</span>
            </div>
          </div>

          {/* Configurable Minimum SOC Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Configurable Minimum SOC Reserve</span>
              <span className="text-amber-400 font-mono">{state.batteryMinSOC}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={state.batteryMinSOC}
              onChange={(e) => onUpdateState({ batteryMinSOC: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-500">
              Protects battery longevity. Discharge ceases when SOC reaches this minimum reserve.
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: LOAD PRIORITIZATION & DEMAND CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
              Load Prioritization & Dispatch
            </h3>
          </div>
          <div className="text-xs font-mono">
            <span className="text-slate-400">Total Demand: </span>
            <strong className="text-emerald-300">{result.totalDemandRequestedKW} kW</strong>
            <span className="text-slate-500 text-[10px] ml-1">
              (Active: {result.totalActiveLoadKW.toFixed(1)} kW)
            </span>
          </div>
        </div>

        {/* Informative Priority Legend */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <div className="text-rose-300">
            <strong className="block text-rose-400">P1 Essential</strong> Never shed if power exists
          </div>
          <div className="text-sky-300">
            <strong className="block text-sky-400">P2 Important</strong> Shed after P3
          </div>
          <div className="text-amber-300">
            <strong className="block text-amber-400">P3 Non-Essential</strong> Shed FIRST on deficit
          </div>
        </div>

        {/* Loads list */}
        <div className="space-y-3">
          {state.loads.map((load) => {
            const isShed = result.shedLoads.some((l) => l.id === load.id);

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

            return (
              <div
                key={load.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isShed
                    ? 'bg-red-950/30 border-red-800/80'
                    : !load.enabled
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {getIcon()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                        {load.name}
                        {isShed && (
                          <span className="text-[9px] bg-red-900 text-red-200 px-1.5 py-0.2 rounded font-mono border border-red-700 animate-pulse">
                            AUTO-SHED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Demand: <strong className="text-slate-200">{load.demandKW} kW</strong>
                      </div>
                    </div>
                  </div>

                  {/* Manual ON/OFF switch & Priority Selector */}
                  <div className="flex items-center gap-2 font-mono">
                    <select
                      value={load.priority}
                      onChange={(e) =>
                        onUpdateLoad(load.id, { priority: Number(e.target.value) as LoadPriority })
                      }
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 font-mono focus:outline-none focus:border-emerald-500"
                    >
                      <option value={1}>P1 (Essential)</option>
                      <option value={2}>P2 (Important)</option>
                      <option value={3}>P3 (Non-essential)</option>
                    </select>

                    <button
                      onClick={() => onUpdateLoad(load.id, { enabled: !load.enabled })}
                      className={`p-1 rounded text-xs transition-colors ${
                        load.enabled
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                      title={load.enabled ? 'Switch Load OFF' : 'Switch Load ON'}
                    >
                      {load.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {/* Demand slider */}
                <div className="mt-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    disabled={!load.enabled}
                    value={load.demandKW}
                    onChange={(e) => onUpdateLoad(load.id, { demandKW: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-600">
                    <span>1 kW</span>
                    <span>10 kW</span>
                    <span>20 kW</span>
                  </div>
                </div>

                {isShed && (
                  <div className="mt-2 text-[11px] font-mono text-red-300 bg-red-950/60 p-2 rounded border border-red-900/50 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Load Shed:</strong> Disconnected by automated EMS algorithm because power balance is negative. Priority {load.priority} was shed first to preserve higher-priority loads.
                    </span>
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
