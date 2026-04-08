
import React from 'react';
import { UserPlus, Bell, ChevronRight } from 'lucide-react';
import { Profile, Friendship } from '../types';

interface FriendsSectionProps {
  friends: Profile[];
  hasNewRequests: boolean;
  onAddFriend: () => void;
  onViewRequests: () => void;
  onSelectFriend: (friend: Profile) => void;
}

const FriendsSection: React.FC<FriendsSectionProps> = ({
  friends,
  hasNewRequests,
  onAddFriend,
  onViewRequests,
  onSelectFriend
}) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200">Friends</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={onAddFriend}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors"
            title="Add Friend"
          >
            <UserPlus size={20} />
          </button>
          <button 
            onClick={onViewRequests}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors relative"
            title="Friend Requests"
          >
            <Bell size={20} />
            {hasNewRequests && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {friends.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend)}
              className="flex-shrink-0 group snap-start"
            >
              <div className="flex flex-col items-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-[2rem] min-w-[100px] transition-all hover:border-indigo-500/50 active:scale-95">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  {friend.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">
                  {friend.full_name.split(' ')[0]}
                </span>
              </div>
            </button>
          ))}
          <div className="flex-shrink-0 w-4" /> {/* Spacer for scroll */}
        </div>
      ) : (
        <div className="p-8 bg-slate-900/30 border border-dashed border-slate-800 rounded-[2.5rem] text-center">
          <p className="text-slate-500 font-medium italic">Add friends to track each other's habits</p>
        </div>
      )}
    </section>
  );
};

export default FriendsSection;
