/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MicrogridState, PowerBalanceResult } from '../types/microgrid';
import { calculatePowerBalance } from '../engine/powerBalance';
import {
  HelpCircle,
  Play,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface WhatIfSandboxProps {
  currentState: MicrogridState;
  currentResult: PowerBalanceResult;
  onApplyScenario: (state: MicrogridState) => void;
}

export const WhatIfSandbox: React.FC<WhatIfSandboxProps> = ({
  currentState,
  currentResult,
  onApplyScenario,
}) => {
  // Sandbox state clones current state initially
  const [sandboxGridEnabled, setSandboxGridEnabled] = useState(currentState.gridEnabled);
  const [sandboxGridCapacity, setSandboxGridCapacity] = useState(currentState.gridCapacityKW);
  const [sandboxSolarKW, setSandboxSolarKW] = useState(currentState.solarGenerationKW);
  const [sandboxBatterySOC, setSandboxBatterySOC] = useState(currentState.batterySOC);

  const [sandboxLoads, setSandboxLoads] = useState(() =>
    currentState.loads.map((l) => ({ ...l }))
  );

  const [simulatedResult, setSimulatedResult] = useState<PowerBalanceResult | null>(null);
  const [explanation, setExplanation] = useState<string>('');

  const handleUpdateLoadDemand = (id: string, demandKW: number) => {
    setSandboxLoads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, demandKW } : l))
    );
  };

  const handleRunSimulation = () => {
    const sandboxState: MicrogridState = {
      ...currentState,
      gridEnabled: sandboxGridEnabled,
      gridCapacityKW: sandboxGridCapacity,
      solarGenerationKW: sandboxSolarKW,
      batterySOC: sandboxBatterySOC,
      loads: sandboxLoads,
    };

    const nextResult = calculatePowerBalance(sandboxState);
    setSimulatedResult(nextResult);

    // Generate comprehensive engineering explanation of BEFORE vs AFTER
    const directGenBefore = currentResult.gridAvailableKW + currentResult.solarAvailableKW;
    const directGenAfter = nextResult.gridAvailableKW + nextResult.solarAvailableKW;
    const genDelta = directGenAfter - directGenBefore;

    const demandBefore = currentResult.totalDemandRequestedKW;
    const demandAfter = nextResult.totalDemandRequestedKW;
    const demandDelta = demandAfter - demandBefore;

    const notes: string[] = [];

    if (genDelta !== 0) {
      notes.push(
        `Direct generation shifts from ${directGenBefore.toFixed(1)} kW to ${directGenAfter.toFixed(1)} kW (Δ ${genDelta >= 0 ? '+' : ''}${genDelta.toFixed(1)} kW).`
      );
    }

    if (!sandboxGridEnabled && currentState.gridEnabled) {
      notes.push(
        `Grid outage introduced: Breaker opened, islanding the microgrid onto solar and battery storage.`
      );
    } else if (sandboxGridEnabled && !currentState.gridEnabled) {
      notes.push(`Utility grid restored: Providing baseload synchronization.`);
    }

    if (demandDelta !== 0) {
      notes.push(
        `Total load request shifts from ${demandBefore} kW to ${demandAfter} kW (Δ ${demandDelta >= 0 ? '+' : ''}${demandDelta} kW).`
      );
    }

    if (nextResult.operatingMode === 'CRITICAL') {
      notes.push(
        `CRITICAL DEFICIT DETECTED: Remaining deficit of ${nextResult.deficitAfterSheddingKW.toFixed(1)} kW threatens the microgrid bus even after emergency load shedding.`
      );
    } else if (nextResult.shedLoads.length > currentResult.shedLoads.length) {
      const newlyShed = nextResult.shedLoads
        .filter((nl) => !currentResult.shedLoads.some((ol) => ol.id === nl.id))
        .map((l) => `${l.name} (${l.demandKW} kW, P${l.priority})`);
      notes.push(
        `Automated load shedding triggered: ${newlyShed.join(', ')} shed to preserve power balance.`
      );
    } else if (nextResult.shedLoads.length < currentResult.shedLoads.length) {
      notes.push(
        `Generation improved sufficiently to restore previously disconnected loads!`
      );
    } else if (nextResult.batteryState === 'CHARGING' && currentResult.batteryState !== 'CHARGING') {
      notes.push(
        `Generation excess identified: BESS transitions to charging at ${nextResult.batteryPowerKW.toFixed(1)} kW.`
      );
    } else if (nextResult.batteryState === 'DISCHARGING') {
      notes.push(
        `BESS delivers ${nextResult.batteryPowerKW.toFixed(1)} kW discharge to buffer load deficit.`
      );
    }

    if (notes.length === 0) {
      notes.push('Simulation parameters remain identical to current operational state.');
    }

    setExplanation(notes.join(' '));
  };

  const handleApplyToLive = () => {
    const sandboxState: MicrogridState = {
      ...currentState,
      gridEnabled: sandboxGridEnabled,
      gridCapacityKW: sandboxGridCapacity,
      solarGenerationKW: sandboxSolarKW,
      batterySOC: sandboxBatterySOC,
      loads: sandboxLoads,
    };
    onApplyScenario(sandboxState);
  };

  const handleResetToCurrent = () => {
    setSandboxGridEnabled(currentState.gridEnabled);
    setSandboxGridCapacity(currentState.gridCapacityKW);
    setSandboxSolarKW(currentState.solarGenerationKW);
    setSandboxBatterySOC(currentState.batterySOC);
    setSandboxLoads(currentState.loads.map((l) => ({ ...l })));
    setSimulatedResult(null);
    setExplanation('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-base font-bold uppercase tracking-wider font-mono text-white">
              WHAT-IF ANALYSIS & SCENARIO SANDBOX
            </h3>
            <p className="text-xs text-slate-400">
              Simulate microgrid behavior under hypothetical generation drops, grid outages, and load spikes before applying to live operations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sync with Live
          </button>
          <button
            onClick={handleRunSimulation}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950"
          >
            <Play className="w-3.5 h-3.5" /> RUN SIMULATION
          </button>
        </div>
      </div>

      {/* Inputs Sandbox Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Grid */}
        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold">Utility Grid</span>
            <button
              onClick={() => setSandboxGridEnabled(!sandboxGridEnabled)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                sandboxGridEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {sandboxGridEnabled ? 'AVAILABLE' : 'FAILED (0 kW)'}
            </button>
          </div>
          <div className="text-xs font-mono text-amber-300">
            Capacity: {sandboxGridEnabled ? `${sandboxGridCapacity} kW` : '0 kW'}
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            disabled={!sandboxGridEnabled}
            value={sandboxGridCapacity}
            onChange={(e) => setSandboxGridCapacity(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer disabled:opacity-30"
          />
        </div>

        {/* 2. Solar */}
        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold">Solar Generation</span>
            <span className="text-yellow-300 font-bold">{sandboxSolarKW} kW</span>
          </div>
          <input
            type="range"
            min="0"
            max="35"
            step="1"
            value={sandboxSolarKW}
            onChange={(e) => setSandboxSolarKW(Number(e.target.value))}
            className="w-full accent-yellow-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 kW</span>
            <span>15 kW</span>
            <span>35 kW</span>
          </div>
        </div>

        {/* 3. Battery SOC */}
        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold">Battery SOC</span>
            <span className="text-cyan-300 font-bold">{sandboxBatterySOC}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sandboxBatterySOC}
            onChange={(e) => setSandboxBatterySOC(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0%</span>
            <span>Reserve 20%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 4. Total Sandbox Demand preview */}
        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 flex flex-col justify-center">
          <div className="text-xs font-mono text-slate-400">Total Sandbox Demand:</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {sandboxLoads.reduce((sum, l) => sum + l.demandKW, 0)} kW
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Adjust individual load inputs below
          </div>
        </div>
      </div>

      {/* Individual Load Sliders for Sandbox */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {sandboxLoads.map((l) => (
          <div key={l.id} className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 truncate">{l.name}</span>
              <span className="text-emerald-400 font-bold">{l.demandKW} kW</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={l.demandKW}
              onChange={(e) => handleUpdateLoadDemand(l.id, Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* BEFORE vs AFTER Comparative Results */}
      {simulatedResult && (
        <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-sky-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold font-mono text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-sky-400" /> Comparative Impact: Before vs After
            </h4>
            <button
              onClick={handleApplyToLive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
            >
              <Zap className="w-3.5 h-3.5" /> Apply Scenario to Live System
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Direct Generation comparison */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Direct Generation (Grid + Solar)</div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-slate-500 text-[10px] block">BEFORE</span>
                  <span className="text-slate-300 font-bold">
                    {(currentResult.gridAvailableKW + currentResult.solarAvailableKW).toFixed(1)} kW
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div>
                  <span className="text-slate-500 text-[10px] block">AFTER</span>
                  <span className="text-sky-400 font-bold">
                    {(simulatedResult.gridAvailableKW + simulatedResult.solarAvailableKW).toFixed(1)} kW
                  </span>
                </div>
              </div>
            </div>

            {/* Battery Response comparison */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[11px]">BESS Battery Power</div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-slate-500 text-[10px] block">BEFORE</span>
                  <span className="text-slate-300 font-bold">
                    {currentResult.batteryState} ({currentResult.batteryPowerKW.toFixed(1)} kW)
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div>
                  <span className="text-slate-500 text-[10px] block">AFTER</span>
                  <span className="text-cyan-400 font-bold">
                    {simulatedResult.batteryState} ({simulatedResult.batteryPowerKW.toFixed(1)} kW)
                  </span>
                </div>
              </div>
            </div>

            {/* Shed Loads count */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Operating Mode & Load Shedding</div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-slate-500 text-[10px] block">BEFORE</span>
                  <span className="text-slate-300 font-bold">
                    {currentResult.operatingMode} ({currentResult.shedLoads.length} shed)
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div>
                  <span className="text-slate-500 text-[10px] block">AFTER</span>
                  <span
                    className={`font-bold ${
                      simulatedResult.operatingMode === 'CRITICAL'
                        ? 'text-red-400'
                        : simulatedResult.operatingMode === 'LOW-ENERGY'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {simulatedResult.operatingMode} ({simulatedResult.shedLoads.length} shed)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation narrative */}
          <div className="p-3 rounded bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
            <span className="text-sky-400 font-bold block mb-1">ENGINEERING CONSEQUENCE ANALYSIS:</span>
            {explanation}
          </div>
        </div>
      )}
    </div>
  );
};
