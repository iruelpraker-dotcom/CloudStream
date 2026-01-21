
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);

  // Auto-blocking logic: Check expiry
  useEffect(() => {
    if (currentUser) {
      const expiry = new Date(currentUser.expiryDate).getTime();
      const now = new Date().getTime();
      if (now > expiry) {
        alert("Your trial has expired. Please contact admin.");
        setCurrentUser(null);
      }
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Auth onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">CS</div>
          <h1 className="text-xl font-bold tracking-tight">CloudStream <span className="text-indigo-500">SaaS</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setIsAdminView(!isAdminView)}
              className="text-sm font-medium hover:text-indigo-400 transition-colors"
            >
              {isAdminView ? '← Back to Dashboard' : 'Admin Management'}
            </button>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{currentUser.username}</p>
            <p className="text-xs text-neutral-400">Exp: {new Date(currentUser.expiryDate).toLocaleDateString()}</p>
          </div>
          <button 
            onClick={() => setCurrentUser(null)}
            className="bg-neutral-800 hover:bg-red-900/40 text-neutral-300 hover:text-red-400 px-4 py-2 rounded-lg text-sm transition-all border border-neutral-700 hover:border-red-500/50"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {isAdminView && currentUser.role === 'admin' ? (
          <AdminPanel user={currentUser} />
        ) : (
          <Dashboard user={currentUser} />
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-neutral-900 border-t border-neutral-800 px-6 py-2 text-[10px] text-neutral-500 flex justify-between uppercase tracking-widest">
        <div>Engine: FFMPEG v6.0-static</div>
        <div>System Health: Operational</div>
        <div>Active Streams: 0</div>
      </footer>
    </div>
  );
};

export default App;
