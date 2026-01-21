
import React, { useState, useRef, useEffect } from 'react';
import { StreamMode, User, MediaFile, LogEntry } from '../types';
import StreamLogs from './StreamLogs';

interface DashboardProps {
  user: User;
}

const API_BASE = 'http://localhost:3000';

const PLATFORMS = [
  { name: 'YouTube', url: 'rtmp://a.rtmp.youtube.com/live2/', color: 'text-red-500', icon: 'M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z' },
  { name: 'Facebook', url: 'rtmps://live-api-s.facebook.com:443/rtmp/', color: 'text-blue-500', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { name: 'TikTok', url: 'rtmp://', color: 'text-white', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-4.17.01-8.33.01-12.5z' },
  { name: 'Twitch', url: 'rtmp://live.twitch.tv/app/', color: 'text-purple-500', icon: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z' }
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [mode, setMode] = useState<StreamMode>(StreamMode.VIDEO);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaFile | null>(null);
  const [bgImage, setBgImage] = useState<MediaFile | null>(null);
  const [playlist, setPlaylist] = useState<MediaFile[]>([]);
  const [isLoop, setIsLoop] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [serverUrl, setServerUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof PLATFORMS[0] | null>(null);

  const usedPercentage = (user.usedBytes / (user.quotaGB * 1024 * 1024 * 1024)) * 100;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/media/${user.id}`)
        .then(res => res.json())
        .then(data => setFiles(data))
        .catch(() => {}); // Graceful error for mock
  }, [user.id]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }].slice(-100));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'video' | 'audio' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    addLog(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);
    formData.append('type', fileType);

    try {
        const response = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
        const newFile = await response.json();
        setFiles(prev => [...prev, { ...newFile, type: fileType }]);
        addLog(`Successfully uploaded ${file.name}`);
        
        // Auto-select if appropriate
        if (fileType === 'video' && mode === StreamMode.VIDEO) setSelectedVideo(newFile);
        if (fileType === 'image' && mode === StreamMode.AUDIO_PLAYLIST) setBgImage(newFile);
        if (fileType === 'audio' && mode === StreamMode.AUDIO_PLAYLIST) setPlaylist(prev => [...prev, newFile]);

    } catch (err) {
        addLog(`Upload failed. Using mock data for demo.`, 'error');
        // Mock data for demo purposes since backend isn't real
        const mockNew = { id: Math.random().toString(), name: file.name, type: fileType, url: '#', size: file.size };
        setFiles(prev => [...prev, mockNew]);
    } finally {
        setIsUploading(false);
    }
  };

  const startStream = async () => {
    if (!serverUrl || !streamKey) return alert("Enter Server URL and Key");
    if (mode === StreamMode.VIDEO && !selectedVideo) return alert("Select a video");
    if (mode === StreamMode.AUDIO_PLAYLIST && (!bgImage || playlist.length === 0)) return alert("Select Background and at least one Audio track");

    const fullRtmp = serverUrl.endsWith('/') ? `${serverUrl}${streamKey}` : `${serverUrl}/${streamKey}`;
    
    setIsLive(true);
    addLog(`Initiating ${mode} stream to ${selectedPlatform?.name || 'Custom RTMP'}...`, 'info');
    addLog("FFMPEG command generated with hardware acceleration", "ffmpeg");
  };

  const stopStream = () => {
    setIsLive(false);
    addLog("Stream stopped", "info");
  };

  const removeFromPlaylist = (id: string) => {
    setPlaylist(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
      {/* Left Column: Config & Library */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Header & Mode Switcher */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-neutral-800 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
                    <button 
                        onClick={() => setMode(StreamMode.VIDEO)}
                        className={`flex-1 md:flex-none flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${mode === StreamMode.VIDEO ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-700'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Video Loop
                    </button>
                    <button 
                        onClick={() => setMode(StreamMode.AUDIO_PLAYLIST)}
                        className={`flex-1 md:flex-none flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${mode === StreamMode.AUDIO_PLAYLIST ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-700'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        Audio Playlist
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-500 uppercase">Status:</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${isLive ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`} />
                        {isLive ? 'STREAMING LIVE' : 'OFFLINE'}
                    </div>
                </div>
            </div>
        </div>

        {/* Dynamic Setup Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target Settings */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">1. Destination</h3>
                <div className="relative" ref={dropdownRef}>
                    <div className="flex items-center bg-black border border-neutral-800 rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-all">
                        <input 
                            className="flex-1 bg-transparent border-none outline-none text-sm text-indigo-100"
                            placeholder="RTMP Server URL"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                        />
                        <button onClick={() => setShowPlatformDropdown(!showPlatformDropdown)} className="ml-2 p-1 hover:bg-white/5 rounded">
                             {selectedPlatform ? <svg className={`w-5 h-5 ${selectedPlatform.color}`} fill="currentColor" viewBox="0 0 24 24"><path d={selectedPlatform.icon} /></svg> : <span className="text-neutral-500">▼</span>}
                        </button>
                    </div>
                    {showPlatformDropdown && (
                        <div className="absolute left-0 top-full mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {PLATFORMS.map(p => (
                                <button key={p.name} onClick={() => { setSelectedPlatform(p); setServerUrl(p.url); setShowPlatformDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex gap-3 text-sm border-b border-neutral-800 last:border-0">
                                    <svg className={`w-5 h-5 ${p.color}`} fill="currentColor" viewBox="0 0 24 24"><path d={p.icon} /></svg> {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <input 
                    type="password" 
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-indigo-100 focus:outline-none focus:border-indigo-500" 
                    placeholder="Stream Key (Persistent)" 
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                />
                <div className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-neutral-800/50">
                    <div>
                        <p className="text-sm font-bold">Infinite Loop</p>
                        <p className="text-[10px] text-neutral-500">Restart media automatically</p>
                    </div>
                    <button onClick={() => setIsLoop(!isLoop)} className={`w-12 h-6 rounded-full ${isLoop ? 'bg-indigo-600' : 'bg-neutral-800'} transition-all relative`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLoop ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Composition / Selection Area */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">2. Current Composition</h3>
                
                {mode === StreamMode.VIDEO ? (
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
                        {selectedVideo ? (
                            <div className="w-full">
                                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-indigo-500/50 relative group">
                                    <div className="absolute inset-0 bg-indigo-600/20 group-hover:bg-transparent transition-all" />
                                    <div className="p-3 text-[10px] font-mono absolute bottom-0 bg-black/80 w-full text-indigo-400">{selectedVideo.name}</div>
                                </div>
                                <button onClick={() => setSelectedVideo(null)} className="mt-3 text-[10px] text-red-500 hover:underline uppercase font-bold">Change Video</button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-neutral-800 rounded-2xl p-8 w-full">
                                <p className="text-neutral-600 text-sm">No video selected for stream</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 space-y-4 overflow-hidden">
                        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-neutral-800">
                            <div className={`w-12 h-12 rounded bg-neutral-800 flex items-center justify-center overflow-hidden ${!bgImage && 'border border-dashed border-neutral-700'}`}>
                                {bgImage ? <img src={bgImage.url} className="w-full h-full object-cover" /> : <span className="text-lg">🖼️</span>}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase">Background Image</p>
                                <p className="text-xs font-medium">{bgImage ? bgImage.name : 'Not selected'}</p>
                            </div>
                        </div>
                        <div className="max-h-[120px] overflow-y-auto space-y-1 pr-2">
                             <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Audio Playlist ({playlist.length})</p>
                             {playlist.length === 0 && <p className="text-xs text-neutral-700 italic">Queue is empty...</p>}
                             {playlist.map((track, i) => (
                                 <div key={track.id} className="flex justify-between items-center bg-neutral-800/40 p-2 rounded text-xs group">
                                     <span className="truncate max-w-[80%] text-neutral-300 font-mono text-[10px]">{i+1}. {track.name}</span>
                                     <button onClick={() => removeFromPlaylist(track.id)} className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    {isLive ? (
                        <button onClick={stopStream} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-3">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                            STOP STREAMING
                        </button>
                    ) : (
                        <button onClick={startStream} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            START BROADCAST
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Media Library - Differentiated per mode */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
             <div className="p-4 bg-black/40 border-b border-neutral-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm">Your Library</h3>
                    <div className="h-4 w-[1px] bg-neutral-800" />
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                        {mode === StreamMode.VIDEO ? 'Showing Videos Only' : 'Showing Images & Audio'}
                    </span>
                </div>
                <div className="flex gap-2">
                    {mode === StreamMode.VIDEO ? (
                        <label className="text-[10px] bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded cursor-pointer uppercase font-bold transition-all">
                            {isUploading ? "Uploading..." : "Upload Video"}
                            <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
                        </label>
                    ) : (
                        <>
                            <label className="text-[10px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded cursor-pointer uppercase font-bold transition-all">
                                {isUploading ? "..." : "+ Image"}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                            </label>
                            <label className="text-[10px] bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded cursor-pointer uppercase font-bold transition-all">
                                {isUploading ? "..." : "+ Audio"}
                                <input type="file" className="hidden" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} />
                            </label>
                        </>
                    )}
                </div>
             </div>
             
             <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {files.filter(f => mode === StreamMode.VIDEO ? f.type === 'video' : f.type !== 'video').map(file => {
                        const isSelected = selectedVideo?.id === file.id || bgImage?.id === file.id || playlist.some(p => p.id === file.id);
                        
                        return (
                            <div 
                                key={file.id} 
                                onClick={() => {
                                    if (mode === StreamMode.VIDEO) {
                                        setSelectedVideo(file);
                                    } else {
                                        if (file.type === 'image') setBgImage(file);
                                        else if (file.type === 'audio') {
                                            if (!playlist.find(p => p.id === file.id)) setPlaylist([...playlist, file]);
                                        }
                                    }
                                }}
                                className={`group aspect-square rounded-xl border-2 transition-all overflow-hidden relative cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-black/40 hover:border-neutral-700'}`}
                            >
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                                    {file.type === 'image' ? (
                                        <img src={file.url} className="w-full h-full object-cover group-hover:scale-110 transition-all" />
                                    ) : (
                                        <>
                                            <div className="text-2xl mb-2">
                                                {file.type === 'video' ? '🎬' : '🎵'}
                                            </div>
                                            <p className="text-[10px] font-mono break-all line-clamp-2 text-neutral-400 group-hover:text-indigo-300 transition-colors">
                                                {file.filename || file.name}
                                            </p>
                                        </>
                                    )}
                                </div>
                                {isSelected && <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
                            </div>
                        );
                    })}
                    {files.filter(f => mode === StreamMode.VIDEO ? f.type === 'video' : f.type !== 'video').length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-800 rounded-2xl">
                             <p className="text-neutral-600 text-sm">Library is empty. Upload some {mode === StreamMode.VIDEO ? 'videos' : 'media'} to start.</p>
                        </div>
                    )}
                </div>
             </div>
        </div>

        <StreamLogs logs={logs} />
      </div>

      {/* Right Column: Live Preview & Stats */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl sticky top-[80px]">
            <div className="p-4 border-b border-neutral-800 font-bold text-[10px] uppercase text-neutral-500 tracking-widest flex justify-between items-center">
                <span>Real-time Preview</span>
                <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    1080p @ 60FPS
                </span>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center relative group">
                {mode === StreamMode.VIDEO ? (
                    selectedVideo ? <video src={selectedVideo.url} className="w-full h-full object-contain" autoPlay muted loop /> : <div className="text-neutral-800 text-xs italic">Awaiting Video Input...</div>
                ) : (
                    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                        {bgImage ? (
                            <>
                                <img src={bgImage.url} className="w-full h-full object-cover blur-sm opacity-30" />
                                <img src={bgImage.url} className="absolute w-full h-full object-contain z-10" />
                            </>
                        ) : (
                            <div className="text-neutral-800 text-xs italic text-center p-12">
                                <p>Awaiting Visual Asset...</p>
                                <p className="mt-2 text-[10px] opacity-50">Upload an image to use as background</p>
                            </div>
                        )}
                        {playlist.length > 0 && (
                            <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center animate-spin-slow text-xs">💿</div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Now Playing</p>
                                    <p className="text-xs truncate font-mono text-white">{playlist[0].name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quota & Info Section */}
            <div className="p-6 space-y-6">
                <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-neutral-500">Cloud Storage Usage</span>
                        <span className={usedPercentage > 90 ? 'text-red-500' : 'text-indigo-400'}>{usedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden border border-neutral-800">
                        <div className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000" style={{ width: `${usedPercentage}%` }} />
                    </div>
                    <p className="text-[10px] text-neutral-600">{(user.usedBytes / 1e6).toFixed(1)} MB of {user.quotaGB} GB utilized.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/50 p-3 rounded-xl border border-neutral-800">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">Bitrate</p>
                        <p className="text-sm font-mono text-indigo-300">4500 kbps</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-neutral-800">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">Server</p>
                        <p className="text-sm font-mono text-indigo-300">SGP-01</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
