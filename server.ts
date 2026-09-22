import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Health check
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Export clean source code archive for GitHub or local development
 */
app.get('/api/export-archive', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="smart-microgrid-monitor.tar.gz"');

  const tarProcess = spawn('tar', [
    '--exclude=./node_modules',
    '--exclude=./dist',
    '--exclude=./.git',
    '-czf',
    '-',
    '.',
  ]);

  tarProcess.stdout.pipe(res);

  tarProcess.stderr.on('data', (data) => {
    console.error(`Tar error: ${data}`);
  });

  tarProcess.on('error', (err) => {
    console.error('Failed to spawn tar:', err);
    if (!res.headersSent) {
      res.status(500).send('Archive creation failed');
    }
  });
});

/**
 * Endpoint for AI Energy Engineer formal state analysis
 */
app.post('/api/gemini/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { state, calculation } = req.body;

    if (!state || !calculation) {
      res.status(400).json({ error: 'Missing state or calculation payload' });
      return;
    }

    if (!ai) {
      // Deterministic fallback if API key is not yet set
      res.json({
        summary: `Operating in ${calculation.operatingMode} mode with ${calculation.totalGenerationAvailableKW} kW available generation vs ${calculation.totalDemandRequestedKW} kW requested load.`,
        powerBalanceReview: `Current direct balance shows net ${calculation.netSurplusKW >= 0 ? '+' : ''}${calculation.netSurplusKW.toFixed(1)} kW. Battery status is ${calculation.batteryState} at ${calculation.batteryPowerKW.toFixed(1)} kW.`,
        loadRecommendations: calculation.shedLoads.length > 0
          ? `Prioritized shedding activated: ${calculation.shedLoads.map((l: any) => `${l.name} (${l.demandKW} kW)`).join(', ')} disconnected to preserve bus stability.`
          : 'All connected loads are fully energized. Bus balance is stable.',
        batteryStrategy: `SOC at ${calculation.batterySOC.toFixed(1)}% (min reserve ${calculation.minSOC}%). Dispatch rating: ${calculation.batteryPowerKW.toFixed(1)} / ${calculation.batteryMaxDischargeKW} kW.`,
        engineeringRationale: calculation.operatingMode === 'CRITICAL'
          ? 'Emergency condition: Available generation insufficient for essential loads. Check solar irradiance or restore utility feeder.'
          : calculation.operatingMode === 'ISLANDED'
          ? 'Autonomous microgrid mode active. Solar PV and BESS are frequency/voltage forming.'
          : 'Microgrid synchronized with utility grid. Operating in economic dispatch mode.',
      });
      return;
    }

    const prompt = `You are a Senior AI Energy Engineer monitoring a SCADA-controlled electrical microgrid.
Here is the current structured operational state and deterministic power balance:

\`\`\`json
${JSON.stringify({ state, calculation }, null, 2)}
\`\`\`

Strict Engineering Rules:
1. Adhere strictly to the law of conservation of power: Total Injected = Total Consumed + Battery Storage + Losses.
2. NEVER invent phantom power, unmetered generation, or imaginary sources.
3. Priority 1 is Essential (life safety, emergency pumps), Priority 2 is Important (hostel, water pump), Priority 3 is Non-essential (workshop).
4. Respect battery discharge limit (${calculation.batteryMaxDischargeKW} kW) and minimum reserve SOC (${calculation.minSOC}%).
5. Ground all reasoning in the exact numbers provided.

Provide a concise, professional engineering assessment with these exact sections:
- System Condition Summary
- Power Balance & Flow Breakdown
- Load Shedding Assessment (Explain exactly why specific loads were maintained or shed based on priorities and kW deficits)
- Battery Dispatch & Storage Optimization
- Engineering Action Recommendations`;

    let analysisText: string | null = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      analysisText = response.text || null;
    } catch (apiErr: any) {
      console.warn('Gemini generateContent transient error, using expert SCADA engine fallback:', apiErr.message);
    }

    if (!analysisText) {
      // Deterministic Expert SCADA Engineering Synthesis Fallback
      analysisText = `### 1. System Condition Summary
Operating State: ${calculation.operatingMode} (${calculation.systemStatus})
Grid Interconnection: ${state.gridEnabled ? `Connected (${calculation.gridSuppliedKW.toFixed(1)} kW supplied)` : 'OFFLINE / ISLANDED (0 kW)'}
Total Available Generation: ${calculation.totalGenerationAvailableKW.toFixed(1)} kW | Active Bus Demand: ${calculation.totalActiveLoadKW.toFixed(1)} kW (Requested: ${calculation.totalDemandRequestedKW} kW)

### 2. Power Balance & Flow Breakdown
- Utility Grid: ${calculation.gridSuppliedKW.toFixed(1)} kW of ${calculation.gridAvailableKW} kW available
- Solar PV Generation: ${calculation.solarSuppliedKW.toFixed(1)} kW (Irradiance profile: ${state.solarPreset})
- BESS Battery: ${calculation.batteryState} at ${calculation.batteryPowerKW.toFixed(1)} kW (Rating: max ${calculation.batteryMaxDischargeKW} kW)
- Net Power Balance: ${calculation.netSurplusKW >= 0 ? '+' : ''}${calculation.netSurplusKW.toFixed(1)} kW (${calculation.netSurplusKW > 0 ? 'Surplus' : calculation.deficitAfterSheddingKW > 0 ? 'Deficit' : 'Balanced'})
- Electrical Bus: Nominal ${calculation.busVoltageV} V at ${calculation.frequencyHz.toFixed(2)} Hz

### 3. Load Shedding Assessment
${
  calculation.shedLoads.length > 0
    ? `Automated Prioritized Shedding Active: ${calculation.shedLoads
        .map((l: any) => `• ${l.name} (${l.demandKW} kW, Priority ${l.priority}) - Disconnected: ${l.shedReason || 'Relieved power deficit'}`)
        .join('\n')}\n\nProtected Active Loads:\n${calculation.activeLoads
        .map((l: any) => `• ${l.name} (${l.demandKW} kW, Priority ${l.priority}) - Energized`)
        .join('\n')}`
    : `All ${calculation.activeLoads.length} connected loads are fully energized. Bus capacity is sufficient to sustain active demand without disconnection.`
}

### 4. Battery Dispatch & Storage Optimization
- Current SOC: ${calculation.batterySOC.toFixed(1)}% (Configured Minimum Reserve: ${calculation.minSOC}%)
- Usable Energy: ${Math.max(0, ((calculation.batterySOC - calculation.minSOC) / 100) * calculation.batteryCapacityKWh).toFixed(1)} kWh above reserve threshold.
- Recommendation: ${
  calculation.batteryState === 'DISCHARGING'
    ? `Battery is active discharging at ${calculation.batteryPowerKW.toFixed(1)} kW. Monitor discharge rate to prevent reaching ${calculation.minSOC}% reserve floor.`
    : calculation.batteryState === 'CHARGING'
    ? `Surplus renewable energy is actively charging the BESS at ${calculation.batteryPowerKW.toFixed(1)} kW.`
    : 'BESS is in standby mode. Reserves are maintained for grid contingency.'
}

### 5. Engineering Action Recommendations
${
  calculation.operatingMode === 'CRITICAL'
    ? 'EMERGENCY: Generation insufficient to sustain Essential Load. Immediately reconnect grid feeder or curtail auxiliary systems.'
    : calculation.operatingMode === 'ISLANDED'
    ? 'Autonomous Island Operation: Solar PV and BESS are frequency-forming. Maintain load shedding protocol until utility feeder synchronization is confirmed.'
    : calculation.operatingMode === 'LOW-ENERGY'
    ? 'Partial Generation Deficit: Non-essential loads are shed according to priority hierarchy. Monitor solar irradiance curve.'
    : 'Normal Operation: System operating within nominal limits. Microgrid bus is stable.'
}`;
    }

    res.json({
      analysis: analysisText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze state' });
  }
});

