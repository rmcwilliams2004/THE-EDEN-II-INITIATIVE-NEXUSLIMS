# NexusLIMS & Feeders of the World
## Architectural Design Document (ADD)

### 1. Complete Microservices Architecture Diagram

```mermaid
flowchart TD
    %% Subgraphs
    subgraph Container_Edge ["CONTAINER EDGE NODE (Offline-First / Industrial PLC)"]
        Sensors["Sensors & Telemetry<br/>(Soil pH, Moisture, 600-bar HPDD, 400°C Bed)"]
        EdgePLC["Edge Controller & Failsafe Logic<br/>(Dual-Mode Dispensing / pH Buffering)"]
        LocalDB[("Local SQLite / Cache")]
        Kiosk["IP67 Embedded Touchscreen HMI"]
    end

    subgraph External_Agronomy ["OPEN AGRONOMY APIS & KNOWLEDGE BASE"]
        KaegroAPI["Kaegro Global Soil API<br/>(CEC, Texture, Base pH)"]
        FAOAPI["FAOSTAT & Crop Calendar API<br/>(Uptake Standards, Sowing Dates)"]
        CGIAR["CGIAR AgroFIMS<br/>(Standardized Ontologies)"]
    end

    subgraph Cloud_Ingestion ["CLOUD INGESTION & EVENT STREAMING"]
        MQTT_Broker["Secure MQTT / gRPC Gateway"]
        Kafka["Apache Kafka Event Bus"]
        TelemetryService["Telemetry Ingestion & Anomaly Worker"]
        AgronomySync["Agronomy Baseline Worker"]
    end

    subgraph RealTime_Translation ["UNIVERSAL TRANSLATOR (WebRTC)"]
        LiveKitSFU["LiveKit SFU Server"]
        GeminiLive["Gemini Live API Engine<br/>(Sub-500ms Audio-to-Audio Translation)"]
    end

    subgraph Storage_Layer ["PRIMARY DATA & STORAGE LAYER"]
        TimescaleDB[("TimescaleDB<br/>(Time-Series Metrics)")]
        PostgreSQL[("PostgreSQL<br/>(Users, Nodes, Posts, Sister-Links)")]
        S3Storage[("S3 Object Store / CDN<br/>(Transcoded Video & Media)")]
    end

    subgraph dMRV_Engine ["AUTOMATED dMRV & CAPITAL LEDGER"]
        HashWorker["SHA-256 Cryptographic Hasher"]
        VCMRegistry["VCM / Carbon Registries API<br/>(Gold Standard, Verra Sync)"]
    end

    subgraph Frontend_Clients ["FRONTEND CLIENT INTERFACES"]
        MobileApp["Farmer Mobile / Mesh App"]
        SisterLinkPortal["Sister-Link Social & Video Stream"]
        ESGPortal["Enterprise ESG & CSRD Dashboard"]
    end

    %% Edge Internal Connections
    Sensors -->|Raw Sensor Readings| EdgePLC
    EdgePLC <-->|Local Read/Write| LocalDB
    EdgePLC <-->|UI Display & Commands| Kiosk

    %% Edge to Cloud / Sync Connections
    EdgePLC -->|Asynchronous Encrypted Sync (Sat/Cell)| MQTT_Broker
    MQTT_Broker --> Kafka

    %% Cloud Internal Processing
    Kafka -->|Topic: telemetry.raw| TelemetryService
    TelemetryService -->|Write Time-Series| TimescaleDB
    TelemetryService -->|Trigger Out-of-Bounds| EdgePLC
    TelemetryService -->|Process Emissions Data| HashWorker

    %% Agronomy Flow
    EdgePLC -.->|GPS Coordinates on Init| AgronomySync
    AgronomySync <-->|Query Geo-Soil| KaegroAPI
    AgronomySync <-->|Query Crop Needs| FAOAPI
    AgronomySync <-->|Map Standards| CGIAR
    AgronomySync -->|Save Normalized Profile| PostgreSQL
    AgronomySync -->|Push Baseline Recipe| EdgePLC

    %% Video & Translation Flow
    MobileApp <-->|WebRTC Stream| LiveKitSFU
    SisterLinkPortal <-->|WebRTC Stream| LiveKitSFU
    LiveKitSFU <-->|16kHz PCM Audio WebSocket| GeminiLive

    %% Media Storage Flow
    MobileApp -->|Upload Media & Telemetry Stamp| S3Storage
    S3Storage --> SisterLinkPortal

    %% dMRV Flow
    HashWorker -->|Audit-Ready PDDs| PostgreSQL
    HashWorker -->|API Mint Tokens| VCMRegistry

    %% Data Delivery to Frontends
    PostgreSQL --> SisterLinkPortal
    TimescaleDB --> ESGPortal
    PostgreSQL --> ESGPortal
```

