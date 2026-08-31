import React, { useState, useRef } from 'react';
import { Mic, Loader2, FileAudio } from 'lucide-react';

export const AudioTranscription = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTranscribe = () => {
    if (!file) return;
    setIsTranscribing(true);
    setTranscription('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64Data, mimeType: file.type })
        });
        const data = await res.json();
        if (data.text) {
          setTranscription(data.text);
        } else {
          setTranscription('Error: Could not transcribe.');
        }
      } catch (err) {
        setTranscription('Network error occurred.');
      }
      setIsTranscribing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="glass p-6 rounded-lg flex flex-col gap-4 border border-slate-800">
      <h2 className="text-sm font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
        <FileAudio className="w-4 h-4 text-emerald-400" />
        Log Transcription
      </h2>
      
      <div className="flex gap-4 items-center">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 text-xs py-2 px-4 rounded transition-colors"
        >
          {file ? file.name : 'Select Audio File'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="audio/*"
          onChange={handleFileChange} 
        />
        
        <button 
          onClick={handleTranscribe}
          disabled={!file || isTranscribing}
          className="bg-emerald-500/20 text-emerald-400 font-bold uppercase text-xs py-2 px-6 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-emerald-500/50"
        >
          {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transcribe'}
        </button>
      </div>

      {transcription && (
        <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded text-sm text-slate-300 leading-relaxed font-serif">
          {transcription}
        </div>
      )}
    </div>
  );
};
