
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // DEV BYPASS: Force a logged in state
        const mockUser = {
            id: "885c6dce-5d2d-40b8-b81b-f63a8e90531b",
            email: "dev@foresynth.ai",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString()
        } as any;
        
        setUser(mockUser);
        setSession({
            user: mockUser,
            access_token: "dev-bypass-token",
            refresh_token: "dev-bypass-token",
            expires_in: 3600,
            token_type: "bearer"
        } as any);
        setLoading(false);

        // const { data: { subscription } } = supabase.auth.onAuthStateChange(
        //     (event, session) => {
        //         setSession(session);
        //         setUser(session?.user ?? null);
        //         setLoading(false);
        //     }
        // );

        // return () => subscription.unsubscribe();
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
