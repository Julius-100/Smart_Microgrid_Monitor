/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MicrogridState, TestScenario } from '../types/microgrid';

export const INITIAL_MICROGRID_STATE: MicrogridState = {
  gridEnabled: true,
  gridCapacityKW: 30,

  solarCapacityKW: 35,
  solarGenerationKW: 15,
  solarPreset: 'Afternoon (15 kW)',

  batteryCapacityKWh: 50,
  batterySOC: 72,
  batteryMinSOC: 20,
  batteryMaxDischargeKW: 10,
  batteryMaxChargeKW: 10,

  loads: [
    {
      id: 'essential-load',
      name: 'Essential / Emergency Load',
      category: 'critical',
      demandKW: 3,
      priority: 1, // Priority 1 = Essential
      enabled: true,
      isShed: false,
    },
    {
      id: 'hostel-load',
      name: 'Hostel Accommodation',
      category: 'residential',
      demandKW: 12,
      priority: 2, // Priority 2 = Important
      enabled: true,
      isShed: false,
    },
    {
      id: 'water-pump',
      name: 'Community Water Pump',
      category: 'infrastructure',
      demandKW: 5,
      priority: 2, // Priority 2 = Important
      enabled: true,
      isShed: false,
    },
    {
      id: 'workshop-load',
      name: 'Technical Workshop',
      category: 'industrial',
      demandKW: 8,
      priority: 3, // Priority 3 = Non-essential
      enabled: true,
      isShed: false,
    },
  ],
};

export const SOLAR_PRESETS = [
  { label: 'Night', kw: 0, icon: 'Moon', desc: 'Zero solar irradiance (0 kW)' },
  { label: 'Morning', kw: 8, icon: 'Sunrise', desc: 'Ramping solar (8 kW)' },
  { label: 'Afternoon', kw: 22, icon: 'SunMedium', desc: 'High insolation (22 kW)' },
  { label: 'Evening', kw: 4, icon: 'Sunset', desc: 'Low evening sun (4 kW)' },
  { label: 'Cloudy', kw: 3, icon: 'Cloud', desc: 'Heavy cloud cover (3 kW)' },
  { label: 'Sunny Peak', kw: 30, icon: 'Sun', desc: 'Clear sky zenith (30 kW)' },
];

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'scenario-1-normal',
    title: 'Scenario 1: Normal Operation',
    badge: 'STABLE BASELINE',
    description: 'Grid available (30 kW), Solar (15 kW), Battery nominal (72%), Total Load 28 kW.',
    expectedResult: 'System operates normally with all 4 loads energized. Grid supplies remainder of demand after solar self-consumption.',
    state: {
      gridEnabled: true,
      gridCapacityKW: 30,
      solarGenerationKW: 15,
      solarPreset: 'Afternoon (15 kW)',
      batterySOC: 72,
      loads: [
        { id: 'essential-load', demandKW: 3, enabled: true },
        { id: 'hostel-load', demandKW: 12, enabled: true },
        { id: 'water-pump', demandKW: 5, enabled: true },
        { id: 'workshop-load', demandKW: 8, enabled: true },
      ],
    },
  },
  {
    id: 'scenario-2-grid-failure',
    title: 'Scenario 2: Grid Failure (Islanded)',
    badge: 'ISLANDING SHED',
    description: 'Grid = 0 kW (Utility feeder tripped), Solar = 15 kW, Load = 28 kW.',
    expectedResult: 'BESS discharges up to 10 kW rating (Total generation = 25 kW). Deficit of 3 kW causes Priority 3 Workshop (8 kW) to shed automatically, stabilizing the island.',
    state: {
      gridEnabled: false,
      gridCapacityKW: 30,
      solarGenerationKW: 15,
      solarPreset: 'Afternoon (15 kW)',
      batterySOC: 65,
      loads: [
        { id: 'essential-load', demandKW: 3, enabled: true },
        { id: 'hostel-load', demandKW: 12, enabled: true },
        { id: 'water-pump', demandKW: 5, enabled: true },
        { id: 'workshop-load', demandKW: 8, enabled: true },
      ],
    },
  },
  {
    id: 'scenario-3-low-solar',
    title: 'Scenario 3: Low Solar & Weak Grid',
    badge: 'PARTIAL DEFICIT',
    description: 'Grid throttled to 10 kW, Solar heavily overcast at 3 kW, Total Load = 28 kW.',
    expectedResult: 'Direct gen = 13 kW. Battery discharges 10 kW max. Total available = 23 kW. Net deficit of 5 kW sheds Workshop (8 kW) to protect Hostel and Water Pump.',
    state: {
      gridEnabled: true,
      gridCapacityKW: 10,
      solarGenerationKW: 3,
      solarPreset: 'Cloudy (3 kW)',
      batterySOC: 50,
      loads: [
        { id: 'essential-load', demandKW: 3, enabled: true },
        { id: 'hostel-load', demandKW: 12, enabled: true },
        { id: 'water-pump', demandKW: 5, enabled: true },
        { id: 'workshop-load', demandKW: 8, enabled: true },
      ],
    },
  },
  {
    id: 'scenario-4-critical',
    title: 'Scenario 4: Critical Emergency',
    badge: 'BLACKOUT RISK',
    description: 'Grid = 0 kW, Solar = 2 kW, Battery depleted at minimum SOC (20%), Essential Load = 3 kW.',
    expectedResult: 'System identifies critical power deficit. Battery cannot discharge past 20% limit. Solar (2 kW) cannot even cover 3 kW Essential Load!',
    state: {
      gridEnabled: false,
      gridCapacityKW: 30,
      solarGenerationKW: 2,
      solarPreset: 'Cloudy (2 kW)',
      batterySOC: 20, // at minimum SOC
      loads: [
        { id: 'essential-load', demandKW: 3, enabled: true },
        { id: 'hostel-load', demandKW: 12, enabled: true },
        { id: 'water-pump', demandKW: 5, enabled: true },
        { id: 'workshop-load', demandKW: 8, enabled: true },
      ],
    },
  },
  {
    id: 'scenario-5-excess-solar',
    title: 'Scenario 5: Excess Solar Generation',
    badge: 'SURPLUS CHARGE',
    description: 'Grid = 10 kW, Solar = 30 kW peak, Total Load reduced to 15 kW.',
    expectedResult: 'Massive solar surplus (15 kW net after loads). Microgrid initiates automated battery charging up to 10 kW maximum charge limit with 0 grid power consumed.',
    state: {
      gridEnabled: true,
      gridCapacityKW: 10,
      solarGenerationKW: 30,
      solarPreset: 'Sunny Peak (30 kW)',
      batterySOC: 35,
      loads: [
        { id: 'essential-load', demandKW: 3, enabled: true },
        { id: 'hostel-load', demandKW: 7, enabled: true },
        { id: 'water-pump', demandKW: 5, enabled: true },
        { id: 'workshop-load', demandKW: 0, enabled: false },
      ],
    },
  },
];
