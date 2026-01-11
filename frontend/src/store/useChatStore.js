import { create } from "zustand"
import toast from "react-hot-toast"

import axiosInstance from "../lib/axios"
import useAuthStore from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    notifications: [],
    summary: null,
    isSummarizing: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data })
        }
        catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data })
        }
        catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get()

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] })
        }
        catch (error) {
            toast.error(error.response.data.message)
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Cleaning up any existing listener first to avoid duplicates
        socket.off("newMessage");

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages, users, notifications } = get();

            const isFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;

            // IF message is from the user we are currently chatting with
            if (isFromSelectedUser) {
                set({
                    messages: [...messages, newMessage],
                });
            } else {
                // IF message is from someone else:
                // 1. Show a toast notification
                const sender = users.find((u) => u._id === newMessage.senderId);
                const senderName = sender ? sender.fullName : "Someone";

                toast.success(`New message from ${sender?.fullName || "Someone"}`, {
                    icon: '💬',
                });

                // 2. Add to notifications array
                set({
                    notifications: [...notifications, newMessage],
                });
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket
        if (socket) {
            socket.off("newMessage")
        }
    },

    setSelectedUser: (selectedUser) => {
        set({ selectedUser });

        // CLEAR notifications for this user when you click on them
        if (selectedUser) {
            const filteredNotifications = get().notifications.filter(
                (n) => n.senderId !== selectedUser._id
            );
            set({ notifications: filteredNotifications });
        }
    },

    getChatSummary: async (userId) => {
        set({ isSummarizing: true, summary: null });
        try 
        {
            const res = await axiosInstance.get(`/messages/summarize/${userId}`);
            set({ summary: res.data.summary });
        }
        catch (error) 
        {
            toast.error(error.response?.data?.message || "Failed to generate summary");
        } finally {
            set({ isSummarizing: false });
        }
    },

    clearSummary: () => set({ summary: null }),
}))