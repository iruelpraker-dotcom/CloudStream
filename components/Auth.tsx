
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API Response
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      role: username.toLowerCase().includes('admin') ? 'admin' : 'user',
      quotaGB: 1,
      usedBytes: 0,
      expiryDate: expiry.toISOString(),
      rtmpKeys: {}
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-indigo-500/20">CS</div>
          <h2 className="text-3xl font-bold">CloudStream</h2>
          <p className="text-neutral-400 mt-2">Professional 24/7 Cloud Multi-Streaming</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-2xl space-y-6">
          <h3 className="text-xl font-semibold text-center">{isLogin ? 'Welcome Back' : 'Create Trial Account'}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Username</label>
              <input 
                type="text" 
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
             <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-lg flex gap-3">
               <div className="text-indigo-400">ℹ️</div>
               <p className="text-xs text-indigo-200">New accounts receive 1GB Storage & 24h Free Trial automatically.</p>
             </div>
          )}

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
          >
            {isLogin ? 'Log In' : 'Start Trial'}
          </button>

          <p className="text-center text-sm text-neutral-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 ml-1 font-medium hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
