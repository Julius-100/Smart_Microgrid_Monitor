/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BuildingLoad } from '../types';
import { Building2, Zap, Sun, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface BuildingCardProps {
  building: BuildingLoad;
  onUpdateDemand?: (id: string, demandKW: number) => void;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({
  building,
  onUpdateDemand,
}) => {
  const getStatusColor = (status: BuildingLoad['status']) => {
    switch (status) {
      case 'Powered':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/40',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          badge: 'bg-emerald-950 text-emerald-300 border border-emerald-700',
        };
      case 'Limited':
        return {
          bg: 'bg-amber-950/40 border-amber-500/40',
          text: 'text-amber-400',
          dot: 'bg-amber-400',
          badge: 'bg-amber-950 text-amber-300 border border-amber-700',
        };
      case 'Disconnected':
        return {
          bg: 'bg-red-950/30 border-red-500/40',
          text: 'text-red-400',
          dot: 'bg-red-500',
          badge: 'bg-red-950 text-red-300 border border-red-700',
        };
    }
  };

  const colors = getStatusColor(building.status);

  return (
    <div
      className={`p-5 rounded-xl border transition-all duration-200 bg-slate-900 ${colors.bg} shadow-sm flex flex-col justify-between space-y-4`}
    >
      {/* Top: Building Name & Priority */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            {building.name}
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            Priority {building.priority} ({building.priority === 1 ? 'High / Essential' : building.priority === 4 ? 'Lowest' : 'Standard'})
          </span>
        </div>

        {/* Status indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${colors.badge}`}
        >
          <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
          <span>{building.status}</span>
        </div>
      </div>

      {/* Middle: Load & Power Numbers */}
      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-mono text-slate-400">Current Load:</span>
          <span className="text-2xl font-black font-mono text-white">
            {building.demandKW} <span className="text-sm font-normal text-slate-400">kW</span>
          </span>
        </div>

        {building.status === 'Limited' && (
          <div className="text-xs font-mono text-amber-300 pt-1 border-t border-slate-800 flex justify-between">
            <span>Power Supplied:</span>
            <strong>{building.allocatedKW} kW (Curtailed)</strong>
          </div>
        )}

        {building.status === 'Disconnected' && (
          <div className="text-xs font-mono text-red-300 pt-1 border-t border-slate-800">
            0 kW Supplied — Load Shed
          </div>
        )}
      </div>

      {/* Bottom: Power Source & Interactive Demand Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Assigned Power Source:</span>
          <span className="text-white font-bold flex items-center gap-1">
            {building.preferredSource === 'Grid' ? (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-yellow-400" />
            )}
            {building.preferredSource}
          </span>
        </div>

        {/* Interactive demand slider for student experiments */}
        {onUpdateDemand && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
              <span>Adjust Load Demand:</span>
              <span className="text-slate-300 font-bold">{building.demandKW} kW</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={building.demandKW}
              onChange={(e) => onUpdateDemand(building.id, Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};