---

### 2. External Agronomy Ingestion Service (Node.js/TypeScript)

This service is triggered when a new Eden II container is deployed. It ingests the GPS coordinates to build an localized agronomic baseline.

```typescript
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgronomyIngestionService {
  /**
   * Initializes a new node's baseline profile by querying global agronomy APIs.
   */
  async initializeNodeBaseline(nodeId: string, lat: number, lng: number) {
    try {
      // 1. Fetch Soil Baseline (Kaegro)
      const soilData = await axios.get(`https://api.kaegro.com/farms/api/soil?lat=${lat}&lon=${lng}`);
      
      // 2. Fetch Crop Calendar (FAO)
      const cropData = await axios.get(`https://api.fao.org/crop-calendar?lat=${lat}&lng=${lng}`);
      
      // 3. Normalize via CGIAR AgroFIMS Ontology
      const normalizedData = await this.normalizeToCgiarOntology(soilData.data, cropData.data);
      
      // 4. Persist to Relational DB
      const profile = await prisma.agronomyProfile.create({
        data: {
          nodeId,
          faoClassification: normalizedData.soilClass,
          phBaseline: normalizedData.baselinePh,
          cecRatio: normalizedData.cec,
          sowingWindowStart: normalizedData.sowingStart,
          harvestWindowEnd: normalizedData.harvestEnd,
        }
      });
      
      return profile;
    } catch (error) {
      console.error(`Failed to ingest agronomy data for node ${nodeId}:`, error);
      throw error;
    }
  }

  private async normalizeToCgiarOntology(soilPayload: any, cropPayload: any) {
    // Cross-reference payload keys with CGIAR standards (mock implementation)
    return {
      soilClass: soilPayload.classification || 'UNKNOWN',
      baselinePh: parseFloat(soilPayload.ph_h2o) || 7.0,
      cec: parseFloat(soilPayload.cation_exchange) || 15.0,
      sowingStart: cropPayload.optimal_sowing_date,
      harvestEnd: cropPayload.optimal_harvest_date,
    };
  }
}
```

---

### 3. LiveKit + Gemini Live Translation Agent Code

This Node.js worker handles the WebRTC translation bridging a Swahili speaker to an English speaker using `gemini-3.5-live-translate-preview`.

```typescript
import { Room, RemoteAudioTrack } from 'livekit-server-sdk';
import { GoogleGenAI, Modality } from '@google/genai';
import WebSocket from 'ws';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runTranslationAgent(roomName: string, sourceLang: string, targetLang: string) {
  const room = new Room();
  await room.connect(process.env.LIVEKIT_URL!, process.env.LIVEKIT_AGENT_TOKEN!);

  // Initialize Gemini Live Translate connection
  const session = await ai.live.connect({
    model: 'gemini-3.5-live-translate-preview',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `Translate all incoming speech from ${sourceLang} to ${targetLang}. Output only the translation.`,
      generationConfig: {
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
        }
      }
    },
    callbacks: {
      onmessage: (message) => {
        const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audio) {
          // Send 24kHz synthesized PCM back to LiveKit room
          publishAudioToRoom(room, Buffer.from(audio, 'base64'));
        }
      }
    }
  });

  // Subscribe to raw 16kHz PCM from users
  room.on('trackSubscribed', (track: RemoteAudioTrack, participant) => {
    track.on('audioFrame', (frame) => {
      // Send 16-bit PCM little-endian data to Gemini
      session.sendRealtimeInput({
        audio: {
          data: frame.data.toString('base64'),
          mimeType: "audio/pcm;rate=16000"
        }
      });
    });
  });
}

