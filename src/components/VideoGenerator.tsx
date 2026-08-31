import React, { useState, useRef } from 'react';
import { Upload, Video, Loader2, Play } from 'lucide-react';

export const VideoGenerator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewBase64(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const pollStatus = async (operationName: string) => {
    setStatusText('Rendering Frames...');
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        });
        const data = await res.json();
        
        if (data.done) {
          clearInterval(interval);
          downloadVideo(operationName);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 5000);
  };

  const downloadVideo = async (operationName: string) => {
    setStatusText('Downloading Output...');
    try {
      const res = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName })
      });
      
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setIsGenerating(false);
      setStatusText('');
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setStatusText('Error downloading video');
    }
  };

  const handleGenerate = async () => {
    if (!previewBase64) return;
    setIsGenerating(true);
    setVideoUrl(null);
    setStatusText('Initializing VEO Model...');

    try {
      // Base64 without data URL prefix
      const base64Data = previewBase64.split(',')[1];

      const res = await fetch('/api/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageBase64: base64Data })
      });
      const data = await res.json();

      if (data.operationName) {
        pollStatus(data.operationName);
      } else {
        throw new Error('No operation name returned');
      }
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setStatusText('Generation Failed');
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <div className="glass p-6 flex flex-col gap-4">
        <h2 className="text-sm font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
          <Video className="w-4 h-4 text-emerald-400" />
          Neural Video Generation (VEO)
        </h2>
        <p className="text-xs text-slate-400">
          Upload a structural blueprint or field image, and generate an animated simulation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="flex flex-col gap-4">
            <div 
              className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewBase64 ? (
                <img src={previewBase64} alt="Preview" className="object-cover w-full h-full opacity-50" />
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">Select Reference Frame</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange} 
            />

            <input 
              type="text" 
              placeholder="Motion prompt (e.g. 'Water flows gently through the irrigation pipes...')"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="bg-[#05070a] border border-slate-700 rounded px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 placeholder:text-slate-600"
            />
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !previewBase64}
              className="bg-emerald-500 text-black font-bold uppercase tracking-widest text-xs py-4 rounded hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> {statusText}</> : 'Initialize Sequence'}
            </button>
          </div>

          <div className="flex flex-col">
            <div className="h-64 md:h-full border border-slate-800 bg-[#05070a] rounded-lg flex items-center justify-center relative overflow-hidden group">
              {videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-700">
                  <Play className="w-12 h-12 mb-2 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Output Feed Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
