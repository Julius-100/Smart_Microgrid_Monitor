/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Info className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
          How It Works
        </h3>
      </div>

      {/* Main explanation quote */}
      <blockquote className="p-4 rounded-lg bg-slate-950 border-l-4 border-sky-500 font-mono text-xs text-slate-300 leading-relaxed italic">
        «The system monitors available power from the grid and solar/inverter source. It compares this power with the demand from connected buildings. When available power is sufficient, the buildings remain powered. When generation falls below demand, the system identifies a power deficit and manages the available supply.»
      </blockquote>

      {/* Engineering Calculation Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-slate-400 font-bold">1. Available Power</div>
          <div className="text-emerald-400 font-bold">
            Total Available = Grid + Solar/Inverter
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Calculates active supply capacity in real time. If the grid trips, available power drops to solar capacity.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-slate-400 font-bold">2. Power Balance</div>
          <div className="text-sky-400 font-bold">
            Balance = Total Available - Total Load
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            When Balance ≥ 0 kW, status is <strong>SYSTEM STABLE</strong>. When Balance &lt; 0 kW, status is <strong>POWER DEFICIT</strong>.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-slate-400 font-bold">3. Priority Allocation</div>
          <div className="text-amber-400 font-bold">
            Moremi (P1) → Makama (P2) → Mariere (P3) → Eni Njoku (P4)
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            On power deficit, highest-priority loads are preserved first. Lower-priority buildings are curtailed or shed.
          </p>
        </div>
      </div>
    </div>
  );
};