function publishAudioToRoom(room: Room, audioData: Buffer) {
  // Logic to stream binary buffer out to LiveKit TrackSource
}
```

---

### 4. Database Schema (Prisma ORM DDL)

This defines the core operational tables utilizing PostgreSQL (for relations) and representing the structure of the TimescaleDB telemetry log.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model HardwareNode {
  id              String            @id @default(uuid())
  designation     String
  latitude        Float
  longitude       Float
  status          String            @default("ONLINE") // ONLINE, WARNING, OFFLINE
  agronomyProfile AgronomyProfile?
  telemetryLogs   TelemetryLog[]
  mediaPosts      MediaPost[]
  sisterLinks     SisterLink[]      @relation("NodeLinks")
  createdAt       DateTime          @default(now())
}

model AgronomyProfile {
  id                String       @id @default(uuid())
  nodeId            String       @unique
  node              HardwareNode @relation(fields: [nodeId], references: [id])
  faoClassification String
  phBaseline        Float
  cecRatio          Float
  sowingWindowStart DateTime?
  harvestWindowEnd  DateTime?
}

// Conceptually this would be stored in TimescaleDB/Hypertable
model TelemetryLog {
  id            String       @id @default(uuid())
  nodeId        String
  node          HardwareNode @relation(fields: [nodeId], references: [id])
  timestamp     DateTime     @default(now())
  reactorTemp   Float
  hydraulicPres Float
  soilPh        Float
  signatureHash String       // SHA-256 for dMRV immutability
}

model SisterLink {
  id              String       @id @default(uuid())
  commercialNodeId String
  humanitarianNodeId String
  commercialNode   HardwareNode @relation("NodeLinks", fields: [commercialNodeId], references: [id])
  establishedAt    DateTime     @default(now())
}

model MediaPost {
  id            String       @id @default(uuid())
  nodeId        String
  node          HardwareNode @relation(fields: [nodeId], references: [id])
  mediaUrl      String
  caption       String
  telemetrySnap Json         // Watermarked stats at time of capture
  createdAt     DateTime     @default(now())
}

model VcmLedgerEntry {
  id           String   @id @default(uuid())
  nodeId       String
  timestamp    DateTime @default(now())
  creditsMinted Float
  status       String   // PENDING, VERIFIED, RETIRED
  pddHash      String   // Project Design Document signature
}
```

---

### 5. Edge-Level Dual-Mode Dispensing Controller (Python)

This script runs on the local Edge PLC, handling the critical offline control loop for fertigation and safety dilution.

```python
import time
import hashlib
import json
from datetime import datetime

class EdenEdgeController:
    def __init__(self):
        self.drip_valve_open = False
        self.foliar_valve_open = False
        self.buffer_pump_active = False
        self.water_dilution_pump_active = False
        
        # Safe thresholds
        self.MIN_SAFE_PH = 6.0
        self.MAX_FOLIAR_N_PERCENT = 2.0

    def read_sensors(self):
        # Mocking sensor reads via GPIO/I2C
        return {
            "soil_ph": 5.8,
            "reactor_temp": 395.5,
            "hydraulic_pressure": 600,
            "ammonia_concentration": 15.0 # Raw output %
        }

    def execute_mode_a_drip(self, sensors):
        """Continuous root-zone drip fertigation."""
        self.drip_valve_open = True
        self.foliar_valve_open = False
        
        if sensors["soil_ph"] < self.MIN_SAFE_PH:
            # Inject alkaline buffer (CaCO3 / KOH)
            self.buffer_pump_active = True
            print("[MODE A] Low pH detected. Activating alkaline buffer pumps.")
        else:
            self.buffer_pump_active = False

    def execute_mode_b_foliar(self, sensors):
        """Batch manual sprayer dispensing with safety dilution."""
        self.drip_valve_open = False
        
        current_n_percent = sensors["ammonia_concentration"]
        
        if current_n_percent > self.MAX_FOLIAR_N_PERCENT:
            print(f"[MODE B FAILSAFE] N-concentration {current_n_percent}% exceeds safe {self.MAX_FOLIAR_N_PERCENT}% limit.")
            self.foliar_valve_open = False
            self.water_dilution_pump_active = True
            print("Diluting with distilled water...")
        else:
            self.water_dilution_pump_active = False
            self.foliar_valve_open = True
            print("[MODE B] Foliar spray authorized and dispensing.")

    def generate_dmrv_payload(self, sensors):
        """Cryptographically signs telemetry for immutable dMRV carbon ledger."""
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "sensors": sensors,
            "valves": {
                "drip": self.drip_valve_open,
                "foliar": self.foliar_valve_open
            }
        }
        
        # SHA-256 for data immutability verification in the cloud
        signature = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        payload["signature"] = signature
        return payload

    def run_control_loop(self, active_mode):
        while True:
            sensors = self.read_sensors()
            
            if active_mode == "A":
                self.execute_mode_a_drip(sensors)
            elif active_mode == "B":
                self.execute_mode_b_foliar(sensors)
                
            payload = self.generate_dmrv_payload(sensors)
            self.queue_mqtt_transmission(payload)
            
            time.sleep(1) # 1Hz control loop

    def queue_mqtt_transmission(self, payload):
        # In reality, queues locally and flushes when satellite/cellular uplink is active.
        pass

if __name__ == "__main__":
    controller = EdenEdgeController()
    controller.run_control_loop(active_mode="A")
```
