/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  INITIAL_BUILDINGS,
  INITIAL_SOURCES,
  calculateMicrogrid,
} from './engine/microgridLogic';
import { MicrogridSources, BuildingLoad, TelemetryPoint } from './types';
import { Header } from './components/Header';
import { PowerSources } from './components/PowerSources';
import { PowerFlow } from './components/PowerFlow';
import { BuildingCard } from './components/BuildingCard';
import { SimulationControls } from './components/SimulationControls';
import { MotionGraph } from './components/MotionGraph';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Activity,
  LineChart,
} from 'lucide-react';

export default function App() {
  // 1. Where power sources are defined
  const [sources, setSources] = useState<MicrogridSources>(INITIAL_SOURCES);

  // 2. Where building loads are defined
  const [buildings, setBuildings] = useState<BuildingLoad[]>(INITIAL_BUILDINGS);

  // Active scenario identifier for UI feedback
  const [activeScenario, setActiveScenario] = useState<string>('normal');

  // Live changing values state (enabled by default)
  const [isLive, setIsLive] = useState<boolean>(true);

  // Motion Graph visibility
  const [showMotionGraph, setShowMotionGraph] = useState<boolean>(true);

  // Telemetry buffer for motion graph
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // Tick counter for sinusoidal fluctuations
  const tickRef = useRef<number>(0);

  // 3. How total power, load, and status are calculated (pure application logic)
  const calculation = useMemo(() => {
    return calculateMicrogrid(sources, buildings);
  }, [sources, buildings]);

  // Record initial telemetry point
  useEffect(() => {
    const initialPoint: TelemetryPoint = {
      id: `pt-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      availableKW: calculation.totalAvailablePowerKW,
      demandKW: calculation.totalLoadKW,
      gridKW: sources.isGridOnline ? sources.gridPowerKW : 0,
      solarKW: sources.solarPowerKW,
      balanceKW: calculation.powerBalanceKW,
      isDeficit: calculation.isDeficit,
    };
    setTelemetryHistory([initialPoint]);
  }, []);

  // 4. Live changing values continuous ticker
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;

      // Realistic electrical fluctuations:
      const solarDelta = Number((Math.sin(t * 0.25) * 0.8 + (Math.random() - 0.5) * 0.4).toFixed(1));
      const gridDelta = Number(((Math.random() - 0.5) * 0.6).toFixed(1));

      // Update sources with live drift
      setSources((prev) => {
        const nextSolar = Math.max(0, Number((prev.solarPowerKW + solarDelta * 0.2).toFixed(1)));
        const nextGrid = prev.isGridOnline
          ? Math.max(0, Number((prev.gridPowerKW + gridDelta * 0.15).toFixed(1)))
          : 0;

        return {
          ...prev,
          solarPowerKW: nextSolar,
          gridPowerKW: prev.isGridOnline ? nextGrid : 0,
        };
      });

      // Periodic load change in hostel buildings
      if (t % 3 === 0) {
        setBuildings((prev) => {
          const randomIndex = Math.floor(Math.random() * prev.length);
          const target = prev[randomIndex];
          const loadJitter = (Math.random() - 0.5) * 1.0;
          const newDemand = Math.max(5, Math.min(24, Number((target.demandKW + loadJitter).toFixed(1))));

          return prev.map((b, i) => (i === randomIndex ? { ...b, demandKW: newDemand } : b));
        });
      }

      // Append new sample point to motion graph buffer
      setTelemetryHistory((prev) => {
        const newPoint: TelemetryPoint = {
          id: `pt-${Date.now()}-${t}`,
          time: new Date().toLocaleTimeString(),
          availableKW: calculation.totalAvailablePowerKW,
          demandKW: calculation.totalLoadKW,
          gridKW: sources.isGridOnline ? sources.gridPowerKW : 0,
          solarKW: sources.solarPowerKW,
          balanceKW: calculation.powerBalanceKW,
          isDeficit: calculation.isDeficit,
        };
        return [...prev, newPoint].slice(-40);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isLive, calculation, sources.isGridOnline, sources.gridPowerKW, sources.solarPowerKW]);

  // Simulation scenario trigger handler
  const handleTriggerScenario = (scenario: 'normal' | 'grid-outage' | 'solar-reduced' | 'restore') => {
    setActiveScenario(scenario);

    switch (scenario) {
      case 'normal':
      case 'restore':
        setSources({
          gridPowerKW: 34.5,
          isGridOnline: true,
          solarPowerKW: 23.0,
        });
        setBuildings(INITIAL_BUILDINGS.map((b) => ({ ...b })));
        break;

      case 'grid-outage':
        setSources((prev) => ({
          ...prev,
          gridPowerKW: 0,
          isGridOnline: false,
          solarPowerKW: 23.0,
        }));
        break;

      case 'solar-reduced':
        setSources((prev) => ({
          ...prev,
          gridPowerKW: 34.5,
          isGridOnline: true,
          solarPowerKW: 5.0,
        }));
        break;
    }
  };

  // Simulate a live transient wave
  const handleTriggerTransient = () => {
    setActiveScenario('transient');
    setSources((prev) => ({
      ...prev,
      solarPowerKW: Math.max(2, Number((prev.solarPowerKW - 7.5).toFixed(1))),
    }));
    setBuildings((prev) =>
      prev.map((b) => (b.id === 'makama' ? { ...b, demandKW: b.demandKW + 4 } : b))
    );
  };

  const handleUpdateSources = (updates: Partial<MicrogridSources>) => {
    setActiveScenario('custom');
    setSources((prev) => ({ ...prev, ...updates }));
  };

  const handleUpdateBuildingDemand = (id: string, demandKW: number) => {
    setActiveScenario('custom');
    setBuildings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, demandKW } : b))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30">
      {/* Top SCADA Header */}
      <Header
        calculation={calculation}
        isLive={isLive}
        onToggleLive={() => setIsLive(!isLive)}
        showMotionGraph={showMotionGraph}
        onToggleMotionGraph={() => setShowMotionGraph(!showMotionGraph)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Power Deficit / Surplus Status Banner */}
        {calculation.isDeficit ? (
          <div className="p-4 rounded-xl bg-red-950/80 border-2 border-red-500/80 shadow-lg text-red-200 font-mono text-xs sm:text-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-900/60 border border-red-700 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-red-100 text-sm sm:text-base font-bold">
                  POWER DEFICIT DETECTED: -{calculation.deficitKW} kW
                </strong>
                <span className="text-red-300 text-xs">
                  Available Generation: <strong>{calculation.totalAvailablePowerKW} kW</strong> | Total Demand: <strong>{calculation.totalLoadKW} kW</strong> | Net Deficit: <strong>{calculation.deficitKW} kW</strong>
                </span>
              </div>
            </div>
            <div className="text-[11px] bg-red-900/40 px-3 py-1.5 rounded border border-red-800/80 font-bold text-red-200">
              PRIORITIZED LOAD SHEDDING ACTIVE
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 font-mono text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>SYSTEM STABLE:</strong> Generation ({calculation.totalAvailablePowerKW} kW) exceeds total demand ({calculation.totalLoadKW} kW). Surplus: +{calculation.surplusKW} kW.
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline">
              All 4 Feeders Energized (100%)
            </span>
          </div>
        )}

        {/* Real-time Motion Graph Bar */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-white flex items-center gap-2">
                Real-Time Motion Waveform Telemetry
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isLive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isLive ? 'LIVE TELEMETRY STREAM' : 'STREAM PAUSED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous dynamic tracking of generation curve vs aggregate feeder load
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMotionGraph(!showMotionGraph)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 transition-all"
            >
              <LineChart className="w-4 h-4" />
              <span>{showMotionGraph ? 'Hide Motion Graph' : 'Generate Motion Graph'}</span>
            </button>
          </div>
        </div>

        {/* Motion Graph */}
        {showMotionGraph && (
          <MotionGraph
            telemetryHistory={telemetryHistory}
            calculation={calculation}
            isLive={isLive}
            onToggleLive={() => setIsLive(!isLive)}
            onClearHistory={() => setTelemetryHistory([])}
            onTriggerTransient={handleTriggerTransient}
            onClose={() => setShowMotionGraph(false)}
          />
        )}

        {/* Section 1: Power Sources */}
        <PowerSources sources={sources} calculation={calculation} />

        {/* Section 2: Building Loads */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Building Loads ({calculation.buildings.length} Hostels)
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Total Demand: <strong className="text-white">{calculation.totalLoadKW} kW</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {calculation.buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                onUpdateDemand={handleUpdateBuildingDemand}
              />
            ))}
          </div>
        </div>

        {/* Section 3: Single-Line Power Flow */}
        <PowerFlow sources={sources} calculation={calculation} />

        {/* Section 4: Feeder Controls */}
        <SimulationControls
          sources={sources}
          onUpdateSources={handleUpdateSources}
          onTriggerScenario={handleTriggerScenario}
          activeScenario={activeScenario}
        />
      </main>

      {/* Professional SCADA Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Smart Microgrid Supervisory Control & Data Acquisition (SCADA)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Feeder Bus: 415V / 50Hz</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">Telemetry Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
