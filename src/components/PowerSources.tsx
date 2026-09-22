/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MicrogridSources, MicrogridCalculation } from '../types';
import { Zap, Sun, Gauge, ArrowUpRight } from 'lucide-react';

interface PowerSourcesProps {
  sources: MicrogridSources;
  calculation: MicrogridCalculation;
}

export const PowerSources: React.FC<PowerSourcesProps> = ({ sources, calculation }) => {
  const activeGridKW = sources.isGridOnline ? sources.gridPowerKW : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
            Power Sources
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          2 Active Generators
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Source 1: Utility Grid */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Grid
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                sources.isGridOnline
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {sources.isGridOnline ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono text-amber-300">
              {activeGridKW} <span className="text-sm font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs font-mono text-slate-400">Available</div>
          </div>
        </div>

        {/* Source 2: Solar/Inverter */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-yellow-400" /> Solar / Inverter
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-yellow-950 text-yellow-300 border border-yellow-800">
              SYNCHRONIZED
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono text-yellow-300">
              {sources.solarPowerKW} <span className="text-sm font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs font-mono text-slate-400">Available</div>
          </div>
        </div>

        {/* Total Available Power */}
        <div className="p-4 rounded-xl bg-slate-950 border-2 border-emerald-500/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Total Available
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              BUS SUPPLY
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono text-emerald-300">
              {calculation.totalAvailablePowerKW} <span className="text-sm font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Grid ({activeGridKW} kW) + Solar ({sources.solarPowerKW} kW)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
