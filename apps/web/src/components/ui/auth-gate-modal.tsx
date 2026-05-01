"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface AuthGateModalProps {
    message?: string;
    onClose: () => void;
}

export function AuthGateModal({ message, onClose }: AuthGateModalProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md mx-4 p-8 rounded-lg bg-sidebar border border-sidebar-border shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    {/* Header */}
                    <h2 className="text-2xl font-orbitron font-bold text-center text-foreground mb-2">
                        ACCESS REQUIRED
                    </h2>

                    {/* Message */}
                    <p className="text-center text-foreground/60 text-sm leading-relaxed mb-8">
                        {message || "Sign in to unlock this feature and start building your personalized trading intelligence."}
                    </p>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <Link
                            href="/login"
                            className="w-full py-3 bg-primary text-black font-bold font-orbitron tracking-widest rounded-sm shadow-neon hover:bg-white hover:text-primary transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <UserPlus size={16} />
                            SIGN UP FREE
                        </Link>

                        <Link
                            href="/login"
                            className="w-full py-3 bg-transparent border border-foreground/20 text-foreground/80 font-orbitron tracking-widest rounded-sm hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <LogIn size={16} />
                            LOG IN
                        </Link>
                    </div>

                    {/* Subtle footer */}
                    <p className="text-center text-foreground/30 text-[10px] font-mono mt-6 uppercase tracking-wider">
                        Free account • No credit card required
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
