import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, Loader2, ArrowRight, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

type AuthView = 'login' | 'signup' | 'forgot_password' | 'enter_otp' | 'reset_password';

interface LoginProps {
    session?: Session | null;
    onPasswordResetMode?: (isResetting: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ session, onPasswordResetMode }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // If we are already authenticated (session exists) but in this component,
    // it implies we are in the 'reset_password' stage of the flow.
    useEffect(() => {
        if (session && view !== 'reset_password' && onPasswordResetMode) {
            // If we somehow got here with a session but wrong view, ensure we show reset password
            // But valid flow is: Enter OTP -> Verify -> Sets Session -> App renders Login(ResetMode)
            setView('reset_password');
        }
    }, [session]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');

            } else if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

            } else if (view === 'forgot_password') { // Step 1: Request Reset Link
                // LEGITIMACY CHECK: Check if email exists in public.profiles first
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('email', email)
                    .maybeSingle();

                if (profileError) {
                    // If the profiles table is missing, provide a clear instruction
                    if (profileError.code === '42P01') {
                        throw new Error("Database setup incomplete. Please run the SQL from schema.sql in your Supabase dashboard.");
                    }
                    throw profileError;
                }

                if (!profile) {
                    throw new Error("No account found with this email. Please sign up instead.");
                }

                // Using resetPasswordForEmail to send a magic link
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/`,
                });
                if (error) throw error;
                setMessage('A password reset link has been sent to your email.');
                // We stay on this view or go back to login since the user must click the link
                setLoading(false);
                return;

            } else if (view === 'enter_otp') { // Step 2: Verify OTP
                if (onPasswordResetMode) onPasswordResetMode(true);

                const { error } = await supabase.auth.verifyOtp({
                    email,
                    token: otp,
                    type: 'email',
                });

                if (error) {
                    if (onPasswordResetMode) onPasswordResetMode(false);
                    throw error;
                }

                // Success! User is now logged in.
                setMessage('Code verified. Please set your new password.');
                setView('reset_password');

            } else if (view === 'reset_password') { // Step 3: Update Password
                if (newPassword !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                const { error } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (error) throw error;

                setMessage('Password updated successfully! Logging you in...');
                setTimeout(() => {
                    if (onPasswordResetMode) onPasswordResetMode(false); // Returns to Dashboard
                }, 1500);
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (view) {
            case 'signup': return 'Create an Account';
            case 'forgot_password': return 'Reset Your Password';
            case 'enter_otp': return 'Enter Verification Code';
            case 'reset_password': return 'Set New Password';
            default: return 'Welcome Back';
        }
    };

    const getSubtitle = () => {
        switch (view) {
            case 'signup': return 'Start curating your content today';
            case 'forgot_password': return 'We will send a reset link to your email';
            case 'enter_otp': return `Enter the code sent to ${email}`;
            case 'reset_password': return 'Create a strong new password';
            default: return 'Sign in to access your dashboard';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                        {view === 'enter_otp' || view === 'reset_password' ? <KeyRound size={24} /> : "C"}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {getTitle()}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {getSubtitle()}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {/* Email Input - Shown in most views except Reset Password (already known) */}
                    {(view === 'login' || view === 'signup' || view === 'forgot_password') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>
                    )}

                    {/* OTP Input */}
                    {view === 'enter_otp' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all tracking-widest text-center font-mono text-lg" // specific styling for OTP
                                    placeholder="123456"
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    )}

                    {/* Password Input - Login/Signup */}
                    {(view === 'login' || view === 'signup') && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                {view === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setView('forgot_password');
                                            setError(null);
                                            setMessage(null);
                                        }}
                                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reset Password Inputs */}
                    {view === 'reset_password' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 text-sm border border-emerald-100">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                {view === 'signup' ? 'Sign Up' :
                                    view === 'forgot_password' ? 'Send Reset Link' :
                                        view === 'enter_otp' ? 'Verify Code' :
                                            view === 'reset_password' ? 'Update & Login' : 'Sign In'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    {(view === 'forgot_password' || view === 'enter_otp') ? (
                        <button
                            onClick={() => {
                                setView('login');
                                setError(null);
                                setMessage(null);
                            }}
                            className="text-slate-600 font-medium hover:text-slate-800 flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </button>
                    ) : (view === 'login' || view === 'signup') && (
                        <>
                            {view === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                onClick={() => {
                                    setView(view === 'signup' ? 'login' : 'signup');
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="text-emerald-600 font-medium hover:text-emerald-700 hover:underline"
                            >
                                {view === 'signup' ? 'Sign In' : 'Sign Up'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
