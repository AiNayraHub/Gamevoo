import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Play, Video, Gift, Gamepad2, Mail, Lock } from 'lucide-react';

const GamevooWebsite = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Login Function for Supabase
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Login Successful!");
      setIsLoggedIn(true);
    }
    setLoading(false);
  };

  if (isLoggedIn) {
    return <HomeScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center p-4 font-sans">
      {/* Login Card - UI same as Photo */}
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-8 text-center border border-white overflow-hidden">
        
        {/* Logo Section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 via-purple-500 to-orange-400 rounded-3xl flex items-center justify-center shadow-lg transform rotate-6 mb-4">
             <Gamepad2 size={50} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-[#3b82f6] tracking-tight">Gamevoo</h1>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign in to earn coins!</h2>
        <p className="text-gray-500 text-sm mb-6">Play games, watch videos, enter gift codes!</p>

        {/* Email & Password Fields */}
        <form onSubmit={handleLogin} className="space-y-3 mb-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email ID" 
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white py-4 rounded-full font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
          >
            {loading ? 'Processing...' : 'Start Now'}
          </button>
        </form>

        <div className="text-gray-400 text-sm mb-6">— OR —</div>

        <button className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-2xl mb-8 hover:bg-gray-50 transition-all">
          <img src="https://www.google.com/favicon.ico" alt="google" className="w-5 h-5" />
          <span className="font-semibold text-gray-600">Sign In with Google</span>
        </button>

        {/* Features List from Photo */}
        <div className="space-y-4 text-left mb-8 px-2">
          <FeatureItem icon={<Gamepad2 size={18} className="text-white" />} color="bg-blue-500" text="1. Play Games" />
          <FeatureItem icon={<Video size={18} className="text-white" />} color="bg-purple-500" text="2. Watch Videos" />
          <FeatureItem icon={<Gift size={18} className="text-white" />} color="bg-orange-500" text="3. Enter Gift Codes" />
        </div>

        <p className="text-[10px] text-gray-400 uppercase tracking-widest">© 2024 Gamevoo. All rights reserved.</p>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, color, text }) => (
  <div className="flex items-center gap-4">
    <div className={`${color} p-2 rounded-xl shadow-sm`}>{icon}</div>
    <span className="font-bold text-gray-700">{text}</span>
  </div>
);

// Home Screen ka layout wahi rahega jo pehle diya tha
const HomeScreen = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <h1 className="text-2xl font-bold">Welcome to Gamevoo Dashboard!</h1>
  </div>
);

export default GamevooWebsite;
    
