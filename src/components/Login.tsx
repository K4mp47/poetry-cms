import { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (password: string) => boolean;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_DURATION = 30;

  useEffect(() => {
    let interval: number;
    if (isLocked && lockoutTimer > 0) {
      interval = window.setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTimer === 0 && isLocked) {
      setIsLocked(false);
      setAttempts(0);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const success = onLogin(password);
    
    if (success) {
      setError(false);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError(true);
      
      if (nextAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockoutTimer(LOCKOUT_DURATION);
      }
      
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper animate-fade-in">
      <div 
        className={`max-w-sm w-full px-8 text-center transition-transform duration-300 ${error ? 'translate-x-1' : ''}`}
      >
        <header className="mb-12">
          <span className="font-sans text-[10px] tracking-[0.3em] text-muted uppercase mb-4 block">
            Security Gateway
          </span>
          <h1 className="font-serif text-4xl mb-4 tracking-tighter">
            Enter Author Access
          </h1>
          <div className="h-px w-12 bg-accent mx-auto"></div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLocked ? "System Locked" : "Authorization Key"}
              disabled={isLocked}
              className={`w-full bg-transparent border-b ${
                error ? 'border-red-500' : isLocked ? 'border-gray-100 text-gray-300' : 'border-gray-200'
              } focus:border-black text-center py-3 font-serif outline-none transition-colors placeholder:text-gray-300 placeholder:italic`}
              autoFocus
            />
            {error && !isLocked && (
              <p className="absolute -bottom-6 left-0 w-full text-[10px] uppercase tracking-widest text-red-500">
                Invalid Credentials ({MAX_ATTEMPTS - attempts} attempts left)
              </p>
            )}
            {isLocked && (
              <p className="absolute -bottom-6 left-0 w-full text-[10px] uppercase tracking-widest text-red-400">
                Locked Out. Retry in {lockoutTimer}s
              </p>
            )}
          </div>

          <button 
            type="submit"
            disabled={isLocked}
            className={`w-full py-4 font-sans text-xs font-bold uppercase tracking-[0.3em] transition-all ${
              isLocked 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isLocked ? `Wait ${lockoutTimer}s` : 'Authenticate'}
          </button>
        </form>

        <p className="mt-12 font-serif italic text-muted text-sm leading-relaxed">
          "The door is locked not to keep people out, but to ensure only those with purpose enter."
        </p>
      </div>
    </div>
  );
}
