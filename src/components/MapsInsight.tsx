import React, { useState } from 'react';
import { Map, Loader2, Search } from 'lucide-react';

export const MapsInsight = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setResponse('');

    try {
      const res = await fetch('/api/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });
      const data = await res.json();
      if (data.text) {
        setResponse(data.text);
      } else {
        setResponse('Error querying geospatial intelligence.');
      }
    } catch (err) {
      setResponse('Network error occurred.');
    }
    setIsSearching(false);
  };

  return (
    <div className="glass p-6 rounded-lg flex flex-col gap-4 border border-slate-800">
      <h2 className="text-sm font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
        <Map className="w-4 h-4 text-emerald-400" />
        Geospatial Intelligence
      </h2>
      <p className="text-xs text-slate-400">
        Query the global geospatial database (Maps Grounding) for environmental or location data.
      </p>
      
      <div className="flex gap-4 items-center">
        <input 
          type="text" 
          placeholder="e.g. Find the nearest agricultural supplier in Nairobi"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 placeholder:text-slate-600"
        />
        <button 
          onClick={handleSearch}
          disabled={!query || isSearching}
          className="bg-emerald-500/20 text-emerald-400 font-bold uppercase text-xs py-2 px-6 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-emerald-500/50 h-10"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {response && (
        <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded text-sm text-slate-300 leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
          {response}
        </div>
      )}
    </div>
  );
};
