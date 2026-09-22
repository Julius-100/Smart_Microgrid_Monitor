/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Github,
  Download,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  FolderGit2,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [repoName, setRepoName] = useState<string>('smart-microgrid-monitor');
  const [username, setUsername] = useState<string>('your-username');

  if (!isOpen) return null;

  const gitCommands = `# 1. Initialize git repository & rename main branch
git init
git branch -M main

# 2. Stage and commit all source code
git add .
git commit -m "feat: initial commit of Smart Microgrid Monitor"

# 3. Add your remote GitHub repository
git remote add origin https://github.com/${username.trim() || 'your-username'}/${repoName.trim() || 'smart-microgrid-monitor'}.git

# 4. Push code with zero restrictions
git push -u origin main`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                Export to GitHub Repository
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  NO RESTRICTIONS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                100% open-source under MIT License. Clone, push, fork, or deploy anywhere.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 font-mono text-xs text-slate-300">
          {/* Option 1: Direct Download Source Archive */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Option A: Download Clean Tarball Archive
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Downloads a complete <code className="text-emerald-300">.tar.gz</code> archive containing all TypeScript files, components, styles, and configs.
                </p>
              </div>

              <a
                href="/api/export-archive"
                download="smart-microgrid-monitor.tar.gz"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Download Archive</span>
              </a>
            </div>
          </div>

          {/* Option 2: Push to GitHub */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-sky-400" />
              Option B: Push Directly to GitHub
            </h4>

            {/* Custom URL inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  GitHub Username:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-username"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Repository Name:
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="smart-microgrid-monitor"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Terminal Command Box */}
            <div className="relative rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Terminal Commands
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 text-[11px] leading-relaxed text-emerald-300 overflow-x-auto whitespace-pre font-mono">
                {gitCommands}
              </pre>
            </div>
          </div>

          {/* Verification Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>MIT License — zero restrictions</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Standard React + TypeScript</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pre-configured .gitignore</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Smart Microgrid Monitor • Open Source Distribution
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