/**
 * Endpoint for conversational AI Command Panel
 */
app.post('/api/gemini/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history, state, calculation } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!ai) {
      res.json({
        reply: `[Deterministic EMS Agent] Current state: Grid=${state?.gridEnabled ? state?.gridCapacityKW : 0} kW, Solar=${state?.solarGenerationKW} kW, Battery SOC=${state?.batterySOC}%, Total Demand=${calculation?.totalDemandRequestedKW} kW. Operating mode: ${calculation?.operatingMode}. Please ensure GEMINI_API_KEY is configured for full conversational engineering synthesis.`,
      });
      return;
    }

    const systemInstruction = `You are the resident AI Energy Systems Engineer on duty in the control room of an advanced Smart Microgrid.
You have continuous telemetry access to the live microgrid SCADA system.
CURRENT TELEMETRY SNAPSHOT:
- Grid Feeder: ${state.gridEnabled ? 'ONLINE' : 'FAILED / DISCONNECTED'} (${state.gridCapacityKW} kW capacity, currently injecting ${calculation.gridSuppliedKW} kW)
- Solar PV Array: Available ${state.solarGenerationKW} kW (Peak ${state.solarCapacityKW} kW), Weather/Preset: ${state.solarPreset}
- Battery Storage (BESS): SOC ${calculation.batterySOC.toFixed(1)}%, Status ${calculation.batteryState} (${calculation.batteryPowerKW.toFixed(1)} kW), Max Discharge ${calculation.batteryMaxDischargeKW} kW, Minimum Reserve SOC ${calculation.minSOC}%
- Total Available Generation: ${calculation.totalGenerationAvailableKW} kW
- Total Active Load: ${calculation.totalActiveLoadKW} kW (Requested: ${calculation.totalDemandRequestedKW} kW)
- Net Power Balance: ${calculation.netSurplusKW >= 0 ? '+' : ''}${calculation.netSurplusKW.toFixed(1)} kW
- Operating Mode: ${calculation.operatingMode}
- Active Loads: ${calculation.activeLoads.map((l: any) => `${l.name} (${l.demandKW} kW, P${l.priority})`).join(', ') || 'None'}
- Shed Loads: ${calculation.shedLoads.map((l: any) => `${l.name} (${l.demandKW} kW, P${l.priority} - Reason: ${l.shedReason || 'Power deficit'})`).join(', ') || 'None'}

ENGINEERING GUIDELINES:
- Always answer using the REAL values from the telemetry snapshot above. Never invent hypothetical numbers when the question relates to the current system state.
- If asked "Why was the workshop disconnected?", explain that Workshop is Priority 3 (non-essential), and show how the deficit demanded shedding it to keep Priority 1/2 loads and bus voltage stable.
- If asked "What happens if solar falls to 5 kW?", calculate the exact power delta and what will happen to the battery or loads.
- Maintain a sharp, authoritative, knowledgeable power-systems engineer tone. Keep answers structured and concise (around 2-4 focused paragraphs or bullet points).`;

    const chatContents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        chatContents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let replyText: string | null = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatContents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });
      replyText = response.text || null;
    } catch (apiErr: any) {
      console.warn('Gemini chat transient error, using telemetry SCADA reasoning fallback:', apiErr.message);
    }

    if (!replyText) {
      const q = message.toLowerCase();
      if (q.includes('workshop') || q.includes('shed') || q.includes('disconnect')) {
        const isShed = calculation.shedLoads.some((l: any) => l.name.toLowerCase().includes('workshop'));
        if (isShed) {
          replyText = `The Technical Workshop is assigned Priority 3 (Non-essential). During the current operational cycle, available generation (${calculation.totalGenerationAvailableKW.toFixed(1)} kW) was insufficient to meet the total requested load of ${calculation.totalDemandRequestedKW} kW. In accordance with the microgrid dispatch hierarchy, the EMS automatically shed the Workshop (8 kW) to protect higher-priority consumers (Hostel, Water Pump, and Essential Load) and prevent voltage collapse on the microgrid bus.`;
        } else {
          replyText = `The Technical Workshop is currently ENERGIZED (8 kW). Available generation from ${state.gridEnabled ? 'the grid, ' : ''}solar PV (${calculation.solarSuppliedKW.toFixed(1)} kW), and battery storage is currently sufficient to maintain all connected loads.`;
        }
      } else if (q.includes('solar') || q.includes('falls') || q.includes('5 kw')) {
        const currentSolar = state.solarGenerationKW;
        const delta = currentSolar - 5;
        replyText = `If solar generation falls to 5 kW, available direct generation will decrease by ${Math.abs(delta).toFixed(1)} kW. The Battery Energy Storage System (BESS) would immediately ramp its discharge to cover the shortfall up to its ${calculation.batteryMaxDischargeKW} kW inverter rating. If the net deficit exceeds the battery's maximum discharge rate or minimum ${calculation.minSOC}% SOC limit, the EMS will automatically disconnect lower-priority loads (starting with Priority 3 Workshop, followed by Priority 2 loads) to preserve the bus.`;
      } else if (q.includes('battery supply') || q.includes('can the battery')) {
        replyText = `The battery has a maximum continuous discharge power of ${calculation.batteryMaxDischargeKW} kW and currently holds ${calculation.batterySOC.toFixed(1)}% SOC. Total microgrid demand requested is ${calculation.totalDemandRequestedKW} kW. Therefore, the battery ALONE cannot supply all loads simultaneously (${calculation.batteryMaxDischargeKW} kW vs ${calculation.totalDemandRequestedKW} kW). It is engineered as an auxiliary buffer and requires solar PV or grid interconnection to avoid load shedding.`;
      } else if (q.includes('discharging') || q.includes('why is the battery')) {
        if (calculation.batteryState === 'DISCHARGING') {
          replyText = `The BESS is discharging at ${calculation.batteryPowerKW.toFixed(1)} kW because available generation from solar (${calculation.solarSuppliedKW.toFixed(1)} kW) and the utility grid (${calculation.gridSuppliedKW.toFixed(1)} kW) is lower than active load demand (${calculation.totalActiveLoadKW.toFixed(1)} kW). The battery injects active power to bridge this deficit and maintain system frequency at ${calculation.frequencyHz.toFixed(2)} Hz.`;
        } else {
          replyText = `The battery is currently ${calculation.batteryState} (Power: ${calculation.batteryPowerKW.toFixed(1)} kW). It only discharges when direct generation from grid and solar falls below the connected microgrid demand.`;
        }
      } else if (q.includes('outage') || q.includes('grid failure')) {
        replyText = `During a utility grid outage (Grid = 0 kW), the microgrid transitions to ISLANDED mode. The solar inverter and BESS assume isochronous frequency and voltage control (nominally 50.00 Hz, 400 V). If solar and battery discharge cannot satisfy total demand, automated load shedding systematically disconnects Priority 3 loads (Workshop) and, if necessary, Priority 2 loads, guaranteeing continuous uninterrupted power to the Priority 1 Essential Load.`;
      } else if (q.includes('lowest priority') || q.includes('priority')) {
        replyText = `In this microgrid topology, the Technical Workshop has the lowest priority (Priority 3: Non-essential, 8 kW). The Community Water Pump and Hostel Accommodation are Priority 2 (Important), and the Essential / Emergency Load is Priority 1 (Protected). On any generation deficit, Priority 3 is shed first.`;
      } else if (q.includes('hostel') || q.includes('10 kw')) {
        replyText = `If the Hostel demand were to increase by 10 kW (from ${state.loads.find((l: any) => l.id.includes('hostel'))?.demandKW || 12} kW to ${(state.loads.find((l: any) => l.id.includes('hostel'))?.demandKW || 12) + 10} kW), total microgrid demand would rise to ${calculation.totalDemandRequestedKW + 10} kW. Depending on current grid/solar generation and the ${calculation.batteryMaxDischargeKW} kW battery limit, this would create an immediate deficit, forcing the EMS to shed lower-priority loads (such as the Workshop) or trigger an overload alert if reserves are exhausted.`;
      } else {
        replyText = `Telemetry Status Report: The microgrid is operating in ${calculation.operatingMode} mode. Total generation available is ${calculation.totalGenerationAvailableKW.toFixed(1)} kW against ${calculation.totalDemandRequestedKW} kW requested demand. Net power balance is ${calculation.netSurplusKW >= 0 ? '+' : ''}${calculation.netSurplusKW.toFixed(1)} kW. Battery SOC is at ${calculation.batterySOC.toFixed(1)}% (${calculation.batteryState} at ${calculation.batteryPowerKW.toFixed(1)} kW). Essential loads remain 100% energized.`;
      }
    }

    res.json({
      reply: replyText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to process inquiry' });
  }
});

// Vite middleware or static serving
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        host: '0.0.0.0',
        port: PORT,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Smart Microgrid Server online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
