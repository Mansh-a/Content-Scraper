import React, { useState } from 'react';
import { User, Bell, Shield, Smartphone, Mail, CreditCard, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface SettingsProps {
    session: Session | null;
}

const Settings: React.FC<SettingsProps> = ({ session }) => {
    const user = session?.user;

    // Password Change State
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords don't match" });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters" });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setMessage({ type: 'success', text: "Password updated successfully!" });
            setTimeout(() => {
                setIsEditingPassword(false);
                setNewPassword('');
                setConfirmPassword('');
                setMessage(null);
            }, 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Failed to update password" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
                <p className="text-slate-500">Manage your account preferences and application settings.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <User size={20} className="text-emerald-600" />
                        Profile Information
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                            <Mail size={16} />
                            {user?.email || 'user@example.com'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs font-mono truncate">
                            {user?.id || 'Not authenticated'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Bell size={20} className="text-emerald-600" />
                            Notifications
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-700">Email Digest</p>
                                <p className="text-sm text-slate-500">Receive a weekly summary of top content.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-700">New Findings</p>
                                <p className="text-sm text-slate-500">Alerts when high-relevance content is found.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Shield size={20} className="text-emerald-600" />
                            Privacy & Security
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {!isEditingPassword ? (
                            <button
                                onClick={() => setIsEditingPassword(true)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                            >
                                <span className="font-medium text-slate-700">Change Password</span>
                                <Lock size={16} className="text-slate-400" />
                            </button>
                        ) : (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-slate-800">New Password</h3>
                                    <button onClick={() => setIsEditingPassword(false)} className="text-slate-400 hover:text-slate-600">
                                        <XCircle size={18} />
                                    </button>
                                </div>
                                <form onSubmit={handlePasswordUpdate} className="space-y-3">
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />

                                    {message && (
                                        <div className={`text-xs px-2 py-1.5 rounded ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPassword(false)}
                                            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-70"
                                        >
                                            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
                            <span className="font-medium text-slate-700">Two-Factor Auth</span>
                            <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded">Disabled</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-sm text-slate-400">CurateFlow v0.1.0 (Beta)</p>
            </div>
        </div>
    );
};

export default Settings;
