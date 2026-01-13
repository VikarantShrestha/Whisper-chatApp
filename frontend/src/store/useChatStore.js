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
    summary: null,
    isSummarizing: false,
    typingUsers: {},

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
        socket.off("userTyping");
        socket.off("userStoppedTyping");

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages, users } = get();

            const isFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;

            // IF message is from the user we are currently chatting with
            if (isFromSelectedUser) {
                set({
                    messages: [...messages, newMessage],
                });

                // Tell the backend we saw this new message immediately
                // get().markMessagesAsSeen(selectedUser._id);
            } else {
                // IF message is from someone else
                // Show a toast notification
                const sender = users.find((u) => u._id === newMessage.senderId);

                toast.success(`New message from ${sender?.fullName || "Someone"}`, {
                    icon: '💬',
                });

                set({
                    users: users.map((u) =>
                        u._id === newMessage.senderId
                            ? { ...u, unreadCount: (u.unreadCount || 0) + 1 }
                            : u
                    ),
                });
            }
        });

        socket.on("userTyping", ({ senderId }) => {
            const { selectedUser } = get();
            // Only showing indicator if the sender is the user we are currently viewing
            if (selectedUser?._id === senderId) {
                set((state) => ({
                    typingUsers: { ...state.typingUsers, [senderId]: true }
                }));
            }
        });

        socket.on("userStoppedTyping", ({ senderId }) => {
            set((state) => ({
                typingUsers: { ...state.typingUsers, [senderId]: false }
            }));
        });

        socket.on("messagesSeen", ({ seenBy }) => {
            const { selectedUser, messages } = get();
            // If we are currently looking at the person who just saw our messages
            if (selectedUser?._id === seenBy) {
                set({
                    messages: messages.map((m) => ({ ...m, seen: true })),
                });
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket
        if (socket) {
            socket.off("newMessage");
            socket.off("userTyping");
            socket.off("userStoppedTyping");
        }
    },

    setSelectedUser: (selectedUser) => {
        set({ selectedUser });

        if (selectedUser) {
            set({
                users: get().users.map((u) =>
                    u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
                ),
            });
        }
    },

    markMessagesAsSeen: async (senderId) => {
        try {
            await axiosInstance.put(`/messages/seen/${senderId}`);
        } catch (error) {
            console.log("Error marking messages as seen:", error);
        }
    },

    getChatSummary: async (userId) => {
        set({ isSummarizing: true, summary: null });
        try {
            const res = await axiosInstance.get(`/messages/summarize/${userId}`);
            set({ summary: res.data.summary });
        }
        catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate summary");
        } finally {
            set({ isSummarizing: false });
        }
    },

    clearSummary: () => set({ summary: null }),
}))