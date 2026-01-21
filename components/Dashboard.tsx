
import React, { useState, useRef, useEffect } from 'react';
import { StreamMode, User, MediaFile, LogEntry } from '../types';
import StreamLogs from './StreamLogs';

interface DashboardProps {
  user: User;
}

const API_BASE = 'http://localhost:3000'; // Change to your VPS IP in production

const PLATFORMS = [
  { name: 'YouTube', url: 'rtmp://a.rtmp.youtube.com/live2/', color: 'text-red-500', icon: 'M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z' },
  { name: 'Facebook', url: 'rtmps://live-api-s.facebook.com:443/rtmp/', color: 'text-blue-500', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { name: 'TikTok', url: 'rtmp://', color: 'text-white', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-4.17.01-8.33.01-12.5z' },
  { name: 'Shopee Live', url: 'rtmp://', color: 'text-orange-500', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' },
  { name: 'Twitch', url: 'rtmp://live.twitch.tv/app/', color: 'text-purple-500', icon: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z' }
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [mode, setMode] = useState<StreamMode>(StreamMode.VIDEO);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaFile | null>(null);
  const [bgImage, setBgImage] = useState<MediaFile | null>(null);
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
    // Fetch initial files
    fetch(`${API_BASE}/api/media/${user.id}`)
        .then(res => res.json())
        .then(data => setFiles(data));
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
        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });
        const newFile = await response.json();
        setFiles(prev => [...prev, { ...newFile, type: fileType }]);
        addLog(`Successfully uploaded ${file.name}`);
    } catch (err) {
        addLog(`Upload failed: ${err.message}`, 'error');
    } finally {
        setIsUploading(false);
    }
  };

  const startStream = async () => {
    if (!serverUrl || !streamKey) return alert("Enter Server URL and Key");
    if (mode === StreamMode.VIDEO && !selectedVideo) return alert("Select a video");

    const fullRtmp = serverUrl.endsWith('/') ? `${serverUrl}${streamKey}` : `${serverUrl}/${streamKey}`;
    
    try {
        const fileIds = mode === StreamMode.VIDEO ? [selectedVideo?.id] : [bgImage?.id, ...files.filter(f => f.type === 'audio').map(a => a.id)];
        
        await fetch(`${API_BASE}/api/stream/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                rtmpUrl: fullRtmp,
                mode,
                fileIds,
                loop: isLoop
            })
        });

        setIsLive(true);
        addLog("Stream command sent to server", "info");
    } catch (err) {
        addLog(`Failed to start stream: ${err.message}`, 'error');
    }
  };

  const stopStream = async () => {
    try {
        await fetch(`${API_BASE}/api/stream/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        setIsLive(false);
        addLog("Stream stopped successfully", "info");
    } catch (err) {
        addLog("Stop request failed", 'error');
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar & Controls UI stays identical to previous response for consistency */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold">Streaming Setup</h2>
                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Configure your live output</p>
                </div>
                <div className="flex bg-neutral-800 p-1 rounded-xl w-full md:w-auto">
                    <button 
                        onClick={() => setMode(StreamMode.VIDEO)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === StreamMode.VIDEO ? 'bg-indigo-600' : 'text-neutral-400'}`}
                    >Video</button>
                    <button 
                        onClick={() => setMode(StreamMode.AUDIO_PLAYLIST)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === StreamMode.AUDIO_PLAYLIST ? 'bg-indigo-600' : 'text-neutral-400'}`}
                    >Audio</button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative" ref={dropdownRef}>
                    <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3">
                        <input 
                            className="flex-1 bg-transparent border-none outline-none text-sm"
                            placeholder="Server URL"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                        />
                        <button onClick={() => setShowPlatformDropdown(!showPlatformDropdown)} className="ml-2">
                             {selectedPlatform ? <svg className={`w-5 h-5 ${selectedPlatform.color}`} fill="currentColor" viewBox="0 0 24 24"><path d={selectedPlatform.icon} /></svg> : "▼"}
                        </button>
                    </div>
                    {showPlatformDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {PLATFORMS.map(p => (
                                <button key={p.name} onClick={() => { setSelectedPlatform(p); setServerUrl(p.url); setShowPlatformDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex gap-3 text-sm">
                                    <svg className={`w-4 h-4 ${p.color}`} fill="currentColor" viewBox="0 0 24 24"><path d={p.icon} /></svg> {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <input 
                    type="password" 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm" 
                    placeholder="Stream Key" 
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                />
                
                <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-xl">
                    <span className="text-sm font-bold">Infinite Loop</span>
                    <button onClick={() => setIsLoop(!isLoop)} className={`w-12 h-6 rounded-full ${isLoop ? 'bg-indigo-600' : 'bg-neutral-800'} transition-all relative`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLoop ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex gap-4 mt-6">
                    {isLive ? (
                        <button onClick={stopStream} className="flex-1 bg-red-600 py-4 rounded-xl font-bold">STOP LIVE</button>
                    ) : (
                        <button onClick={startStream} className="flex-1 bg-green-600 py-4 rounded-xl font-bold">GO LIVE</button>
                    )}
                </div>
            </div>
        </div>

        {/* Media List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
             <div className="flex justify-between mb-4">
                <h3 className="font-bold">Media Files</h3>
                <label className="text-xs bg-indigo-600 px-3 py-1 rounded cursor-pointer uppercase font-bold">
                    {isUploading ? "Uploading..." : "Upload File"}
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, mode === StreamMode.VIDEO ? 'video' : 'audio')} />
                </label>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.filter(f => mode === StreamMode.VIDEO ? f.type === 'video' : f.type !== 'video').map(file => (
                    <div 
                        key={file.id} 
                        onClick={() => mode === StreamMode.VIDEO ? setSelectedVideo(file) : (file.type === 'image' ? setBgImage(file) : null)}
                        className={`aspect-video bg-black rounded-lg border-2 ${selectedVideo?.id === file.id || bgImage?.id === file.id ? 'border-indigo-500' : 'border-transparent'} overflow-hidden relative cursor-pointer`}
                    >
                         {file.type === 'image' ? <img src={file.url} className="w-full h-full object-cover opacity-50" /> : <div className="p-4 text-[10px] break-all">{file.filename || file.name}</div>}
                    </div>
                ))}
             </div>
        </div>

        <StreamLogs logs={logs} />
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-800 font-bold text-xs uppercase text-neutral-400">Preview</div>
            <div className="aspect-video bg-black flex items-center justify-center">
                {selectedVideo ? <video src={selectedVideo.url} className="w-full" autoPlay muted loop /> : <p className="text-neutral-700 text-xs">No media selected</p>}
            </div>
        </div>
        
        <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
            <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-neutral-500">QUOTA: {(user.usedBytes / 1e6).toFixed(1)}MB / {user.quotaGB}GB</span>
                <span className={usedPercentage > 90 ? 'text-red-500' : 'text-indigo-400'}>{usedPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${usedPercentage}%` }} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
