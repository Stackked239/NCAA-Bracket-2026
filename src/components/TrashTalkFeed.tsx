"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message, User, Game, Reaction, IMESSAGE_REACTIONS } from "@/lib/types";
import { IconChat, IconX, IconFlame } from "./Icons";

interface TrashTalkFeedProps {
  messages: Message[];
  currentUser: User;
  allUsers: User[];
  games: Game[];
  onSend: (userId: string, userName: string, body: string, gameId?: string) => Promise<Message>;
  onReact: (messageId: string, userId: string, emoji: string) => Promise<Reaction[]>;
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

// CSS keyframes injected once
const REACTION_STYLES = `
@keyframes reaction-bar-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes reaction-bar-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes emoji-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.reaction-bar-enter {
  animation: reaction-bar-in 150ms ease-out forwards;
}
.reaction-bar-exit {
  animation: reaction-bar-out 100ms ease-in forwards;
}
.emoji-btn:hover, .emoji-btn:active {
  animation: emoji-pop 200ms ease-out;
}
`;

export default function TrashTalkFeed({ messages, currentUser, allUsers, games, onSend, onReact }: TrashTalkFeedProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [lastRead, setLastRead] = useState(() => getLastReadCount());
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [reactionBarClosing, setReactionBarClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifiedRef = useRef(new Set<string>());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionBarRef = useRef<HTMLDivElement>(null);

  // Inject animation styles once
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("reaction-styles")) return;
    const style = document.createElement("style");
    style.id = "reaction-styles";
    style.textContent = REACTION_STYLES;
    document.head.appendChild(style);
  }, []);

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

    const newMsgs = messages.slice(prevCountRef.current);
    prevCountRef.current = messages.length;

    for (const msg of newMsgs) {
      if (msg.user_id === currentUser.id) continue;
      if (notifiedRef.current.has(msg.id)) continue;

      const mentionPattern = new RegExp(`@${currentUser.name}\\b`, "i");
      if (mentionPattern.test(msg.body)) {
        notifiedRef.current.add(msg.id);

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`${msg.user_name} mentioned you`, {
            body: msg.body,
            icon: "🏀",
            tag: msg.id,
          });
        }

        if (!isOpen) {
          setIsOpen(true);
        }
      }
    }

    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentUser.id, currentUser.name, isOpen]);

  // ---- Close reaction bar on click outside ----
  useEffect(() => {
    if (!activeReactionMsgId) return;
    const handler = (e: MouseEvent) => {
      if (reactionBarRef.current && !reactionBarRef.current.contains(e.target as Node)) {
        closeReactionBar();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeReactionMsgId]);

  const closeReactionBar = useCallback(() => {
    setReactionBarClosing(true);
    setTimeout(() => {
      setActiveReactionMsgId(null);
      setReactionBarClosing(false);
    }, 100);
  }, []);

  // ---- Reaction handlers ----
  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    closeReactionBar();
    try {
      await onReact(messageId, currentUser.id, emoji);
    } catch (e) {
      console.error("Failed to react:", e);
    }
  }, [onReact, currentUser.id, closeReactionBar]);

  const handleQuickReact = useCallback(async (messageId: string, emoji: string) => {
    try {
      await onReact(messageId, currentUser.id, emoji);
    } catch (e) {
      console.error("Failed to react:", e);
    }
  }, [onReact, currentUser.id]);

  // ---- Long press for mobile ----
  const handleTouchStart = useCallback((msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveReactionMsgId(msgId);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // ---- @mention autocomplete ----
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);

  const filteredMentions = mentionQuery !== null
    ? otherUsers.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  const handleInputChange = (val: string) => {
    setBody(val);

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

  const unreadCount = isOpen ? 0 : Math.max(0, messages.length - lastRead);
  const liveGames = games.filter((g) => g.status === "in_progress" && g.team_a_name && g.team_b_name);

  return (
    <>
      {/* Toggle button */}
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

      {/* Chat panel */}
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
                const reactions = msg.reactions || [];
                const isReactionBarOpen = activeReactionMsgId === msg.id;

                // Group reactions by emoji
                const grouped = reactions.reduce<Record<string, { count: number; userReacted: boolean }>>((acc, r) => {
                  if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userReacted: false };
                  acc[r.emoji].count++;
                  if (r.user_id === currentUser.id) acc[r.emoji].userReacted = true;
                  return acc;
                }, {});

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

                    {/* Message bubble with reaction trigger */}
                    <div className="relative group max-w-[85%]">
                      {/* Reaction bar */}
                      {isReactionBarOpen && (
                        <div
                          ref={reactionBarRef}
                          className={`absolute bottom-full mb-2 ${isMe ? "right-0" : "left-0"} z-10 ${
                            reactionBarClosing ? "reaction-bar-exit" : "reaction-bar-enter"
                          }`}
                        >
                          <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-[#334155] shadow-xl">
                            {IMESSAGE_REACTIONS.map((emoji) => {
                              const userReacted = reactions.some(
                                (r) => r.emoji === emoji && r.user_id === currentUser.id
                              );
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(msg.id, emoji)}
                                  className={`emoji-btn w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all hover:bg-[#334155] ${
                                    userReacted ? "ring-2 ring-blue-500 bg-blue-500/20" : ""
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Hover reaction trigger (desktop) */}
                      <button
                        onClick={() => setActiveReactionMsgId(isReactionBarOpen ? null : msg.id)}
                        className={`absolute ${isMe ? "-left-8" : "-right-8"} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#334155]/80 text-slate-400 hover:text-white hover:bg-[#475569] flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        😊
                      </button>

                      <div
                        onTouchStart={() => handleTouchStart(msg.id)}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        className={`rounded-2xl px-3 py-2 text-sm break-words select-none ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-[#0f172a] text-slate-200 rounded-bl-md"
                        }`}
                      >
                        <MessageBody body={msg.body} currentUserName={currentUser.name} />
                      </div>
                    </div>

                    {/* Reaction pills */}
                    {Object.keys(grouped).length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                        {Object.entries(grouped).map(([emoji, { count, userReacted }]) => (
                          <button
                            key={emoji}
                            onClick={() => handleQuickReact(msg.id, emoji)}
                            className={`inline-flex items-center gap-0.5 h-6 px-1.5 rounded-full text-xs transition-all ${
                              userReacted
                                ? "bg-blue-500/20 border border-blue-500/50 text-blue-300"
                                : "bg-[#0f172a] border border-[#334155] text-slate-400 hover:border-[#475569]"
                            }`}
                          >
                            <span className="text-sm leading-none">{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

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
