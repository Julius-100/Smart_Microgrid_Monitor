/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TelemetryPoint, MicrogridCalculation } from '../types';
import {
  Activity,
  X,
  Play,
  Pause,
  Trash2,
  TrendingUp,
  Sparkles,
  Zap,
  Sun,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface MotionGraphProps {
  telemetryHistory: TelemetryPoint[];
  calculation: MicrogridCalculation;
  isLive: boolean;
  onToggleLive: () => void;
  onClearHistory: () => void;
  onTriggerTransient: () => void;
  onClose?: () => void;
}

export const MotionGraph: React.FC<MotionGraphProps> = ({
  telemetryHistory,
  calculation,
  isLive,
  onToggleLive,
  onClearHistory,
  onTriggerTransient,
  onClose,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // Take the most recent 25 points for crisp viewport scaling
  const points = telemetryHistory.slice(-25);

  const width = 800;
  const height = 260;
  const paddingX = 45;
  const paddingY = 30;

  // Maximum scale calculation
  const maxKW = Math.max(
    65,
    ...points.map((p) => Math.max(p.availableKW, p.demandKW))
  );

  const getX = (index: number, total: number) => {
    if (total <= 1) return paddingX;
    return paddingX + (index / (total - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxKW, val));
    return height - paddingY - (clamped / maxKW) * (height - 2 * paddingY);
  };

  // Generate SVG path strings
  const availablePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, points.length).toFixed(1)} ${getY(p.availableKW).toFixed(1)}`)
    .join(' ');

  const demandPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, points.length).toFixed(1)} ${getY(p.demandKW).toFixed(1)}`)
    .join(' ');

  const solarPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, points.length).toFixed(1)} ${getY(p.solarKW).toFixed(1)}`)
    .join(' ');

  // Gradient area underneath Available curve
  const areaAvailablePath = points.length > 1
    ? `${availablePath} L ${getX(points.length - 1, points.length).toFixed(1)} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`
    : '';

  const lastPoint = points[points.length - 1];
  const lastX = points.length > 0 ? getX(points.length - 1, points.length) : paddingX;
  const lastAvailableY = lastPoint ? getY(lastPoint.availableKW) : getY(0);
  const lastDemandY = lastPoint ? getY(lastPoint.demandKW) : getY(0);

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-xl p-5 shadow-2xl space-y-4 relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Real-Time Microgrid Motion Telemetry Graph
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isLive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {isLive ? 'MOTION STREAM LIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live oscilloscope motion curve comparing Available Generation vs Total Campus Demand
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Transient Shock wave button */}
          <button
            onClick={onTriggerTransient}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all shadow-sm"
            title="Simulate a transient load surge or solar dip"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Transient Wave</span>
          </button>

          {/* Pause / Play Live Stream */}
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              isLive
                ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? 'Pause Stream' : 'Resume'}</span>
          </button>

          {/* Clear History */}
          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-slate-700 transition-colors"
            title="Reset telemetry buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close button if modal/expandable */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close motion graph"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Metric Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">AVAILABLE (GEN)</span>
          <span className="text-emerald-400 font-bold text-base">
            {calculation.totalAvailablePowerKW} <span className="text-xs font-normal text-slate-500">kW</span>
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">TOTAL DEMAND</span>
          <span className="text-sky-400 font-bold text-base">
            {calculation.totalLoadKW} <span className="text-xs font-normal text-slate-500">kW</span>
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">POWER BALANCE</span>
          <span className={`font-bold text-base ${calculation.isDeficit ? 'text-red-400' : 'text-emerald-400'}`}>
            {calculation.powerBalanceKW > 0 ? `+${calculation.powerBalanceKW}` : calculation.powerBalanceKW} <span className="text-xs font-normal text-slate-500">kW</span>
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">BUFFER SAMPLES</span>
          <span className="text-white font-bold text-base">
            {points.length} <span className="text-xs font-normal text-slate-500">ticks</span>
          </span>
        </div>
      </div>

      {/* Real-time SVG Canvas Motion Graph */}
      <div className="relative w-full h-[260px] bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-hidden shadow-inner">
        {points.length < 2 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs space-y-2">
            <Activity className="w-6 h-6 text-emerald-400 animate-spin" />
            <p>Collecting initial telemetry samples for motion waveform...</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible select-none"
            onMouseLeave={() => {
              setHoveredPoint(null);
              setHoverCoords(null);
            }}
          >
            <defs>
              {/* Emerald Available Power Area Gradient */}
              <linearGradient id="availableGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Grid pattern */}
              <pattern id="graphGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Background grid */}
            <rect x={paddingX} y={paddingY} width={width - 2 * paddingX} height={height - 2 * paddingY} fill="url(#graphGrid)" />

            {/* Horizontal Reference Lines */}
            {[20, 40, 60].map((kw) => (
              <g key={kw}>
                <line
                  x1={paddingX}
                  y1={getY(kw)}
                  x2={width - paddingX}
                  y2={getY(kw)}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="3,3"
                />
                <text
                  x={paddingX - 8}
                  y={getY(kw) + 3}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {kw} kW
                </text>
              </g>
            ))}

            {/* Baseline 0 kW */}
            <line
              x1={paddingX}
              y1={height - paddingY}
              x2={width - paddingX}
              y2={height - paddingY}
              stroke="#475569"
              strokeWidth="1.2"
            />
            <text
              x={paddingX - 8}
              y={height - paddingY + 3}
              fill="#64748b"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
            >
              0 kW
            </text>

            {/* Gradient Area under Available Generation */}
            {areaAvailablePath && (
              <path d={areaAvailablePath} fill="url(#availableGrad)" />
            )}

            {/* Solar Generation Curve (Yellow dotted) */}
            <path
              d={solarPath}
              fill="none"
              stroke="#eab308"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              className="transition-all duration-300"
            />

            {/* Available Generation Curve (Emerald solid) */}
            <path
              d={availablePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              className="transition-all duration-300"
            />

            {/* Total Demand Curve (Rose/Sky dashed) */}
            <path
              d={demandPath}
              fill="none"
              stroke={calculation.isDeficit ? '#f43f5e' : '#38bdf8'}
              strokeWidth="2.2"
              strokeDasharray="5,3"
              className="transition-all duration-300"
            />

            {/* Live Pulsing Leading Dots */}
            {lastPoint && (
              <>
                {/* Available power leading dot */}
                <circle
                  cx={lastX}
                  cy={lastAvailableY}
                  r="5"
                  fill="#10b981"
                  className="animate-pulse"
                />
                <circle
                  cx={lastX}
                  cy={lastAvailableY}
                  r="9"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  opacity="0.6"
                  className="animate-ping"
                />

                {/* Demand leading dot */}
                <circle
                  cx={lastX}
                  cy={lastDemandY}
                  r="4"
                  fill={calculation.isDeficit ? '#f43f5e' : '#38bdf8'}
                />
              </>
            )}

            {/* Interactive invisible hover columns */}
            {points.map((p, idx) => {
              const xPos = getX(idx, points.length);
              const colWidth = (width - 2 * paddingX) / points.length;
              return (
                <rect
                  key={p.id}
                  x={xPos - colWidth / 2}
                  y={paddingY}
                  width={colWidth}
                  height={height - 2 * paddingY}
                  fill="transparent"
                  className="cursor-crosshair hover:fill-slate-800/30"
                  onMouseEnter={() => {
                    setHoveredPoint(p);
                    setHoverCoords({ x: xPos, y: getY(p.availableKW) });
                  }}
                />
              );
            })}

            {/* Hover Crosshair line */}
            {hoverCoords && (
              <line
                x1={hoverCoords.x}
                y1={paddingY}
                x2={hoverCoords.x}
                y2={height - paddingY}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            )}
          </svg>
        )}

        {/* Hover Floating Tooltip */}
        {hoveredPoint && hoverCoords && (
          <div
            className="absolute z-20 pointer-events-none p-2.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl font-mono text-[11px] text-slate-200 space-y-1 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoverCoords.x / width) * 100}%`,
              top: `${Math.max(10, (hoverCoords.y / height) * 100 - 15)}%`,
            }}
          >
            <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
              {hoveredPoint.time}
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-emerald-400">Available:</span>
              <strong>{hoveredPoint.availableKW} kW</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-sky-400">Demand:</span>
              <strong>{hoveredPoint.demandKW} kW</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-amber-400">Grid:</span>
              <strong>{hoveredPoint.gridKW} kW</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-yellow-400">Solar:</span>
              <strong>{hoveredPoint.solarKW} kW</strong>
            </div>
            <div className="pt-1 border-t border-slate-800 text-[10px] flex items-center gap-1">
              {hoveredPoint.isDeficit ? (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Deficit (-{Math.abs(hoveredPoint.balanceKW)} kW)
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Stable (+{hoveredPoint.balanceKW} kW)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Frequency Readout */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-1 text-slate-400 gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-400 rounded-full" />
            <strong className="text-emerald-300">Available Generation</strong> (Grid + Solar)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-sky-400 rounded-full border-dashed" />
            <strong className="text-sky-300">Total Demand</strong> (Hostels)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-yellow-400 rounded-full" />
            <strong className="text-yellow-300">Solar PV</strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-500">
          Sampling interval: <strong>1.5 seconds</strong> • Dynamic power balancing
        </div>
      </div>
    </div>
  );
};
