"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message, User, Game } from "@/lib/types";
import { IconChat, IconX, IconFlame } from "./Icons";

interface TrashTalkFeedProps {
  messages: Message[];
  currentUser: User;
  allUsers: User[];
  games: Game[];
  onSend: (userId: string, userName: string, body: string, gameId?: string) => Promise<Message>;
}

const LAST_READ_KEY = "ncaa_chat_last_read";

function getLastReadCount(): number {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return parseInt(window.localStorage.getItem(LAST_READ_KEY) || "0", 10) || 0;
    }
  } catch {}
  return 0;
}

function setLastReadCount(count: number) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(LAST_READ_KEY, String(count));
    }
  } catch {}
}

export default function TrashTalkFeed({ messages, currentUser, allUsers, games, onSend }: TrashTalkFeedProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [lastRead, setLastRead] = useState(() => getLastReadCount());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifiedRef = useRef(new Set<string>());

  // ---- Browser notification permission ----
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ---- Mark as read when chat opens ----
  useEffect(() => {
    if (isOpen && messages.length > lastRead) {
      setLastRead(messages.length);
      setLastReadCount(messages.length);
    }
  }, [isOpen, messages.length, lastRead]);

  // ---- Notify on @mentions ----
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length <= prevCountRef.current) {
      prevCountRef.current = messages.length;
      return;
    }

    // Check new messages for @mentions of current user
    const newMsgs = messages.slice(prevCountRef.current);
    prevCountRef.current = messages.length;

    for (const msg of newMsgs) {
      if (msg.user_id === currentUser.id) continue;
      if (notifiedRef.current.has(msg.id)) continue;

      const mentionPattern = new RegExp(`@${currentUser.name}\\b`, "i");
      if (mentionPattern.test(msg.body)) {
        notifiedRef.current.add(msg.id);

        // Browser notification
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`${msg.user_name} mentioned you`, {
            body: msg.body,
            icon: "🏀",
            tag: msg.id,
          });
        }

        // Also open the chat if it's closed
        if (!isOpen) {
          setIsOpen(true);
        }
      }
    }

    // Auto-scroll
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentUser.id, currentUser.name, isOpen]);

  // ---- @mention autocomplete ----
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);

  const filteredMentions = mentionQuery !== null
    ? otherUsers.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  const handleInputChange = (val: string) => {
    setBody(val);

    // Detect @mention trigger
    const cursorPos = inputRef.current?.selectionStart || val.length;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionIdx(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = useCallback((user: User) => {
    const cursorPos = inputRef.current?.selectionStart || body.length;
    const textBefore = body.slice(0, cursorPos);
    const textAfter = body.slice(cursorPos);
    const replaced = textBefore.replace(/@\w*$/, `@${user.name} `);
    setBody(replaced + textAfter);
    setMentionQuery(null);
    inputRef.current?.focus();
  }, [body]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // @mention navigation
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIdx((i) => Math.min(i + 1, filteredMentions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentions[mentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    // Normal send
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await onSend(currentUser.id, currentUser.name, body.trim());
      setBody("");
      setMentionQuery(null);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  // Unread badge — based on persisted last-read count
  const unreadCount = isOpen ? 0 : Math.max(0, messages.length - lastRead);

  // Live games for quick-tag
  const liveGames = games.filter((g) => g.status === "in_progress" && g.team_a_name && g.team_b_name);

  return (
    <>
      {/* Toggle button — above mobile bottom nav */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center justify-center text-2xl transition-transform active:scale-95"
      >
        {isOpen ? <IconX size={22} /> : <IconChat size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel — full screen on mobile, floating on desktop */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-4 z-50 sm:w-[380px] sm:h-[520px] sm:max-h-[calc(100vh-6rem)] bg-[#1e293b] sm:rounded-xl sm:border sm:border-[#334155] sm:shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between shrink-0 bg-[#1e293b]">
            <h3 className="font-semibold flex items-center gap-2">
              <IconFlame size={18} className="text-orange-400" />
              Trash Talk
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{messages.length} messages</span>
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hidden text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                No messages yet. Start the trash talk!
                <div className="text-xs text-slate-600 mt-2">
                  Tip: Type <span className="text-blue-400">@name</span> to mention someone
                </div>
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
                      <MessageBody body={msg.body} currentUserName={currentUser.name} />
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

          {/* @mention autocomplete dropdown */}
          {mentionQuery !== null && filteredMentions.length > 0 && (
            <div className="px-3 shrink-0">
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg overflow-hidden">
                {filteredMentions.map((user, i) => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                      i === mentionIdx
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-slate-300 hover:bg-[#1e293b]"
                    }`}
                  >
                    <span className="text-blue-400">@</span>
                    <span className="font-medium">{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#334155] shrink-0 safe-area-bottom">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={body}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk your trash... (@ to mention)"
                maxLength={500}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={sending || !body.trim()}
                className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-sm font-medium transition-colors shrink-0"
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

// ---- Message body with highlighted @mentions ----
function MessageBody({ body, currentUserName }: { body: string; currentUserName: string }) {
  // Split on @mentions
  const parts = body.split(/(@\w+(?:\s\w+)?)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const name = part.slice(1);
          const isSelf = name.toLowerCase() === currentUserName.toLowerCase();
          return (
            <span
              key={i}
              className={`font-semibold ${
                isSelf
                  ? "text-yellow-300 bg-yellow-400/20 rounded px-0.5"
                  : "text-blue-300"
              }`}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
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
