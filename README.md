# Smart Microgrid Supervisory Control and Data Acquisition (SCADA) System

A real-time, small-scale electrical microgrid distribution and supervisory monitoring system built to track hybrid generation sources, compute campus power balance, and execute prioritized load-shedding algorithms across distribution feeders.

![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![React](https://img.shields.io/badge/React-19.x-cyan.svg)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-indigo.svg)
![Vercel Ready](https://img.shields.io/badge/Vercel-Deployed-black.svg)

---

## 📋 System Overview & Electrical Architecture

The Smart Microgrid Monitor oversees a decentralized 415V, 50Hz campus distribution bus supplied by two primary generation assets and serving four residential hostel feeders:

### 1. Generation Assets
- **Utility Grid Feeder ($P_{\text{Grid}}$):** 3-phase grid interconnection providing nominal 34.5 kW baseload power.
- **Solar PV & Inverter Array ($P_{\text{Solar}}$):** Photovoltaic solar array providing nominal 23.0 kW clean renewable power.

$$\text{Total Available Generation } (P_{\text{Available}}) = P_{\text{Grid}} + P_{\text{Solar}}$$

### 2. Campus Distribution Feeders (Hostels)
Four hostel blocks connect to the main low-voltage bus with designated critical priority rankings:

| Feeder / Building | Nominal Load ($P_{\text{Demand}}$) | Priority Level | Operational Dispatch Rule |
| :--- | :---: | :---: | :--- |
| **Moremi Hostel** | 18.0 kW | **Priority 1 (Critical)** | Highest priority; preserved under all operating conditions. |
| **Makama Hostel** | 10.0 kW | **Priority 2 (High)** | Powered whenever $P_{\text{Available}} \ge P_{\text{Moremi}} + P_{\text{Makama}}$. |
| **Mariere Hostel** | 15.0 kW | **Priority 3 (Medium)** | Powered if remaining supply is sufficient after Priority 1 and 2. |
| **Eni Njoku Hostel**| 12.0 kW | **Priority 4 (Curtailable)** | Lowest priority; first to be shed upon power deficit. |

$$\text{Total Campus Demand } (P_{\text{Demand}}) = \sum_{i=1}^{4} P_{\text{Hostel}, i} = 18.0 + 10.0 + 15.0 + 12.0 = 55.0\text{ kW}$$

---

## ⚙️ How the System Operates

### 1. Deterministic Power Balance Logic
The supervisory controller continuously calculates net balance on the AC bus:

$$P_{\text{Balance}} = P_{\text{Available}} - P_{\text{Demand}}$$

- **When $P_{\text{Balance}} \ge 0\text{ kW}$:**
  - **Status:** `SYSTEM STABLE`
  - All four distribution feeders are fully energized (100% capacity).
  - Net surplus power remains on the bus: $P_{\text{Surplus}} = P_{\text{Balance}}$.

- **When $P_{\text{Balance}} < 0\text{ kW}$:**
  - **Status:** `POWER DEFICIT`
  - Net deficit magnitude: $P_{\text{Deficit}} = |P_{\text{Balance}}|$.
  - The automated load controller initiates **Prioritized Load Shedding**:
    1. Feeder Priority 4 (Eni Njoku) is disconnected first.
    2. If a deficit still remains, Feeder Priority 3 (Mariere) is disconnected.
    3. If available generation is critically low, Feeder Priority 2 (Makama) is disconnected.
    4. Feeder Priority 1 (Moremi) receives remaining capacity to protect essential lighting, refrigeration, and security services.

---

### 2. Real-Time Telemetry & Oscilloscope Motion Waveform
The dashboard features an automated live telemetry engine simulating real-world electrical grid dynamics at 1.5-second sampling intervals:
- **Solar Dynamics:** Continuous sinusoidal tracking with cloud jitter simulating diurnal irradiance changes.
- **Grid Fluctuations:** Micro-fluctuations ($\pm 0.3\text{ kW}$) representing utility frequency and voltage regulation.
- **Campus Load Cycling:** Random sub-kilowatt load step changes modeling student appliance usage.
- **Motion Waveform Graph:**
  - **Solid Emerald Line & Fill:** Real-time generation capacity curve ($P_{\text{Available}}$).
  - **Dashed Sky/Rose Line:** Aggregated campus demand curve ($P_{\text{Demand}}$).
  - **Dotted Yellow Line:** Instantaneous solar PV contribution.
  - **Interactive Crosshair:** Hovering across the waveform inspects exact timestamped kW readouts and system stability at any point in time.
  - **Transient Wave Test:** Allows dispatchers to simulate a rapid cloud transient or sudden load spike to observe instantaneous dynamic load shedding.

---

### 3. Supervisory SCADA Dispatch Controls
Dispatchers can manually evaluate microgrid resilience using preset operational scenarios:
- **Normal Operation:** Baseline 57.5 kW generation (Grid: 34.5 kW, Solar: 23.0 kW) satisfying total demand (55.0 kW) with +2.5 kW surplus.
- **Utility Grid Outage:** Tripping the utility feeder ($P_{\text{Grid}} = 0\text{ kW}$) forces the microgrid into islanded operation on solar PV alone ($P_{\text{Solar}} = 23.0\text{ kW}$), immediately shedding Mariere and Eni Njoku to protect Moremi (18 kW).
- **Solar PV Curtailment:** Heavy cloud cover reduces solar to 5.0 kW, testing grid-dominant supply balance.
- **Manual Feeder Sliders:** Dispatchers can dynamically slide individual building loads from 5 kW to 30 kW to model extreme load scenarios.

---

## 🛠️ Project Structure

```
├── index.html                   # Application entry point with metadata
├── package.json                 # Dependency definitions and scripts
├── package-lock.json            # Deterministic dependency lockfile
├── server.ts                    # Full-stack Node.js / Express runner
├── tsconfig.json                # TypeScript compiler configuration
├── vercel.json                  # Minimal production Vercel deployment config
├── vite.config.ts               # Vite bundler configuration
└── src/
    ├── App.tsx                  # Root SCADA dashboard component
    ├── main.tsx                 # React application mounting
    ├── index.css                # Tailwind CSS styling and theme
    ├── types.ts                 # Type definitions (Loads, Sources, Telemetry)
    ├── engine/
    │   └── microgridLogic.ts    # Deterministic power balance and priority algorithm
    └── components/
        ├── Header.tsx           # Status badges, live ticker toggle, motion graph control
        ├── PowerSources.tsx     # Grid, Solar, and Available Power readout meters
        ├── BuildingCard.tsx     # Feeder cards with priority badges and load sliders
        ├── PowerFlow.tsx        # Single-line electrical bus distribution diagram
        ├── SimulationControls.tsx # SCADA operational state dispatcher
        └── MotionGraph.tsx      # Real-time oscilloscope motion waveform
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ or Bun
- npm, pnpm, or yarn

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/<YOUR-USERNAME>/smart-microgrid-monitor.git
cd smart-microgrid-monitor

# 2. Install dependencies (verified conflict-free)
npm install

# 3. Start local development server
npm run dev
```

Navigate to `http://localhost:3000` to access the live dashboard.

### Production Build

```bash
npm run build
npm run preview
```

---

## ☁️ Deployment to Vercel

This repository is pre-configured with a clean `vercel.json` specification for zero-config Vercel deployment:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Smart Microgrid SCADA Monitor"
   git push origin main
   ```
2. Open [Vercel Dashboard](https://vercel.com/new).
3. Import your GitHub repository.
4. Click **Deploy**. Vercel will automatically recognize the Vite framework, execute `npm run build`, and serve the compiled single-page application from `dist/`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for academic, engineering, and commercial usage.
