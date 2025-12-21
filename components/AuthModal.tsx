
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthModal: React.FC = () => {
    const { user, login, guestLogin, loading } = useAuth();

    if (user) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-gold/5 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 max-w-md w-full p-8 text-center space-y-12">

                {/* Logo Construction */}
                <div className="space-y-4">
                    <h1 className="text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-500 tracking-tighter">
                        ATMOSPHERA
                    </h1>
                    <p className="text-xs uppercase tracking-[0.4em] text-accent-gold font-bold">
                        Ambient Intelligence Archive
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Google Sign In Button (Styled) */}
                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full bg-white text-black h-14 rounded-full flex items-center justify-center gap-4 font-bold tracking-wide hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)] group relative overflow-hidden"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={guestLogin}
                        className="text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                        Enter as Guest
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 w-full flex justify-center pb-8 opacity-40">
                    <span className="text-[9px] text-slate-600 font-mono">SECURE • ENCRYPTED • PRIVATE</span>
                </div>
            </div>
        </div>
    );
};
