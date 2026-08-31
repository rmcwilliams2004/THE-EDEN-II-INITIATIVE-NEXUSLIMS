import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import { GoogleGenAI, LiveServerMessage, Modality, GenerateVideosOperation } from '@google/genai';
import { EdenEdgeDaemon, EdenNodeTelemetryPacket, TelemetryBatch } from './src/services/edenEdgeDaemon';

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-memory data store for demonstration (TimescaleDB / dMRV VCM Ledger)
const vcmLedger: any[] = [];
let telemetryHistory: any[] = [];
let edgeBatchesHistory: TelemetryBatch[] = [];
let latestEdgePacket: EdenNodeTelemetryPacket | null = null;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Initialize WebSockets for general app events
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  // Initialize WebSocket for Gemini Live API
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  wss.on("connection", async (clientWs: WebSocket) => {
    let session: any = null;
    let targetLangCode = "en"; // Default

    clientWs.on("message", async (data: any) => {
      const msg = JSON.parse(data.toString());
      
      // Allow the client to initialize with a target language
      if (msg.type === 'init') {
        targetLangCode = msg.targetLanguageCode || "en";
        try {
          session = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            config: {
              responseModalities: [Modality.AUDIO],
              systemInstruction: `You are a real-time agricultural translator and agronomist assistant. The user wants to communicate in ${targetLangCode}. Translate everything perfectly or answer their agronomy questions in their language.`,
            },
            callbacks: {
              onmessage: (message: LiveServerMessage) => {
                const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audio && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ audio }));
                }
                if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ interrupted: true }));
                }
              },
            },
          });
        } catch (err) {
          console.error("Live API Connection Error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: "Failed to connect to AI assistant" }));
          }
        }
      } else if (msg.audio && session) {
        // Send audio frame to Gemini
        session.sendRealtimeInput({
          audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
        }).catch((err: any) => console.error("Realtime input err:", err));
      }
    });

    clientWs.on("close", () => {
      if (session) {
        // session.close() is typically not explicitly needed if the stream breaks, but you can clean up
      }
    });
  });

  app.use(express.json({ limit: '50mb' }));

  // --- Gemini API Endpoints ---
  
  // Video Generation (Start)
  app.post('/api/video-generate', async (req, res) => {
    try {
      const { prompt, imageBase64 } = req.body;
      
      let payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      };

      if (prompt) payload.prompt = prompt;
      if (imageBase64) {
        payload.image = {
          imageBytes: imageBase64,
          mimeType: 'image/jpeg'
        };
      }

      const operation = await ai.models.generateVideos(payload);
      res.json({ operationName: operation.name });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Video Generation (Poll Status)
  app.post('/api/video-status', async (req, res) => {
    try {
      const { operationName } = req.body;
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json({ done: updated.done });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Video Generation (Download)
  app.post('/api/video-download', async (req, res) => {
    try {
      const { operationName } = req.body;
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: 'Video URI not found' });
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY as string },
      });
      
      res.setHeader('Content-Type', 'video/mp4');
      videoRes.body!.pipeTo(
        new WritableStream({
          write(chunk) { res.write(chunk); },
          close() { res.end(); },
        })
      );
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Audio Transcription
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: { 
          parts: [
            { inlineData: { mimeType: mimeType || 'audio/mp3', data: audioBase64 } },
            { text: "Transcribe this audio precisely. Do not output anything other than the exact transcription." }
          ]
        },
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Maps Grounding
  app.post('/api/maps-grounding', async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }]
        }
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- End Gemini Endpoints ---

  // Initialize Eden II Edge Controller Daemon
  const edgeDaemon = new EdenEdgeDaemon({
    nodeId: 'US-CAL-01-EDEN',
    pollIntervalMs: 1000,
    batchIntervalMs: 5000,
    centralPlatformEndpoint: 'http://localhost:3000/api/telemetry/ingest'
  });

  edgeDaemon.on('sample', (packet: EdenNodeTelemetryPacket) => {
    latestEdgePacket = packet;
    io.emit('edge_sample', packet);
  });

  edgeDaemon.on('batch_created', (batch: TelemetryBatch) => {
    edgeBatchesHistory.unshift(batch);
    if (edgeBatchesHistory.length > 50) {
      edgeBatchesHistory.pop();
    }
    io.emit('edge_batch', batch);
  });

  edgeDaemon.on('failsafe_tripped', (tripEvent: any) => {
    io.emit('maintenance_alert', {
      id: crypto.randomUUID(),
      nodeId: edgeDaemon.nodeId,
      timestamp: tripEvent.timestamp,
      severity: 'CRITICAL',
      message: tripEvent.reasons.join(' | '),
      type: 'SIL3_HARDWARE_INTERLOCK'
    });
  });

  edgeDaemon.start();

  // --- Edge Controller Daemon APIs ---

  // Get current edge controller status, sensor readings, and SIL-3 interlocks
  app.get('/api/edge/status', (req, res) => {
    res.json({
      status: edgeDaemon.getStatus(),
      latestPacket: latestEdgePacket,
      recentBatches: edgeBatchesHistory.slice(0, 10),
    });
  });

  // Fetch recent 5-second hashed batches for EcoCreditX dMRV
  app.get('/api/edge/batches', (req, res) => {
    res.json(edgeBatchesHistory);
  });

  // Inject simulation events for hardware & safety verification
  app.post('/api/edge/simulate', (req, res) => {
    const { action, value } = req.body;
    switch (action) {
      case 'PRESSURE_SPIKE':
        edgeDaemon.triggerPressureAnomaly(value || 638.0);
        res.json({ success: true, message: 'Simulating hydraulic intensifier pressure spike above 620 Bar.' });
        break;
      case 'HYDROGEN_LEAK':
        edgeDaemon.triggerHydrogenLeak(value || 14.2);
        res.json({ success: true, message: 'Simulating optical hydrogen sensor breach (>10% LEL).' });
        break;
      case 'FOLIAR_DRIFT':
        edgeDaemon.triggerFoliarRatioError();
        res.json({ success: true, message: 'Simulated foliar ratio drift. Solenoid locked.' });
        break;
      case 'RESET_SAFETY':
        edgeDaemon.resetSafetyActuators();
        res.json({ success: true, message: 'SIL-3 safety interlocks and actuators reset to nominal.' });
        break;
      default:
        res.status(400).json({ error: `Unknown simulation action: ${action}` });
    }
  });

  // Remote Control / MQTT Command Endpoint
  app.post('/api/node/command', (req, res) => {
    const { nodeId, command } = req.body;
    const timestamp = new Date().toISOString();

    if (command === 'SHUTDOWN' || command === 'OVERRIDE') {
      if (command === 'SHUTDOWN') {
        edgeDaemon.triggerHydrogenLeak(12.0); // Triggers immediate safe isolation
      } else if (command === 'OVERRIDE') {
        edgeDaemon.resetSafetyActuators();
      }
    }
    
    // Simulate MQTT transmission delay
    setTimeout(() => {
      // Broadcast maintenance alert so UI sees it
      io.emit('maintenance_alert', {
        id: crypto.randomUUID(),
        nodeId,
        timestamp,
        severity: 'CRITICAL',
        message: `MANUAL OVERRIDE: ${command} executed via MQTT.`,
        type: 'USER_COMMAND'
      });
      
      res.json({ success: true, message: `MQTT command ${command} delivered to ${nodeId}/rx` });
    }, 1000);
  });

  // 1. VCM Minting & Telemetry Ingestion API (ACID Simulation)
  app.post('/api/telemetry/ingest', (req, res) => {
    const { nodeId, metrics } = req.body;
    const timestamp = new Date().toISOString();
    
    // Cryptographic hashing for immutability
    const dataString = JSON.stringify({ nodeId, metrics, timestamp });
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    // Simulate Blockchain Minting logic (e.g. ideal conditions grant more credits)
    let creditMinted = 0;
    if (metrics.ph > 6.0 && metrics.ph < 7.5 && metrics.pressure < 620) {
      creditMinted = parseFloat((Math.random() * 0.05 + 0.01).toFixed(4));
    }

    const ledgerEntry = {
      id: crypto.randomUUID(),
      nodeId,
      timestamp,
      hash,
      metrics,
      creditMinted,
      status: 'VERIFIED_ON_CHAIN'
    };

    // Simulated ACID transaction
    vcmLedger.unshift(ledgerEntry);
    
    // Keep last 100 telemetry points to avoid memory bloat
    telemetryHistory.push(ledgerEntry);
    if (telemetryHistory.length > 100) {
      telemetryHistory.shift();
    }
    
    // Broadcast live telemetry update
    io.emit('telemetry_update', ledgerEntry);

    // 2. Predictive Maintenance Anomaly Detection
    // Analyzes the current batch for dangerous thresholds
    if (metrics.pressure > 620 || metrics.temperature > 400 || metrics.ph < 5.0 || metrics.ph > 8.0) {
      let issue = [];
      if (metrics.pressure > 620) issue.push('Hydraulic Pressure over safe limits (Pump Cavitation risk).');
      if (metrics.temperature > 400) issue.push('Reactor Temp critical (Overheat risk).');
      if (metrics.ph < 5.0 || metrics.ph > 8.0) issue.push('Soil/Reactor pH out of bounds (Biological die-off risk).');

      const alert = {
        id: crypto.randomUUID(),
        nodeId,
        timestamp,
        severity: 'CRITICAL',
        message: `High probability of hardware failure. ${issue.join(' ')}`,
        type: 'PREDICTIVE_MAINTENANCE'
      };
      
      // Emit alert to connected clients
      io.emit('maintenance_alert', alert);
      
      // In production: Integrate Twilio (SMS), SendGrid (Email) here.
      console.log(`[ALERT] Sent Email/SMS for Node ${nodeId}: ${alert.message}`);
    }

    res.json({ success: true, ledgerEntry });
  });

  // Fetch initial dashboard telemetry history
  app.get('/api/telemetry/history', (req, res) => {
    res.json(telemetryHistory);
  });

  // Fetch VCM Ledger
  app.get('/api/vcm/ledger', (req, res) => {
    res.json(vcmLedger);
  });

  // Simulated Edge Device emitting data every 3 seconds for demonstration
  let timeOffset = 0;
  setInterval(() => {
    const mockMetrics = {
      ph: parseFloat((6.5 + (Math.random() * 1.5 - 0.75)).toFixed(2)),
      pressure: parseFloat((590 + (Math.random() * 40)).toFixed(1)),
      temperature: parseFloat((380 + (Math.random() * 30)).toFixed(1))
    };
    
    // Periodically force an anomaly to trigger the predictive maintenance alert
    timeOffset++;
    if (timeOffset % 15 === 0) {
      mockMetrics.pressure = 635; // Trigger pressure anomaly
    }

    // Fire ingestion endpoint internally
    fetch('http://localhost:3000/api/telemetry/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'US-CAL-01-EDEN', metrics: mockMetrics })
    }).catch(err => console.error('Internal fetch failed:', err.message));
  }, 3000);

  // Vite integration for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
