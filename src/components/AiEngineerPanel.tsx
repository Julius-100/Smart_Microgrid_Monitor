/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MicrogridState, PowerBalanceResult } from '../types/microgrid';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Cpu,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface AiEngineerPanelProps {
  state: MicrogridState;
  result: PowerBalanceResult;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  'Why was the workshop disconnected?',
  'What happens if solar falls to 5 kW?',
  'Can the battery supply all the loads?',
  'Why is the battery discharging?',
  'What should happen during a grid outage?',
  'Which load has the lowest priority?',
  'What happens if the hostel demand increases by 10 kW?',
];

export const AiEngineerPanel: React.FC<AiEngineerPanelProps> = ({ state, result }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: `Control Room SCADA AI online. I am observing the live microgrid telemetry (Grid: ${state.gridEnabled ? state.gridCapacityKW : 0} kW, Solar: ${result.solarSuppliedKW.toFixed(1)} kW, BESS: ${result.batterySOC.toFixed(1)}% SOC, Demand: ${result.totalActiveLoadKW.toFixed(1)} kW). Ask me any operational or engineering question regarding load shedding, storage dispatch, or system stability.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, calculation: result }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.analysis) {
        setAnalysisText(data.analysis);
      } else if (data.summary) {
        // Structured fallback
        setAnalysisText(
          `### System Condition Summary\n${data.summary}\n\n### Power Balance & Flow Breakdown\n${data.powerBalanceReview}\n\n### Load Shedding Assessment\n${data.loadRecommendations}\n\n### Battery Dispatch & Storage\n${data.batteryStrategy}\n\n### Engineering Recommendations\n${data.engineeringRationale}`
        );
      }
    } catch (err: any) {
      console.error('Failed to run AI analysis:', err);
      setAnalysisError(err.message || 'Unable to connect to AI Energy Engineer service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run analysis on mount or when requested
  useEffect(() => {
    fetchAnalysis();
  }, []); // Run once on initial load

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          state,
          calculation: result,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response from engineer model.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat inquiry failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `[Telemetry Offline Error]: ${err.message}. Please check connection or retry.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
      {/* Panel Navigation & Header */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                AI ENERGY ENGINEER
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                GEMINI 3.8 FLASH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Power Systems Reasoning & Conversational SCADA Assistant
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'analysis'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Assessment
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'chat'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Command Inquiries ({messages.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 min-h-[420px] flex flex-col">
        {activeTab === 'analysis' ? (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Live State Summary Bar */}
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span>
                  Mode: <strong className="text-emerald-400">{result.operatingMode}</strong>
                </span>
                <span>
                  Net Balance:{' '}
                  <strong className={result.netSurplusKW >= 0 ? 'text-emerald-300' : 'text-red-400'}>
                    {result.netSurplusKW >= 0 ? '+' : ''}{result.netSurplusKW.toFixed(1)} kW
                  </strong>
                </span>
                <span>
                  Shed Loads:{' '}
                  <strong className={result.shedLoads.length > 0 ? 'text-red-400' : 'text-slate-300'}>
                    {result.shedLoads.length}
                  </strong>
                </span>
              </div>
              <button
                onClick={fetchAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800 text-xs font-mono transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing State...' : 'Re-Evaluate Live State'}
              </button>
            </div>

            {/* Analysis Output display */}
            <div className="flex-1 p-4 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-200 leading-relaxed overflow-y-auto max-h-[480px] space-y-3">
              {isAnalyzing && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Cpu className="w-8 h-8 text-sky-400 mx-auto animate-pulse" />
                  <p>AI Energy Engineer analyzing telemetry & power conservation constraints...</p>
                </div>
              )}

              {analysisError && (
                <div className="p-3 rounded bg-red-950/60 border border-red-900 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                  {analysisError}
                </div>
              )}

              {!isAnalyzing && !analysisError && analysisText && (
                <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                  {analysisText}
                </div>
              )}
            </div>

            {/* Microgrid Decision Log footnote */}
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Verified with thermodynamic power balance engine</span>
              <span className="text-emerald-400">P1 Essential Protected</span>
            </div>
          </div>
        ) : (
          /* CONVERSATIONAL COMMAND PANEL */
          <div className="flex-1 flex flex-col justify-between space-y-3">
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-sky-400" /> Inquiries:
              </span>
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isChatLoading}
                  className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-950/80 hover:bg-slate-800 text-sky-300 hover:text-sky-200 border border-slate-800 hover:border-sky-700 whitespace-nowrap shrink-0 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat History Box */}
            <div className="flex-1 p-4 rounded-lg bg-slate-950 border border-slate-800/90 overflow-y-auto max-h-[380px] space-y-3 font-mono text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 mb-0.5 px-1">
                    {m.role === 'user' ? 'OPERATOR' : 'AI ENERGY ENGINEER'} • {m.timestamp}
                  </div>
                  <div
                    className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                  <Bot className="w-4 h-4 text-sky-400 animate-spin" />
                  <span>Engineer calculating power flows and formulating response...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask SCADA AI: e.g. 'Why was the workshop disconnected?' or 'What happens if solar drops?'"
                disabled={isChatLoading}
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs font-mono px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isChatLoading}
                className="px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
