import React from 'react';
import { Wheat, Coffee, Sprout, Trees, Apple, Flower2, Leaf, Sparkles } from 'lucide-react';

export type CropIconKey = 'maize' | 'coffee' | 'wheat' | 'corn' | 'soybean' | 'potatoes' | 'cassava' | 'rice' | 'sugarcane' | 'water_drop' | 'gallon_jug';

interface IconCropSelectorProps {
  selectedCrop: CropIconKey;
  onSelectCrop: (crop: CropIconKey) => void;
  disabled?: boolean;
}

export const CROPS: { id: CropIconKey; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'maize', label: 'MAIZE / CORN', icon: <Sprout className="w-10 h-10" />, color: 'border-amber-400 text-amber-300' },
  { id: 'coffee', label: 'COFFEE BEANS', icon: <Coffee className="w-10 h-10" />, color: 'border-yellow-600 text-yellow-500' },
  { id: 'wheat', label: 'WHEAT / GRAIN', icon: <Wheat className="w-10 h-10" />, color: 'border-amber-500 text-amber-400' },
  { id: 'soybean', label: 'SOYBEAN', icon: <Trees className="w-10 h-10" />, color: 'border-emerald-400 text-emerald-300' },
  { id: 'potatoes', label: 'POTATOES', icon: <Apple className="w-10 h-10" />, color: 'border-orange-500 text-orange-400' },
  { id: 'cassava', label: 'CASSAVA / MANIOC', icon: <Flower2 className="w-10 h-10" />, color: 'border-lime-500 text-lime-400' },
  { id: 'rice', label: 'PADDY RICE', icon: <Leaf className="w-10 h-10" />, color: 'border-cyan-400 text-cyan-300' },
  { id: 'sugarcane', label: 'SUGARCANE', icon: <Sparkles className="w-10 h-10" />, color: 'border-teal-400 text-teal-300' },
];

export const IconCropSelector: React.FC<IconCropSelectorProps> = ({
  selectedCrop,
  onSelectCrop,
  disabled = false
}) => {
  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
          SELECT CROP / CHAGUA ZAO
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CROPS.map((crop) => {
          const isSelected = selectedCrop === crop.id;
          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => !disabled && onSelectCrop(crop.id)}
              disabled={disabled}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all border-4 cursor-pointer ${
                isSelected 
                  ? `${crop.color} bg-slate-900 shadow-[0_0_25px_rgba(234,179,8,0.4)] scale-105` 
                  : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
              }`}
            >
              {crop.icon}
              <span className={`text-[11px] font-black tracking-wider uppercase text-center ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                {crop.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

