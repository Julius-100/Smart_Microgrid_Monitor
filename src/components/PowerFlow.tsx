/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MicrogridSources, MicrogridCalculation } from '../types';
import { Zap, Sun, Building2, ArrowRight } from 'lucide-react';

interface PowerFlowProps {
  sources: MicrogridSources;
  calculation: MicrogridCalculation;
}

export const PowerFlow: React.FC<PowerFlowProps> = ({ sources, calculation }) => {
  const activeGridKW = sources.isGridOnline ? sources.gridPowerKW : 0;
  const isDeficit = calculation.isDeficit;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <h3 className="text-xs font-bold tracking-wider uppercase font-mono text-slate-400">
          Single-Line Microgrid Topology & Power Flow
        </h3>
        <span className="text-xs font-mono text-slate-400">
          Bus Status:{' '}
          <strong className={isDeficit ? 'text-red-400' : 'text-emerald-400'}>
            {isDeficit ? 'DEFICIT CURTAILMENT' : 'NORMAL SYNCHRONIZED'}
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* LEFT: Generation Sources */}
        <div className="space-y-3">
          {/* Grid Source Card */}
          <div
            className={`p-3 rounded-lg border transition-all ${
              sources.isGridOnline && activeGridKW > 0
                ? 'bg-slate-950 border-amber-500/40 text-slate-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${sources.isGridOnline ? 'text-amber-400' : 'text-slate-600'}`} />
                <span className="text-xs font-bold font-mono">Utility Grid</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                sources.isGridOnline ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'
              }`}>
                {sources.isGridOnline ? 'ONLINE' : 'OUTAGE'}
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {activeGridKW} <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
          </div>

          {/* Solar Source Card */}
          <div className="p-3 rounded-lg border border-yellow-500/40 bg-slate-950 text-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold font-mono">Solar / Inverter</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300">
                ACTIVE
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-yellow-300 mt-1">
              {sources.solarPowerKW} <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
          </div>
        </div>

        {/* CENTER: Central Microgrid Bus */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border-2 border-slate-700/80 shadow-inner text-center space-y-2 relative">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Central Distribution Bus
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {calculation.totalAvailablePowerKW}{' '}
            <span className="text-xs font-normal text-slate-400">kW Available</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Demand:</span>
            <span className="font-bold text-white">{calculation.totalLoadKW} kW</span>
          </div>

          <div
            className={`w-full py-1 px-2 rounded text-xs font-mono font-bold ${
              isDeficit
                ? 'bg-red-950/80 text-red-300 border border-red-800'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
            }`}
          >
            {isDeficit
              ? `Deficit: -${calculation.deficitKW} kW`
              : `Surplus: +${calculation.surplusKW} kW`}
          </div>
        </div>

        {/* RIGHT: Connected Hostel Buildings summary */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" /> 4 Hostels Connected
            </span>
            <span className="text-sky-300 font-bold">
              {calculation.totalLoadKW} kW
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {calculation.buildings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                <span className="text-slate-300 truncate">{b.name}</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    b.status === 'Powered'
                      ? 'text-emerald-400'
                      : b.status === 'Limited'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  <span className="text-[10px]">●</span> {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
