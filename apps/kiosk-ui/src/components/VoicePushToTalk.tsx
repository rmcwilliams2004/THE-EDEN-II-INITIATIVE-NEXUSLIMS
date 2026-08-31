import React from 'react';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';

interface VoicePushToTalkProps {
  isListening: boolean;
  isSpeaking: boolean;
  onPress: () => void;
  onRelease: () => void;
  disabled?: boolean;
}

export const VoicePushToTalk: React.FC<VoicePushToTalkProps> = ({
  isListening,
  isSpeaking,
  onPress,
  onRelease,
  disabled = false
}) => {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <button
        type="button"
        onMouseDown={onPress}
        onMouseUp={onRelease}
        onTouchStart={onPress}
        onTouchEnd={onRelease}
        disabled={disabled}
        className={`w-36 h-36 md:w-44 md:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-200 border-4 shadow-2xl ${
          isListening 
            ? 'bg-emerald-500 text-slate-950 border-white scale-105 shadow-[0_0_50px_rgba(16,185,129,0.7)] animate-pulse' 
            : isSpeaking
              ? 'bg-blue-600 text-white border-blue-300 shadow-[0_0_40px_rgba(59,130,246,0.6)]'
              : 'bg-slate-900 text-emerald-400 border-emerald-500 hover:bg-slate-850 active:scale-95'
        }`}
      >
        {isListening ? (
          <>
            <Radio className="w-16 h-16 animate-spin" />
            <span className="font-extrabold uppercase text-xs tracking-widest mt-2">LISTENING</span>
          </>
        ) : isSpeaking ? (
          <>
            <Volume2 className="w-16 h-16 animate-bounce" />
            <span className="font-extrabold uppercase text-xs tracking-widest mt-2">SPEAKING</span>
          </>
        ) : (
          <>
            <Mic className="w-16 h-16" />
            <span className="font-extrabold uppercase text-xs tracking-widest mt-2 text-emerald-300">HOLD TO TALK</span>
          </>
        )}
      </button>

      <div className="text-center">
        <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
          {isListening ? 'RELEASE WHEN DONE' : 'PUSH & HOLD GREEN BUTTON'}
        </span>
      </div>
    </div>
  );
};
