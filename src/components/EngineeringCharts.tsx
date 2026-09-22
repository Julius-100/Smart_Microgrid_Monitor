/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HistoryPoint, PowerBalanceResult } from '../types/microgrid';
import { BarChart3, TrendingUp, Battery, Sun, Activity } from 'lucide-react';

interface EngineeringChartsProps {
  history: HistoryPoint[];
  currentResult: PowerBalanceResult;
}

export const EngineeringCharts: React.FC<EngineeringChartsProps> = ({
  history,
  currentResult,
}) => {
  // Safe sample slice
  const recentHistory = history.slice(-14);

  // SVG dimensions for trend charts
  const width = 380;
  const height = 120;
  const padding = 20;

  // Max scale calculation for power
  const maxPower = Math.max(
    40,
    ...recentHistory.map((h) => Math.max(h.solarKW + h.gridKW + (h.batteryKW > 0 ? h.batteryKW : 0), h.demandKW))
  );

  // Helpers to calculate SVG paths
  const getX = (idx: number, len: number) => {
    if (len <= 1) return padding;
    return padding + (idx / (len - 1)) * (width - 2 * padding);
  };

  const getYPower = (val: number) => {
    return height - padding - (Math.min(maxPower, Math.max(0, val)) / maxPower) * (height - 2 * padding);
  };

  const getYSOC = (soc: number) => {
    return height - padding - (Math.min(100, Math.max(0, soc)) / 100) * (height - 2 * padding);
  };

  // Generation line points
  const genPoints = recentHistory
    .map((h, i) => `${getX(i, recentHistory.length)},${getYPower(h.solarKW + h.gridKW + (h.batteryKW > 0 ? h.batteryKW : 0))}`)
    .join(' ');

  // Demand line points
  const demandPoints = recentHistory
    .map((h, i) => `${getX(i, recentHistory.length)},${getYPower(h.demandKW)}`)
    .join(' ');

  // SOC points
  const socPoints = recentHistory
    .map((h, i) => `${getX(i, recentHistory.length)},${getYSOC(h.batterySOC)}`)
    .join(' ');

  // Solar points
  const solarPoints = recentHistory
    .map((h, i) => `${getX(i, recentHistory.length)},${getYPower(h.solarKW)}`)
    .join(' ');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
            SCADA Real-Time Engineering Telemetry Charts
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Rolling Buffer: {recentHistory.length} Telemetry Snapshots
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CHART 1: Generation vs Demand */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Gen vs Demand
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-emerald-400">● Gen</span>
              <span className="text-rose-400">● Demand</span>
            </div>
          </div>

          <div className="h-[120px] w-full flex items-center justify-center">
            {recentHistory.length > 1 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1={padding} y1={getYPower(20)} x2={width - padding} y2={getYPower(20)} stroke="#1e293b" strokeDasharray="2,2" />
                <line x1={padding} y1={getYPower(40)} x2={width - padding} y2={getYPower(40)} stroke="#1e293b" strokeDasharray="2,2" />

                {/* Generation line */}
                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={genPoints} />
                {/* Demand line */}
                <polyline fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,2" points={demandPoints} />
              </svg>
            ) : (
              <div className="text-slate-600 text-xs font-mono">Acquiring samples...</div>
            )}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span>Gen: <strong className="text-emerald-400">{currentResult.totalGenerationAvailableKW.toFixed(1)} kW</strong></span>
            <span>Load: <strong className="text-rose-400">{currentResult.totalDemandRequestedKW} kW</strong></span>
          </div>
        </div>

        {/* CHART 2: Battery SOC History */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-cyan-400" /> Battery SOC (%)
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {currentResult.batterySOC.toFixed(1)}%
            </span>
          </div>

          <div className="h-[120px] w-full flex items-center justify-center">
            {recentHistory.length > 1 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* 20% Min SOC Red Reserve Threshold Line */}
                <line
                  x1={padding}
                  y1={getYSOC(currentResult.minSOC)}
                  x2={width - padding}
                  y2={getYSOC(currentResult.minSOC)}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                />
                <text x={padding + 2} y={getYSOC(currentResult.minSOC) - 3} fill="#ef4444" fontSize="8" fontFamily="monospace">
                  Min Reserve {currentResult.minSOC}%
                </text>

                {/* SOC Polyline */}
                <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" points={socPoints} />
              </svg>
            ) : (
              <div className="text-slate-600 text-xs font-mono">Acquiring samples...</div>
            )}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span>Status: <strong className="text-slate-200">{currentResult.batteryState}</strong></span>
            <span>Power: <strong className="text-cyan-400">{currentResult.batteryPowerKW.toFixed(1)} kW</strong></span>
          </div>
        </div>

        {/* CHART 3: Solar Generation Timeline */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-yellow-400" /> Solar PV Output
            </span>
            <span className="text-[10px] font-mono text-yellow-400 font-bold">
              {currentResult.solarSuppliedKW.toFixed(1)} kW
            </span>
          </div>

          <div className="h-[120px] w-full flex items-center justify-center">
            {recentHistory.length > 1 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <polyline fill="none" stroke="#eab308" strokeWidth="2.5" points={solarPoints} />
              </svg>
            ) : (
              <div className="text-slate-600 text-xs font-mono">Acquiring samples...</div>
            )}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span>Peak Capacity: 35 kWp</span>
            <span className="text-yellow-400 font-bold">{currentResult.solarAvailableKW} kW Available</span>
          </div>
        </div>

        {/* CHART 4: Active Load Consumption Breakdown */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" /> Load Distribution
            </span>
            <span className="text-[10px] font-mono text-sky-400 font-bold">
              {currentResult.totalActiveLoadKW.toFixed(1)} kW Active
            </span>
          </div>

          {/* Stacked bar breakdown */}
          <div className="h-[120px] flex flex-col justify-center space-y-1.5">
            {currentResult.loadDecisions.map((dec) => {
              const maxL = 15;
              const pct = Math.min(100, (dec.demandKW / maxL) * 100);
              return (
                <div key={dec.loadId} className="space-y-0.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className={dec.status === 'SHED' ? 'text-red-400 line-through' : 'text-slate-300'}>
                      {dec.name.split(' ')[0]}
                    </span>
                    <span className={dec.status === 'SHED' ? 'text-red-500 font-bold' : 'text-emerald-400'}>
                      {dec.status === 'SHED' ? 'SHED' : `${dec.demandKW} kW`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        dec.status === 'SHED' ? 'bg-red-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span>P1 Essential: Protected</span>
            <span className={currentResult.shedLoads.length > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {currentResult.shedLoads.length} Loads Shed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
