/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MicrogridSources } from '../types';
import {
  Play,
  AlertTriangle,
  CloudSun,
  RotateCcw,
  Zap,
  Sun,
  ToggleLeft,
  ToggleRight,
  Sliders,
} from 'lucide-react';

interface SimulationControlsProps {
  sources: MicrogridSources;
  onUpdateSources: (updates: Partial<MicrogridSources>) => void;
  onTriggerScenario: (scenario: 'normal' | 'grid-outage' | 'solar-reduced' | 'restore') => void;
  activeScenario: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  sources,
  onUpdateSources,
  onTriggerScenario,
  activeScenario,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
            Simulation Controls
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Click a preset or adjust live sliders below
        </span>
      </div>

      {/* Preset Scenario Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        {/* Normal Operation */}
        <button
          onClick={() => onTriggerScenario('normal')}
          className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all ${
            activeScenario === 'normal'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 shadow'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Normal Operation
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Grid (34.5 kW) + Solar (23 kW)
          </span>
        </button>

        {/* Grid Outage */}
        <button
          onClick={() => onTriggerScenario('grid-outage')}
          className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all ${
            activeScenario === 'grid-outage'
              ? 'bg-red-950/80 border-red-500 text-red-200 ring-1 ring-red-500 shadow'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Grid Outage
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Grid drops to 0 kW (Trip)
          </span>
        </button>

        {/* Solar Reduced */}
        <button
          onClick={() => onTriggerScenario('solar-reduced')}
          className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all ${
            activeScenario === 'solar-reduced'
              ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500 shadow'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" /> Solar Reduced
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Cloud cover drops solar to 5 kW
          </span>
        </button>

        {/* Restore System */}
        <button
          onClick={() => onTriggerScenario('restore')}
          className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all ${
            activeScenario === 'restore'
              ? 'bg-sky-950/80 border-sky-500 text-sky-200 ring-1 ring-sky-500 shadow'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" /> Restore System
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Reset to default parameters
          </span>
        </button>
      </div>

      {/* Manual Sliders for Custom Engineering Experiments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Grid Feeder Manual Control */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono text-slate-200">Utility Grid Feeder</span>
            </div>
            <button
              onClick={() => onUpdateSources({ isGridOnline: !sources.isGridOnline })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                sources.isGridOnline
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-red-950 text-red-300 border border-red-700'
              }`}
            >
              {sources.isGridOnline ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {sources.isGridOnline ? 'ONLINE' : 'OFFLINE (TRIPPED)'}
            </button>
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Grid Output:</span>
            <span className="text-amber-300 font-bold">
              {sources.isGridOnline ? `${sources.gridPowerKW} kW` : '0 kW (Offline)'}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            disabled={!sources.isGridOnline}
            value={sources.gridPowerKW}
            onChange={(e) => onUpdateSources({ gridPowerKW: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Solar Manual Control */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold font-mono text-slate-200">Solar PV / Inverter</span>
            </div>
            <span className="text-xs font-mono text-yellow-300 font-bold">
              {sources.solarPowerKW} kW
            </span>
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Solar Generation Output:</span>
            <span className="text-yellow-400 font-bold">{sources.solarPowerKW} kW</span>
          </div>

          <input
            type="range"
            min="0"
            max="40"
            step="0.5"
            value={sources.solarPowerKW}
            onChange={(e) => onUpdateSources({ solarPowerKW: Number(e.target.value) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
