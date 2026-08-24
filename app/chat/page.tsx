"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { AppShell } from "../components/app-shell";
import { deleteChatMessage, editChatMessage, fetchChatDetail, fetchCommunityUsers, getSeededUsers, getSession, openDirectChat, sendChatMessage, startChatCall, updateChatCall } from "../lib/api";

type FriendStatus = "online" | "away" | "offline";

type Friend = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: FriendStatus;
  lastSeen: string;
  isNew: boolean;
  unreadCount?: number;
};

type Reaction = {
  emoji: string;
  count: number;
  reactedByMe?: boolean;
};

type Message = {
  id: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  createdAt: string;
  day: string;
  edited?: boolean;
  seen?: boolean;
  deleted?: boolean;
  reactions?: Reaction[];
  readBy?: { id: string; avatar: string; name: string }[];
  replyTo?: { id: string; text: string };
  highlighted?: boolean;
};

const reactionOptions = ["👍", "❤️", "😂", "🔥", "🎉"];

const buildConversationSeed = (users = getSeededUsers()) => {
  const activeUsers = users.filter((user) => user.username !== "Henry-Of-Ituku");
  const displayUsers: Friend[] = activeUsers.slice(0, 8).map((user, index) => ({
    id: user.id,
    name: user.fullName,
    username: user.username,
    avatar: user.fullName.split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase(),
    status: (index % 3 === 0 ? "online" : index % 3 === 1 ? "away" : "offline") as FriendStatus,
    lastSeen: index % 3 === 0 ? "Active now" : index % 3 === 1 ? "5m ago" : "30m ago",
    isNew: user.role !== "member",
    unreadCount: index < 2 ? 2 + index : 0,
  }));

  return { displayUsers, seedMessages: {} as Record<string, Message[]> };
};

const formatTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRecordingDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export default function ChatPage() {
  const initialSeed = useMemo(() => buildConversationSeed(), []);
  const [friends, setFriends] = useState<Friend[]>(initialSeed.displayUsers);
  const [activeFriendId, setActiveFriendId] = useState<string>(initialSeed.displayUsers[0]?.id ?? "");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesByFriend, setMessagesByFriend] = useState<Record<string, Message[]>>(() => {
    const initial: Record<string, Message[]> = {};
    for (const friend of initialSeed.displayUsers) {
      initial[friend.id] = [];
    }
    return initial;
  });
  const [draft, setDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [messageSounds, setMessageSounds] = useState(true);
  const [recording, setRecording] = useState(false);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [callNotice, setCallNotice] = useState("");
  const [activeCall, setActiveCall] = useState<"voice" | "video" | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callId?: string; fromUsername?: string; callType?: "voice" | "video" } | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let active = true;

    fetchCommunityUsers()
      .then((users) => {
        if (!active) return;
        const nextSeed = buildConversationSeed(users);
        setFriends(nextSeed.displayUsers);

        const preferredChatUser = (() => {
          if (typeof window === "undefined") return null;
          try {
            const raw = localStorage.getItem("ituku-open-chat-user");
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })();

        if (preferredChatUser) {
          const match = nextSeed.displayUsers.find((friend) => friend.id === preferredChatUser.id || friend.name === preferredChatUser.name);
          if (match) {
            setActiveFriendId(match.id);
          }
        }

        setActiveFriendId((current) => current || nextSeed.displayUsers[0]?.id || "");
        setMessagesByFriend((previous) => {
          const nextState = { ...previous };
          for (const friend of nextSeed.displayUsers) {
            if (!nextState[friend.id]) {
              nextState[friend.id] = [];
            }
          }
          return nextState;
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("ituku-chat-messages") || "{}");
      if (saved && typeof saved === "object") setMessagesByFriend(saved);
    } catch {
      setMessagesByFriend({});
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ituku-chat-messages", JSON.stringify(messagesByFriend));
    }
  }, [messagesByFriend]);

  useEffect(() => {
    if (!recording) return;

    const timer = window.setInterval(() => {
      setRecordingSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    setTyping(true);
    const timer = window.setTimeout(() => setTyping(false), 1800);
    return () => window.clearTimeout(timer);
  }, [activeFriendId]);

  const activeFriend = useMemo(
    () => friends.find((friend) => friend.id === activeFriendId) ?? friends[0],
    [activeFriendId, friends],
  );

  const messages = messagesByFriend[activeFriendId] ?? [];
  const filteredFriends = friends.filter((friend) => `${friend.name}`.toLowerCase().includes(search.toLowerCase()));
  const newFriends = friends.filter((friend) => friend.isNew);

  const groupedMessages = useMemo(() => {
    const groups: { day: string; messages: Message[] }[] = [];

    messages.forEach((message) => {
      const currentGroup = groups[groups.length - 1];
      if (!currentGroup || currentGroup.day !== message.day) {
        groups.push({ day: message.day, messages: [message] });
        return;
      }

      currentGroup.messages.push(message);
    });

    return groups;
  }, [messages]);

  const openFriendConversation = (friendId: string) => {
    setActiveFriendId(friendId);
    setFriends((previous) =>
      previous.map((friend) => (friend.id === friendId ? { ...friend, unreadCount: 0 } : friend)),
    );

    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setMobileConversationOpen(true);
    }
  };

  useEffect(() => {
    const token = getSession()?.token;
    if (!token || !activeFriendId) return;
    let active = true;
    openDirectChat(activeFriendId)
      .then((conversation) => fetchChatDetail(conversation.id).then((detail) => ({ conversation, detail })))
      .then(({ conversation, detail }) => {
        if (!active) return;
        setActiveConversationId(conversation.id);
        const mapped: Message[] = detail.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId === getSession()?.user?.id ? "me" : message.senderId,
          text: message.deletedAt ? "This message was deleted" : message.content,
          createdAt: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          day: new Date(message.createdAt).toLocaleDateString(),
          edited: Boolean(message.editedAt),
          deleted: Boolean(message.deletedAt),
          reactions: [],
          replyTo: message.replyTo ? { id: message.replyTo.id, text: message.replyTo.content } : undefined,
        }));
        setMessagesByFriend((previous) => ({ ...previous, [activeFriendId]: mapped }));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [activeFriendId]);

  const addMessage = async (text?: string, audioUrl?: string) => {
    if (!text && !audioUrl) return;

    const nextMessage: Message = {
      id: crypto.randomUUID(),
      senderId: "me",
      text: text ?? "Voice note",
      audioUrl,
      createdAt: formatTime(),
      day: "Today",
      seen: false,
      edited: false,
      deleted: false,
      reactions: [],
      readBy: [],
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text ?? "Voice note" } : undefined,
    };

    if (text && activeConversationId && getSession()?.token) {
      try {
        const saved = await sendChatMessage({ conversationId: activeConversationId, content: text, replyToMessageId: replyTo?.id });
        nextMessage.id = saved.id;
      } catch {
        // Keep the local message when the API is unavailable.
      }
    }

    setMessagesByFriend((previous) => ({
      ...previous,
      [activeFriendId]: [...(previous[activeFriendId] ?? []), nextMessage],
    }));

    setDraft("");
    setReplyTo(null);
  };

  const sendMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addMessage(trimmed);
  };

  const editMessage = async (messageId: string) => {
    const current = messages.find((message) => message.id === messageId);
    if (!current) return;

    const nextValue = window.prompt("Edit message", current.text ?? "");
    if (nextValue === null) return;

    const safeValue = nextValue.trim();
    if (!safeValue) return;

    if (getSession()?.token && activeConversationId) await editChatMessage(messageId, safeValue).catch(() => undefined);
    setMessagesByFriend((previous) => ({
      ...previous,
      [activeFriendId]: (previous[activeFriendId] ?? []).map((message) =>
        message.id === messageId
          ? { ...message, text: safeValue, edited: true, createdAt: formatTime() }
          : message,
      ),
    }));
  };

  const deleteMessage = async (messageId: string) => {
    if (getSession()?.token && activeConversationId) await deleteChatMessage(messageId).catch(() => undefined);
    setMessagesByFriend((previous) => ({
      ...previous,
      [activeFriendId]: (previous[activeFriendId] ?? []).map((message) =>
        message.id === messageId ? { ...message, deleted: true, text: "This message was deleted" } : message,
      ),
    }));
  };

  const clearConversation = () => {
    if (!window.confirm(`Delete this chat with ${activeFriend.name}?`)) return;
    setMessagesByFriend((previous) => ({ ...previous, [activeFriendId]: [] }));
    setCallNotice(`Chat with ${activeFriend.name} was deleted on this device.`);
    window.setTimeout(() => setCallNotice(""), 2500);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    setMessagesByFriend((previous) => ({
      ...previous,
      [activeFriendId]: (previous[activeFriendId] ?? []).map((message) => {
        if (message.id !== messageId) return message;

        const reactions = [...(message.reactions ?? [])];
        const target = reactions.find((entry) => entry.emoji === emoji);

        if (!target) {
          return { ...message, reactions: [...reactions, { emoji, count: 1, reactedByMe: true }] };
        }

        if (target.reactedByMe) {
          const withoutCurrent = reactions.filter((entry) => entry.emoji !== emoji);
          if (target.count <= 1) {
            return { ...message, reactions: withoutCurrent };
          }

          return {
            ...message,
            reactions: [...withoutCurrent, { ...target, count: target.count - 1, reactedByMe: false }],
          };
        }

        return {
          ...message,
          reactions: reactions.map((entry) =>
            entry.emoji === emoji ? { ...entry, count: entry.count + 1, reactedByMe: true } : entry,
          ),
        };
      }),
    }));

    setReactionPickerFor(null);
  };

  const toggleHighlight = (messageId: string) => {
    setMessagesByFriend((previous) => ({
      ...previous,
      [activeFriendId]: (previous[activeFriendId] ?? []).map((message) => message.id === messageId ? { ...message, highlighted: !message.highlighted } : message),
    }));
  };

  const startCall = async (kind: "voice" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
      stream.getTracks().forEach((track) => track.stop());
      const session = getSession();
      if (session?.token) {
        const conversation = await openDirectChat(activeFriend.id);
        const call = await startChatCall(conversation.id, kind === "video" ? "VIDEO" : "VOICE");
        setActiveCallId(call.id);
        socketRef.current?.emit("call:notify", { targetUserId: activeFriend.id, callId: call.id, callType: kind, conversationId: conversation.id });
        setCallNotice(`${kind === "video" ? "Video" : "Voice"} call is ringing ${activeFriend.name}.`);
      } else {
        setCallNotice(`${kind === "video" ? "Video" : "Voice"} call started locally with ${activeFriend.name}.`);
      }
      setActiveCall(kind);
    } catch {
      setCallNotice(`${kind === "video" ? "Video" : "Voice"} call is ready, but device permission was not granted.`);
    }
    window.setTimeout(() => setCallNotice(""), 3500);
  };

  useEffect(() => {
    const token = getSession()?.token;
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("call:incoming", (call: { callId?: string; fromUsername?: string; callType?: "voice" | "video" }) => setIncomingCall(call));
    socket.on("call:ended", () => { setActiveCall(null); setIncomingCall(null); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  const markMessagesAsSeen = () => {
    setMessagesByFriend((previous) => ({
      ...previous,
      [activeFriendId]: (previous[activeFriendId] ?? []).map((message) =>
        message.senderId !== "me"
          ? {
              ...message,
              seen: true,
              readBy: [{ id: activeFriend.id, avatar: activeFriend.avatar, name: activeFriend.name }],
            }
          : message,
      ),
    }));

    setFriends((previous) =>
      previous.map((friend) => (friend.id === activeFriendId ? { ...friend, unreadCount: 0 } : friend)),
    );
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    addMessage(undefined, url);
    event.target.value = "";
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const url = URL.createObjectURL(blob);
        addMessage(undefined, url);
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      window.alert("Microphone access is required to record a voice note.");
    }
  };

  return (
    <AppShell title="Chats" subtitle="Private messages with your friends.">
      <div className={mobileConversationOpen ? "chat-shell mobile-chat-open" : "chat-shell"}>
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <div>
              <p className="eyebrow chat-eyebrow">Messages</p>
              <h2>Inbox</h2>
            </div>
            <button type="button" className="new-chat-button" aria-label="New chat">
              +
            </button>
          </div>

          <div className="ituku-sticker-row">
            <span className="ituku-sticker">ItukuApp</span>
            <span className="ituku-sticker subtle">Stickers</span>
          </div>

          <label className="chat-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search friends"
            />
          </label>

          <section className="friend-strip">
            <div className="friend-strip-header">
              <strong>New friends</strong>
              <span>Say hi</span>
            </div>

            <div className="friend-strip-list">
              {newFriends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  className="new-friend-item"
                  onClick={() => openFriendConversation(friend.id)}
                >
                  <span className="avatar-bubble">{friend.avatar}</span>
                  <span className="new-friend-meta">
                    <b>{friend.name}</b>
                    <small>Send message</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="conversations-label">Recent chats</div>

          <div className="conversation-list">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  className={friend.id === activeFriendId ? "conversation-item active" : "conversation-item"}
                  onClick={() => openFriendConversation(friend.id)}
                >
                  <span className="avatar-wrap">
                    <span className="avatar-bubble soft">{friend.avatar}</span>
                    <span
                      className={
                        friend.status === "online"
                          ? "status-dot online"
                          : friend.status === "away"
                            ? "status-dot away"
                            : "status-dot"
                      }
                    />
                  </span>
                  <span className="conversation-copy">
                    <span className="conversation-topline">
                      <Link
                        href={`/profile/${friend.username}`}
                        className="profile-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <b>{friend.name}</b>
                      </Link>
                      <small>{friend.lastSeen}</small>
                    </span>
                    <span className="conversation-bottomline">
                      <small className="conversation-status">
                        {friend.status === "online" ? "Online" : friend.status === "away" ? "Away" : "Offline"}
                      </small>
                      {friend.unreadCount ? <span className="unread-badge">{friend.unreadCount}</span> : null}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="empty-state">No friends match your search.</p>
            )}
          </div>
        </aside>

        <main className="chat-thread">
          <header className="thread-header">
            <div className="thread-topline">
              <button
                type="button"
                className="mobile-back-button"
                aria-label="Back to chats"
                onClick={() => setMobileConversationOpen(false)}
              >
                ←
              </button>

              <div className="thread-user">
                <span className="avatar-wrap large">
                  <span className="avatar-bubble large">{activeFriend.avatar}</span>
                  <span
                    className={
                      activeFriend.status === "online"
                        ? "status-dot online"
                        : activeFriend.status === "away"
                          ? "status-dot away"
                          : "status-dot"
                    }
                  />
                </span>
                <div>
                  <Link
                    href={`/profile/${activeFriend.username}`}
                    className="profile-link-header"
                  >
                    <strong>{activeFriend.name}</strong>
                  </Link>
                  <small className={typing ? "typing-indicator" : ""}>
                    {typing
                      ? "typing…"
                      : activeFriend.status === "online"
                        ? "Active now"
                        : activeFriend.status === "away"
                          ? "Away right now"
                          : activeFriend.lastSeen}
                  </small>
                </div>
              </div>
            </div>

            <div className="thread-actions">
              <button type="button" className="action-button subtle" onClick={() => startCall("voice")}>
                📞 Call
              </button>
              <button type="button" className="action-button subtle" onClick={() => startCall("video")}>
                📹 Video
              </button>
              <button type="button" className="action-button" onClick={() => setSettingsOpen((value) => !value)}>
                Settings
              </button>
            </div>
          </header>

          {settingsOpen ? (
            <div className="settings-panel">
              <div className="setting-row">
                <span>Read receipts</span>
                <button
                  type="button"
                  className={readReceipts ? "toggle-switch on" : "toggle-switch"}
                  aria-label="Toggle read receipts"
                  onClick={() => setReadReceipts((value) => !value)}
                >
                  <span />
                </button>
              </div>
              <div className="setting-row">
                <span>Message sounds</span>
                <button
                  type="button"
                  className={messageSounds ? "toggle-switch on" : "toggle-switch"}
                  aria-label="Toggle message sounds"
                  onClick={() => setMessageSounds((value) => !value)}
                >
                  <span />
                </button>
              </div>
              <div className="setting-row">
                <span>Privacy mode</span>
                <span className="setting-tag">Friends only</span>
              </div>
              <div className="setting-row"><span>Delete chat</span><button type="button" className="danger-action" onClick={clearConversation}>Delete</button></div>
            </div>
          ) : null}

          {incomingCall ? <div className="call-notice" role="alert"><span>Incoming {incomingCall.callType || "voice"} call from {incomingCall.fromUsername || activeFriend.name}</span><button type="button" onClick={async () => { if (incomingCall.callId) await updateChatCall(incomingCall.callId, "ACCEPTED").catch(() => undefined); setActiveCall(incomingCall.callType || "voice"); setActiveCallId(incomingCall.callId || null); setIncomingCall(null); }}>Accept</button><button type="button" onClick={async () => { if (incomingCall.callId) await updateChatCall(incomingCall.callId, "REJECTED").catch(() => undefined); setIncomingCall(null); }}>Decline</button></div> : null}
          {callNotice ? <div className="call-notice" role="status">{callNotice}<button type="button" onClick={async () => { if (activeCallId) await updateChatCall(activeCallId, "ENDED").catch(() => undefined); setActiveCall(null); setActiveCallId(null); setCallNotice(""); }}>End</button></div> : null}
          {activeCall ? <div className="call-banner">{activeCall === "video" ? "📹" : "📞"} {activeCall} call with {activeFriend.name}</div> : null}

          <section className="message-panel">
            {groupedMessages.map((group) => (
              <div key={group.day} className="day-group">
                <div className="day-divider">
                  <span>{group.day}</span>
                </div>

                {group.messages.map((message) => {
                  const isMine = message.senderId === "me";

                  return (
                    <div key={message.id} className={`${isMine ? "message-row mine" : "message-row"}${message.highlighted ? " highlighted-message" : ""}`}>
                      <div className="message-bubble-wrap">
                        <div className={isMine ? "message-bubble mine" : "message-bubble"}>
                          {message.deleted ? (
                            <em>Message removed</em>
                          ) : (
                            <>
                              {message.audioUrl ? (
                                <div className="voice-note-wrap">
                                  <span className="voice-note-badge">Voice note</span>
                                  <audio controls src={message.audioUrl} className="voice-player" />
                                </div>
                              ) : (
                                <p>{message.text}</p>
                              )}

                              <div className="message-meta">
                                <span>{message.createdAt}</span>
                                {message.edited ? <span>edited</span> : null}
                                {isMine && readReceipts && message.readBy?.length ? (
                                  <span className="read-bubble-wrap">
                                    {message.readBy.map((person) => (
                                      <span key={person.id} className="read-avatar-bubble" title={person.name}>
                                        {person.avatar}
                                      </span>
                                    ))}
                                  </span>
                                ) : null}
                                {isMine && readReceipts ? <span>{message.seen ? "seen" : "sent"}</span> : null}
                              </div>
                            </>
                          )}

                          {message.replyTo ? <div className="reply-preview">Replying to: {message.replyTo.text}</div> : null}

                          {isMine && !message.deleted ? (
                            <div className="message-hover-actions">
                              <button type="button" onClick={() => editMessage(message.id)}>
                                ✎
                              </button>
                              <button type="button" onClick={() => deleteMessage(message.id)}>
                                🗑
                              </button>
                              <button type="button" onClick={() => setReactionPickerFor(message.id)}>
                                🙂
                              </button>
                            </div>
                          ) : null}
                          {!message.deleted ? <div className="message-hover-actions message-tools"><button type="button" onClick={() => setReplyTo(message)}>Reply</button><button type="button" onClick={() => toggleHighlight(message.id)}>{message.highlighted ? "Unhighlight" : "Highlight"}</button>{!isMine ? <button type="button" onClick={() => setReactionPickerFor(message.id)}>React</button> : null}</div> : null}
                        </div>

                        {reactionPickerFor === message.id ? (
                          <div className="reaction-picker" aria-label="Select a reaction">
                            {reactionOptions.map((emoji) => (
                              <button key={emoji} type="button" onClick={() => toggleReaction(message.id, emoji)}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {message.reactions && message.reactions.length > 0 ? (
                        <div className="reaction-stack">
                          {message.reactions.map((reaction) => (
                            <button
                              key={`${message.id}-${reaction.emoji}`}
                              type="button"
                              className={reaction.reactedByMe ? "reaction-pill active" : "reaction-pill"}
                              onClick={() => toggleReaction(message.id, reaction.emoji)}
                            >
                              <span>{reaction.emoji}</span>
                              <small>{reaction.count}</small>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </section>

          <div className="composer-toolbar">
            <button type="button" className="small-action" onClick={() => setDraft("")}>
              Clear
            </button>
            <button type="button" className="small-action" onClick={markMessagesAsSeen}>
              Mark as seen
            </button>
          </div>

          <footer className="composer-box mobile-floating">
            {replyTo ? <div className="reply-composer"><span>Replying to: {replyTo.text}</span><button type="button" onClick={() => setReplyTo(null)}>Cancel</button></div> : null}
            <div className="composer-controls">
              <button type="button" className="round-button" aria-label="Upload audio" onClick={() => audioInputRef.current?.click()}>
                🎵
              </button>
              <button
                type="button"
                className={recording ? "round-button recording" : "round-button"}
                aria-label="Record voice note"
                onClick={toggleRecording}
              >
                {recording ? "■" : "🎤"}
              </button>
            </div>

            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden-input"
              onChange={handleAudioUpload}
            />

            <div className="composer-input-wrap">
              {recording ? <span className="recording-pill">Recording {formatRecordingDuration(recordingSeconds)}</span> : null}
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Message ${activeFriend.name}...`}
                aria-label="Write a message"
              />
            </div>

            <button type="button" className="send-button" onClick={sendMessage}>
              Send
            </button>
          </footer>
        </main>
      </div>
    </AppShell>
  );
}
