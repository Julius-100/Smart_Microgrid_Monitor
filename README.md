# Smart Microgrid Monitor

An interactive educational and engineering microgrid distribution monitor that demonstrates real-time power generation tracking, campus load balancing, and prioritized load management.

![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![React](https://img.shields.io/badge/React-19.x-cyan.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-indigo.svg)

---

## ⚡ Core Concept

The microgrid monitors two generation sources:
1. **Utility Grid Feeder** (Nominal: 34.5 kW)
2. **Solar PV / Inverter Array** (Nominal: 23.0 kW)

It supplies electricity to four campus hostel buildings:
- **Moremi Hostel** (Priority 1 — High / Essential): 18 kW demand
- **Makama Hostel** (Priority 2): 10 kW demand
- **Mariere Hostel** (Priority 3): 15 kW demand
- **Eni Njoku Hostel** (Priority 4 — Shed first on deficit): 12 kW demand

### Governing Engineering Equations

$$\text{Total Available Power} = P_{\text{Grid}} + P_{\text{Solar}}$$

$$\text{Total Demand} = \sum_{i=1}^{n} P_{\text{Hostel}, i}$$

$$\text{Power Balance} = \text{Total Available Power} - \text{Total Demand}$$

- When $\text{Power Balance} \ge 0\text{ kW}$ $\rightarrow$ **SYSTEM STABLE** (All hostels fully powered)
- When $\text{Power Balance} < 0\text{ kW}$ $\rightarrow$ **POWER DEFICIT** (Prioritized dispatch sheds lower-priority hostels to maintain essential services)

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or pnpm

### 1. Clone or Download
```bash
git clone https://github.com/<YOUR-USERNAME>/smart-microgrid-monitor.git
cd smart-microgrid-monitor
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📤 Push Directly to Your GitHub Repository (No Restrictions)

To push this codebase to a new repository on your GitHub account with zero restrictions:

```bash
# 1. Initialize git (already pre-configured if using this repo)
git init
git branch -M main

# 2. Stage and commit all files
git add .
git commit -m "feat: initial commit of Smart Microgrid Monitor"

# 3. Link your remote GitHub repository
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPOSITORY-NAME>.git

# 4. Push to main branch
git push -u origin main
```

---

## 📂 Project Architecture

```
├── .env.example              # Environment variables template
├── .gitignore                # Production gitignore rules
├── LICENSE                   # Open-source MIT License
├── README.md                 # Project documentation
├── index.html                # Application HTML entry point
├── package.json              # Project dependencies and scripts
├── server.ts                 # Express dev/prod full-stack entry point
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite & Tailwind CSS bundler configuration
└── src/
    ├── App.tsx               # Main dashboard UI container
    ├── main.tsx              # React mounting entry point
    ├── index.css             # Tailwind CSS global styles
    ├── types.ts              # TypeScript interfaces (Loads, Sources, Calculation)
    ├── engine/
    │   └── microgridLogic.ts # Pure mathematical & electrical balance functions
    └── components/
        ├── Header.tsx        # Top status banner, live controls, motion graph toggle
        ├── PowerSources.tsx  # Grid, Solar, and Total Available metrics
        ├── BuildingCard.tsx  # Hostel load card with interactive demand sliders
        ├── PowerFlow.tsx     # Single-line electrical bus visualization
        ├── SimulationControls.tsx # Preset outage and solar reduction scenarios
        ├── MotionGraph.tsx   # Real-time oscilloscope motion waveform
        ├── ExportModal.tsx   # In-app GitHub export & tarball download modal
        └── HowItWorks.tsx    # Technical microgrid explanation for students
```

---

## 📄 License

This project is licensed under the **MIT License** — you are free to use, modify, distribute, fork, and publish this software without restrictions.
