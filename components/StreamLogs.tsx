
import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface StreamLogsProps {
  logs: LogEntry[];
}

const StreamLogs: React.FC<StreamLogsProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/30">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> FFMPEG TERMINAL OUTPUT
        </h3>
        <span className="text-[10px] text-neutral-600 font-mono">Process ID: 29482</span>
      </div>
      <div 
        ref={scrollRef}
        className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/50"
      >
        {logs.length === 0 && (
            <p className="text-neutral-700 italic">Waiting for process start...</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-neutral-600 flex-shrink-0">[{log.timestamp}]</span>
            <span className={`
                ${log.type === 'error' ? 'text-red-500' : ''}
                ${log.type === 'ffmpeg' ? 'text-blue-400' : ''}
                ${log.type === 'info' ? 'text-emerald-400 font-bold' : ''}
                break-all
            `}>
              {log.type === 'ffmpeg' && <span className="text-neutral-500 mr-2">ffmpeg &gt;</span>}
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StreamLogs;
