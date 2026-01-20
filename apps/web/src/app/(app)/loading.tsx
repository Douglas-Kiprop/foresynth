"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
            <p className="mt-6 font-orbitron text-sm tracking-[0.3em] text-primary/40 animate-pulse uppercase">
                Initializing Interface
            </p>
        </div>
    );
}
