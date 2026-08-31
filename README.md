# THE EDEN II INITIATIVE / NEXUSLIMS Platform

Production-ready, full-stack, embedded IoT and Web3 dMRV platform managing containerized autonomous carbon-negative nitrogen-fertilizer synthesis nodes (**40-ft Commercial 300kW** units paired with **20-ft Humanitarian 100kW Sister** units).

---

## 🏗️ Monorepo Architecture

```
THE-EDEN-II-INITIATIVE-NEXUSLIMS/
├── package.json
├── turbo.json
├── README.md
├── packages/
│   ├── database/                  # PostgreSQL + Prisma ORM models & client
│   │   ├── prisma/schema.prisma
│   │   └── src/index.ts
│   ├── shared-types/              # Domain interfaces, telemetry packets, & enums
│   │   └── src/index.ts
│   └── crypto-utils/              # SHA-256 Merkle root computation & hash verification
│       └── src/index.ts
└── apps/
    ├── edge-controller/           # Embedded Node.js SIL-3 daemon & Modbus drivers
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── drivers/sensors.ts
    │       ├── safety/sil3Failsafe.ts
    │       ├── telemetry/hasher.ts
    │       └── index.ts
    ├── kiosk-ui/                  # Zero-literacy outdoor kiosk with Gemini Live Voice
    │   ├── package.json
    │   ├── tailwind.config.js
    │   └── src/
    │       ├── app/page.tsx
    │       ├── components/VoicePushToTalk.tsx
    │       ├── components/IconCropSelector.tsx
    │       ├── components/DispenseGauge.tsx
    │       ├── hooks/useGeminiLive.ts
    │       └── hooks/useNFCReader.ts
    ├── web-portal/                # Fleet management, Section 179/REAP & EcoCreditX UI
    │   ├── package.json
    │   └── src/
    │       ├── app/layout.tsx
    │       ├── app/page.tsx
    │       ├── app/onboarding/page.tsx
    │       ├── app/fleet/page.tsx
    │       └── app/ecocreditx/page.tsx
    └── ecocreditx-service/        # Hedera Hashgraph HCS dMRV & HTS micro-carbon minter
        ├── package.json
        └── src/
            ├── hedera/client.ts
            ├── hedera/hcsSubmitter.ts
            ├── hedera/htsMinter.ts
            ├── settlement/revenueSplit.ts
            └── index.ts
```

---

## ⚡ Core Domain Capabilities

1. **SIL-3 Industrial Safety Interlocks**:
   - 2-out-of-3 (2oo3) voting logic across hydraulic intensifier pressure transducers with automatic $N_2$ inert purge above 620 Bar.
   - Optical $H_2$ infrared spectroscopy interlock triggering electrical bus isolation and hermetic louver sealing above 10% LEL.
   - Hardware foliar dilution lockout locking the primary dispense solenoid until aqueous nitrogen is exactly 1.0% N.

2. **Zero-Literacy Push-to-Talk Kiosk**:
   - Multimodal Gemini Live WebSocket API (`gemini-3.5-live-translate-preview` & `gemini-1.5-flash`).
   - Parses `<cmd>{"ui_icon": "coffee", "ui_fill_level": 15, "valve_status": "ready"}</cmd>` to provide visual confirmation.
   - NFC/RFID instant authentication and allocation reader.

3. **EcoCreditX Hedera Hashgraph dMRV Engine**:
   - Hedera Consensus Service (HCS) immutable sensor telemetry logging.
   - Hedera Token Service (HTS) minting 1 EcoCredit token per 1 kg $CO_2e$ offset based on methane destruction ($28\times$ GWP), BECCS capture, and avoided diesel freight.
   - Automated 50/30/20 revenue settlement (50% Enterprise buyer, 30% Sister Cooperative, 20% Protocol).

4. **Section 179 & USDA REAP Grant Financial Optimizer**:
   - Automatic depreciation schedules ($2.56M cap) combined with 50% USDA REAP grants.
