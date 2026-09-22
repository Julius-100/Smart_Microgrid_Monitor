/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MicrogridCalculation } from '../types';
import {
  Activity,
  ShieldCheck,
  AlertOctagon,
  Zap,
  Play,
  Pause,
  LineChart,
  Github,
} from 'lucide-react';

interface HeaderProps {
  calculation: MicrogridCalculation;
  isLive: boolean;
  onToggleLive: () => void;
  showMotionGraph: boolean;
  onToggleMotionGraph: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  calculation,
  isLive,
  onToggleLive,
  showMotionGraph,
  onToggleMotionGraph,
  onOpenExport,
}) => {
  const isDeficit = calculation.isDeficit;

  return (
    <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
              Smart Microgrid Monitor
            </h1>
            <p className="text-xs text-slate-400">
              Small-Scale Electrical Microgrid Distribution & Load Balancer
            </p>
          </div>
        </div>

        {/* Live Controls, Motion Graph Button & System Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Live Feed Toggle Button */}
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              isLive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={isLive ? 'Pause live automated fluctuating values' : 'Start live automated fluctuating values'}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            {isLive ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-slate-400" />}
            <span>{isLive ? 'LIVE FEED' : 'PAUSED'}</span>
          </button>

          {/* Prominent "Generate Motion Graph" Button */}
          <button
            onClick={onToggleMotionGraph}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              showMotionGraph
                ? 'bg-emerald-600 text-white border border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/50 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showMotionGraph ? 'Hide Motion Graph' : 'Generate Motion Graph'}</span>
          </button>

          {/* GitHub Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-sm"
            title="Export repository to GitHub with no restrictions"
          >
            <Github className="w-3.5 h-3.5 text-slate-300" />
            <span>Export Repo</span>
          </button>

          {/* Real-time power balance pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400">Balance:</span>
            <span
              className={`font-bold ${
                isDeficit ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isDeficit
                ? `-${calculation.deficitKW} kW`
                : `+${calculation.surplusKW} kW`}
            </span>
          </div>

          {/* Prominent System Status Badge */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-black tracking-wider uppercase border transition-all ${
              isDeficit
                ? 'bg-red-950 text-red-300 border-red-700 shadow-sm shadow-red-950 animate-pulse'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm shadow-emerald-950'
            }`}
          >
            {isDeficit ? (
              <AlertOctagon className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{calculation.systemStatusText}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
