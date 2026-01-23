import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export type Notification = {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'price_alert' | 'wallet_alert' | 'system';
    is_read: boolean;
    metadata: any;
    created_at: string;
};

type NotificationState = {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    loadNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    loadNotifications: async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const notifications = data || [];
            const unreadCount = notifications.filter(n => !n.is_read).length;

            set({ notifications, unreadCount, isLoading: false });
        } catch (err) {
            console.error("Failed to load notifications:", err);
            set({ isLoading: false });
        }
    },

    markAsRead: async (id) => {
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            set((state) => {
                const updated = state.notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                );
                return {
                    notifications: updated,
                    unreadCount: updated.filter(n => !n.is_read).length
                };
            });
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    },

    markAllAsRead: async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0
            }));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    }
}));
