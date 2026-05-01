
"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAuthenticated: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        // Fetch initial session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // Force refresh the page data when user signs in or out
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                    router.refresh();
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setUser(null);
            setSession(null);
            // Force clear any stuck tokens
            if (typeof window !== 'undefined') {
                localStorage.clear();
            }
            router.refresh();
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isAuthenticated: !!user, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
