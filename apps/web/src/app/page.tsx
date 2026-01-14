import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 gap-y-12 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <header className="flex flex-col items-center gap-6 text-center z-10 animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-neon">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-sm font-mono text-primary/80">AI-POWERED PREDICTION MARKETS</span>
        </div>

        <h1 className="text-7xl md:text-9xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
          FORESYNTH
        </h1>

        <p className="text-xl md:text-2xl text-foreground/60 max-w-2xl font-light leading-relaxed">
          The <span className="text-primary font-bold">Polymarket</span> analytics platform for the next generation of traders.
          Watchlists, Insider Tracking, and AI Agents in one cohesive interface.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-6 z-10">
        <Link
          href="/watchlists"
          className="group relative px-8 py-4 bg-primary text-black font-bold font-orbitron text-lg tracking-widest rounded-sm overflow-hidden hover:scale-105 transition-transform duration-300 shadow-neon"
        >
          <span className="relative z-10 flex items-center gap-2">
            ENTER APP <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Link>

        <Link
          href="https://docs.polymarket.com/developers/builders/builder-intro"
          target="_blank"
          className="px-8 py-4 border border-sidebar-border text-foreground font-orbitron text-lg tracking-widest rounded-sm hover:bg-white/5 hover:border-primary/50 transition-all duration-300 backdrop-blur-sm"
        >
          BUILDER DOCS
        </Link>
      </div>

      <footer className="absolute bottom-8 text-foreground/20 font-mono text-xs">
        POWERED BY POLYMARKET • BUILD ON WEB3
      </footer>
    </div>
  );
}
