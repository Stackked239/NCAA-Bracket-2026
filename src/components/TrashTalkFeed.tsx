"use client";

import { useState, useRef, useEffect } from "react";
import { Message, User, Game } from "@/lib/types";

interface TrashTalkFeedProps {
  messages: Message[];
  currentUser: User;
  games: Game[];
  onSend: (userId: string, userName: string, body: string, gameId?: string) => Promise<Message>;
}

export default function TrashTalkFeed({ messages, currentUser, games, onSend }: TrashTalkFeedProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  const handleSend = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await onSend(currentUser.id, currentUser.name, body.trim());
      setBody("");
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  // Unread badge
  const unreadCount = isOpen ? 0 : messages.length - prevCountRef.current;

  // Find active/recent games for quick-tag
  const liveGames = games.filter((g) => g.status === "in_progress" && g.team_a_name && g.team_b_name);

  return (
    <>
      {/* Toggle button — fixed bottom-right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center text-2xl transition-transform active:scale-95"
      >
        {isOpen ? "✕" : "💬"}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-6rem)] bg-[#1e293b] rounded-xl border border-[#334155] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between shrink-0">
            <h3 className="font-semibold flex items-center gap-2">
              🗑️🔥 Trash Talk
            </h3>
            <span className="text-xs text-slate-500">{messages.length} messages</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                No messages yet. Start the trash talk! 🏀
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user_id === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs font-medium ${isMe ? "text-blue-400" : "text-slate-400"}`}>
                        {msg.user_name}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 max-w-[85%] text-sm break-words ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-[#0f172a] text-slate-200 rounded-bl-md"
                      }`}
                    >
                      {msg.body}
                    </div>
                    {msg.game_id && (
                      <span className="text-[10px] text-slate-600 mt-0.5">
                        re: {msg.game_id}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Live game tags */}
          {liveGames.length > 0 && (
            <div className="px-4 py-1.5 border-t border-[#334155]/50 flex gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[10px] text-slate-500 shrink-0 self-center">Live:</span>
              {liveGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setBody((prev) => `${prev} [${g.team_a_name} vs ${g.team_b_name}]`)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 shrink-0 transition-colors"
                >
                  {g.team_a_name} vs {g.team_b_name}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#334155] shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Talk your trash..."
                maxLength={500}
                className="flex-1 px-3 py-2 rounded-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={sending || !body.trim()}
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-sm font-medium transition-colors shrink-0"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
            <div className="text-[10px] text-slate-600 mt-1 text-right">
              {body.length}/500
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
