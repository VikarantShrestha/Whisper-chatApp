import { Sparkles, X } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, summary, isSummarizing, getChatSummary, clearSummary } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* AI Summarize Button */}
        <button
          onClick={() => getChatSummary(selectedUser._id)}
          className={`btn btn-sm btn-ghost gap-2 ${isSummarizing ? "loading" : ""}`}
          disabled={isSummarizing}
        >
          <Sparkles className="size-4 text-primary" />
          <span className="hidden sm:inline">AI Summary</span>
        </button>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>

      {/* Summary Display Overlay */}
      {summary && (
        <div className="mt-3 p-3 bg-base-200 rounded-lg relative animate-in fade-in slide-in-from-top-2">
          <button
            onClick={clearSummary}
            className="absolute top-2 right-2 hover:text-error"
          >
            <X className="size-4" />
          </button>
          <h3 className="text-xs font-bold uppercase text-zinc-500 mb-1">Chat Summary</h3>
          <div className="text-sm prose whitespace-pre-wrap">{summary}</div>
        </div>
      )}

    </div>
  );
};
export default ChatHeader;