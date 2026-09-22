/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemEvent } from '../types/microgrid';
import {
  ListFilter,
  Trash2,
  Download,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Terminal,
} from 'lucide-react';

interface SystemEventLogProps {
  events: SystemEvent[];
  onClearEvents: () => void;
}

export const SystemEventLog: React.FC<SystemEventLogProps> = ({ events, onClearEvents }) => {
  const [filter, setFilter] = useState<'ALL' | 'ALERT' | 'WARNING' | 'INFO'>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.type === filter;
  });

  const getEventBadge = (type: SystemEvent['type']) => {
    switch (type) {
      case 'ALERT':
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-400" /> ALERT
          </span>
        );
      case 'WARNING':
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> WARN
          </span>
        );
      case 'ACTION':
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-sky-400" /> DISPATCH
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" /> INFO
          </span>
        );
    }
  };

  const handleExport = () => {
    const text = events.map((e) => `${e.timestamp} [${e.type}] ${e.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microgrid_scada_events_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
            SCADA Automation Event Log ({events.length})
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {/* Filters */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800">
            {(['ALL', 'ALERT', 'WARNING', 'INFO'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  filter === lvl ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            title="Download log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearEvents}
            className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events Stream Box */}
      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/90 max-h-[300px] overflow-y-auto space-y-2 font-mono text-xs scrollbar-thin">
        {filteredEvents.length === 0 ? (
          <div className="text-slate-500 py-6 text-center">No system events logged for current filter.</div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-2.5 py-1 px-1.5 rounded hover:bg-slate-900/60 transition-colors border-b border-slate-900 last:border-0"
            >
              <span className="text-[11px] text-slate-500 shrink-0 select-none">
                {evt.timestamp}
              </span>
              <div className="shrink-0">{getEventBadge(evt.type)}</div>
              <span
                className={`flex-1 leading-relaxed ${
                  evt.type === 'ALERT'
                    ? 'text-red-300 font-semibold'
                    : evt.type === 'WARNING'
                    ? 'text-amber-300'
                    : evt.type === 'ACTION'
                    ? 'text-sky-200'
                    : 'text-slate-300'
                }`}
              >
                {evt.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
