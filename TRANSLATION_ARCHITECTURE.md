# NexusLIMS Translation & WebRTC Architecture Guide

## PART 1: App Localization (UI/UX)

### 1. Static UI Localization Framework
**Recommendation:** **`i18next`** with `react-i18next`.
*   **Why:** It is the industry standard for React apps, offering robust fallback languages, pluralization, string interpolation, and async loading of translation namespaces (crucial for low-bandwidth environments where you only want to load the language the user needs).
*   **Implementation:** Store language files in a CDN or alongside the frontend bundle (`public/locales/{lang}/translation.json`). Use the `I18nextProvider` at the root of the React app.

### 2. Handling Dynamic IoT Data Translation
IoT telemetry often consists of dynamic string keys and raw values (e.g., `HYDRAULIC_PRESSURE: 600`).
*   **Strategy:** Map hardware telemetry keys to translation dictionary keys.
*   **Example:** Instead of passing raw strings to the UI, the backend sends standardized event codes: `{ "code": "ERR_PUMP_CAVITATION", "val": 600 }`.
*   **Frontend Resolution:** 
    ```javascript
    // In English translation.json: "ERR_PUMP_CAVITATION": "Pump Cavitation Warning: Pressure at {{val}} BAR"
    // In Swahili translation.json: "ERR_PUMP_CAVITATION": "Onyo la Cavitation ya Pampu: Shinikizo katika {{val}} BAR"
    t(alert.code, { val: alert.val })
    ```

---

## PART 2: The Universal Translator (Live Video/Voice Calls)

This architecture bridges the **LiveKit WebRTC Server** with the **Gemini Live API** to achieve real-time, low-latency audio translation and conversational intelligence.

### 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Clients
        CA[California Grower - EN]
        KC[Kenya Cooperative - SW]
    end

    subgraph LiveKit Cloud / Edge SFU
        LK_Room[WebRTC Room]
        CA -- "Publish Audio (EN)" --> LK_Room
        KC -- "Publish Audio (SW)" --> LK_Room
    end

    subgraph Translation Backend Service (Node.js)
        LK_Agent[LiveKit Agent Session]
        LK_Room -- "Subscribe to Tracks" --> LK_Agent
        
        subgraph Gemini Live API (WebSockets)
            GEM_Trans[gemini-3.1-flash-live-preview]
        end
        
        LK_Agent -- "Stream 16kHz PCM (EN)" --> GEM_Trans
        GEM_Trans -- "Stream 24kHz PCM (SW)" --> LK_Agent
        
        LK_Agent -- "Publish Translated Track" --> LK_Room
    end

    LK_Room -- "Subscribe to Translated Audio" --> CA
    LK_Room -- "Subscribe to Translated Audio" --> KC
```

### 2. LiveKit & Gemini Integration Code (Backend Node.js)

```typescript
import { RoomServiceClient, Room, RemoteParticipant, RemoteTrackPublication, RemoteAudioTrack } from 'livekit-server-sdk';
import { GoogleGenAI } from '@google/genai';
import WebSocket from 'ws';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const livekitHost = process.env.LIVEKIT_URL;

async function startTranslationAgent(roomName: string, sourceLang: string, targetLang: string) {
  // 1. Connect to LiveKit Room as a hidden Agent
  const room = new Room();
  await room.connect(livekitHost, process.env.LIVEKIT_AGENT_TOKEN);

  // 2. Initialize Gemini Live API WebSocket (Interactions API)
  const client = await ai.clients.createLiveClient({
    model: 'models/gemini-3.1-flash-live-preview',
    config: {
      systemInstruction: `You are a real-time translator. Translate all incoming audio from ${sourceLang} to ${targetLang}. Speak only the translation.`,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
        }
      }
    }
  });

  // 3. Pipe WebRTC Audio -> Gemini -> WebRTC
  room.on('trackSubscribed', (track: RemoteAudioTrack, publication: RemoteTrackPublication, participant: RemoteRemoteParticipant) => {
    console.log(`Subscribed to ${participant.identity}'s audio. Streaming to Gemini...`);
    
    // Read raw 16kHz PCM from LiveKit
    track.on('audioFrame', (frame) => {
      client.send({
        realtimeInput: {
          mediaChunks: [{
            mimeType: "audio/pcm;rate=16000",
            data: frame.data.toString('base64')
          }]
        }
      });
    });
  });

  // Receive translated 24kHz PCM from Gemini
  client.on('serverContent', (content) => {
    if (content.modelTurn?.parts) {
      const audioData = content.modelTurn.parts[0].inlineData.data;
      // Publish this audioData back to the LiveKit room as the translated track
      publishTranslatedAudioToLiveKit(room, Buffer.from(audioData, 'base64'));
    }
  });

  await client.connect();
}
```

### 3. Frontend State Management (React)

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSelector = ({ onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');

  const languages = [
    { code: 'en', label: 'English (US)' },
    { code: 'sw', label: 'Kiswahili (KE)' },
    { code: 'es', label: 'Español (ES)' }
  ];

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelectedLang(lang);
    
    // 1. Update UI Language statically
    i18n.changeLanguage(lang);
    
    // 2. Notify backend of translation preference for the WebRTC Agent
    onLanguageChange(lang);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] uppercase tracking-widest text-slate-500">
        Comms Language
      </label>
      <select 
        value={selectedLang} 
        onChange={handleSelect}
        className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
      >
        {languages.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
};
```
