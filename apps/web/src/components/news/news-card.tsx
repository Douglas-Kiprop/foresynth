"use client";

import { NewsItem } from "@/lib/mock-news";
import { cn } from "@/lib/utils";
import { ExternalLink, Users, Globe, Zap, Twitter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsCardProps {
    item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
    const getSourceIcon = () => {
        switch (item.source) {
            case "X (Twitter)": return <Twitter className="w-3 h-3 text-[#1DA1F2]" />;
            case "Polymarket": return <Zap className="w-3 h-3 text-blue-500" />;
            default: return <Globe className="w-3 h-3 text-foreground/40" />;
        }
    };

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
        >
            <div className="flex items-start gap-4 p-4 border border-sidebar-border bg-black/20 hover:bg-white/5 transition-all duration-300 rounded-lg">

                {/* Thumbnail */}
                <div className="shrink-0 w-24 h-24 rounded-md overflow-hidden bg-white/5 border border-sidebar-border/50 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.imageUrl}
                        alt={item.headline}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                    <div className="space-y-1">
                        <h3 className="font-rajdhani font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {item.headline}
                        </h3>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs font-mono text-foreground/40">
                            <span className="font-bold text-foreground/60 flex items-center gap-1.5">
                                {getSourceIcon()} {item.source}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-foreground/20" />
                            <span>{item.timeAgo}</span>
                        </div>

                        {/* Subtle Sentiment Indicator as a dot */}
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            item.sentiment === 'bullish' ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" :
                                item.sentiment === 'bearish' ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" :
                                    "bg-foreground/20"
                        )} title={`Sentiment: ${item.sentiment}`} />
                    </div>
                </div>
            </div>
        </a>
    );
}

export function NewsCardSkeleton() {
    return (
        <div className="flex items-start gap-4 p-4 border border-sidebar-border bg-black/20 rounded-lg">
            {/* Thumbnail Skeleton */}
            <Skeleton className="shrink-0 w-24 h-24 rounded-md" />

            {/* Content Skeleton */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                </div>

                {/* Meta Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-1 w-1 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="w-2 h-2 rounded-full" />
                </div>
            </div>
        </div>
    );
}
