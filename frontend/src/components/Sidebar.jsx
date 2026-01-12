import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, notifications } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users.filter((user) => {

    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase());


    const matchesOnline = showOnlineOnly ? onlineUsers.includes(user._id) : true;

    return matchesSearch && matchesOnline;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">

      <div className="px-4 py-2 border-b border-base-300">
        <label className="input input-bordered input-sm flex items-center gap-2 w-full">
          <input
            type="text"
            placeholder="Search contacts..."
            className="grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="size-4 text-zinc-400" />
        </label>
      </div>

      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* TODO: Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          // CALCULATE unread count for this specific user
          const unreadCount = notifications.filter(n => n.senderId === user._id).length;

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors relative
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              {/* Avatar Section */}
              <div className="relative mx-auto lg:mx-0">
                <img src={user.profilePic || "/avatar.png"} alt={user.name} className="size-12 object-cover rounded-full" />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              {/* User info */}
              <div className="hidden lg:flex flex-1 justify-between items-center text-left min-w-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>

                {/* NOTIFICATION BADGE */}
                {unreadCount > 0 && (
                  <div className="bg-primary text-primary-content size-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {unreadCount}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
export default Sidebar;