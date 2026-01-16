"use client";

import { useState } from "react";
import { X, Plus, Users } from "lucide-react";

interface CreateSquadModalProps {
    onClose: () => void;
    onCreate: (name: string) => void;
}

export function CreateSquadModal({ onClose, onCreate }: CreateSquadModalProps) {
    const [name, setName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-sidebar border border-sidebar-border w-full max-w-sm rounded-lg shadow-2xl overflow-hidden p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-orbitron font-bold text-lg text-primary flex items-center gap-2">
                        <Users className="w-5 h-5" /> NEW TARGET SQUAD
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-foreground/40 hover:text-foreground" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-mono text-foreground/40 uppercase mb-1 block">Squad Name</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Whale Watching, GCR Copy"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-sidebar-border rounded-sm px-4 py-3 text-foreground focus:outline-none focus:border-primary font-rajdhani font-bold"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-mono text-foreground/60 hover:text-foreground"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-6 py-2 bg-primary text-black font-bold font-mono text-xs rounded-sm hover:bg-white transition-colors disabled:opacity-50"
                        >
                            CREATE SQUAD
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
