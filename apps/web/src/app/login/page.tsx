
"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                const res = await login(formData);
                if (res?.error) setError(res.error);
            } else {
                const res = await signup(formData);
                if (res?.error) setError(res.error);
                else if (res?.success) setError("Check your email to confirm your account.");
            }
        } catch (e) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Visual Side */}
            <div className="hidden md:flex flex-col justify-center items-center bg-black/40 border-r border-sidebar-border relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                <div className="z-10 text-center p-8">
                    <h1 className="text-6xl font-orbitron font-bold text-primary mb-4 animate-pulse">FORESYNTH</h1>
                    <p className="text-xl font-rajdhani text-foreground/60 tracking-widest">
                        INTELLIGENCE FOR THE PREDICTION ECONOMY
                    </p>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex flex-col justify-center items-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right duration-500">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-orbitron font-bold text-foreground">
                            {isLogin ? "INITIALIZE SESSION" : "NEW OPERATOR"}
                        </h2>
                        <p className="text-foreground/40 mt-2">
                            {isLogin ? "Enter your credentials to access the terminal." : "Create an account to begin tracking."}
                        </p>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-primary uppercase">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full bg-black/40 border border-sidebar-border rounded-none px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                                placeholder="OPERATOR@FORESYNTH.COM"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-primary uppercase">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full bg-black/40 border border-sidebar-border rounded-none px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                                placeholder="••••••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-black font-bold font-orbitron tracking-widest hover:bg-white transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLogin ? "ACCESS TERMINAL" : "REGISTER UNIT"}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs font-mono text-foreground/40 hover:text-primary transition-colors uppercase tracking-widest"
                        >
                            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
