"use client";

import { FormEvent, type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react';
import * as Ably from 'ably';
import { ChatClient, type ChatMessageEvent, type Message, type Room } from '@ably/chat';
import { Space_Grotesk } from 'next/font/google';
import IframePanel from './components/IframePanel';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

type UiMessage = {
  id: string;
  text: string;
  clientId: string;
  createdAt: string;
};

type OnlineUser = {
  clientId: string;
  displayName: string;
};

const DEFAULT_ROOM = process.env.NEXT_PUBLIC_ABLY_ROOM ?? 'my-first-room';
const CLIENT_ID_STORAGE_KEY = 'ably-chat-client-id';
const DISPLAY_NAME_STORAGE_KEY = 'ably-chat-display-name';
const DIRECT_ROOM_PREFIX = 'dm-';
const CLEARED_ROOMS_STORAGE_KEY = 'ably-chat-cleared-rooms-v1';

function sanitizeDisplayName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return '';
  }
  return normalized.slice(0, 32);
}

function guestId() {
  return `guest-${Math.random().toString(36).slice(2, 8)}`;
}

function getOrCreateClientId() {
  if (typeof window === 'undefined') {
    return '';
  }

  const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY)?.trim();
  if (existing) {
    return existing.slice(0, 64);
  }

  const created = guestId();
  window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, created);
  return created;
}

function getOrCreateDisplayName(clientId: string) {
  if (typeof window === 'undefined') {
    return clientId;
  }

  const existing = sanitizeDisplayName(window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) ?? '');
  if (existing) {
    return existing;
  }

  window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, clientId);
  return clientId;
}

function mapMessage(messageEvent: ChatMessageEvent): UiMessage {
  return {
    id: messageEvent.message.serial,
    text: messageEvent.message.text,
    clientId: messageEvent.message.clientId ?? 'unknown',
    createdAt: messageEvent.message.timestamp.toLocaleTimeString(),
  };
}

function mapHistoryMessage(message: Message): UiMessage {
  return {
    id: message.serial,
    text: message.text,
    clientId: message.clientId ?? 'unknown',
    createdAt: message.timestamp.toLocaleTimeString(),
  };
}

function directRoomName(a: string, b: string) {
  const [left, right] = [a, b].sort((x, y) => x.localeCompare(y));
  return `${DIRECT_ROOM_PREFIX}${encodeURIComponent(left)}--${encodeURIComponent(right)}`;
}

function MessageText({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setNeedsExpand(el.scrollHeight > el.clientHeight + 1);
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [text]);

  const collapsedStyle: React.CSSProperties = {
    maxHeight: 'calc(1.1rem * 7)',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };

  const expandedStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };

  return (
    <div>
      <div ref={ref} style={expanded ? expandedStyle : collapsedStyle} className="message-text">
        {text}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded((s) => !s)}
          className="smaller-link"
          style={{ marginTop: '6px', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          {expanded ? 'weniger' : 'mehr'}
        </button>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [clientId, setClientId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('connecting');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedOnlineUser, setSelectedOnlineUser] = useState<string | null>(null);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [chatClientInstance, setChatClientInstance] = useState<ChatClient | null>(null);
  const [isOnlineCollapsed, setIsOnlineCollapsed] = useState(false);
  const [iframeWidth, setIframeWidth] = useState(480);
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  const lobbyRoomRef = useRef<Room | null>(null);
  const chatRoomRef = useRef<Room | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const decodeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const encodeIframeRef = useRef<HTMLIFrameElement | null>(null);

  const isRoomHistoryCleared = (roomName: string) => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const raw = window.localStorage.getItem(CLEARED_ROOMS_STORAGE_KEY);
      if (!raw) {
        return false;
      }
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      return Boolean(parsed[roomName]);
    } catch {
      return false;
    }
  };

  const markRoomHistoryCleared = (roomName: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(CLEARED_ROOMS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      parsed[roomName] = true;
      window.localStorage.setItem(CLEARED_ROOMS_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore storage issues.
    }
  };

  const startResizeChatTools = (startEvent: ReactMouseEvent<HTMLDivElement>) => {
    if (!chatBodyRef.current || isCompactLayout) {
      return;
    }

    startEvent.preventDefault();
    const container = chatBodyRef.current;

    const onMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const desiredIframeWidth = rect.right - event.clientX;
      const minIframeWidth = 340;
      const minChatWidth = 360;
      const onlineWidth = isOnlineCollapsed ? 54 : 220;
      const splitterWidth = 10;
      const maxIframeWidth = rect.width - onlineWidth - splitterWidth - minChatWidth;
      const nextIframeWidth = Math.max(minIframeWidth, Math.min(maxIframeWidth, desiredIframeWidth));
      setIframeWidth(nextIframeWidth);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const requestEncodedTokenFromIframe = (text: string) => {
    return new Promise<string>((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const timeoutId = window.setTimeout(() => {
        window.removeEventListener('message', onMessage);
        reject(new Error('Encode timeout'));
      }, 5000);

      const onMessage = (event: MessageEvent) => {
        const data = event.data as
          | { type?: string; requestId?: unknown; token?: unknown; error?: unknown }
          | undefined;

        if (!data || data.type !== 'encodedToken' || data.requestId !== requestId) {
          return;
        }

        window.clearTimeout(timeoutId);
        window.removeEventListener('message', onMessage);

        if (typeof data.token === 'string' && data.token.trim()) {
          resolve(data.token);
          return;
        }

        const reason = typeof data.error === 'string' && data.error ? data.error : 'Encoding failed';
        reject(new Error(reason));
      };

      window.addEventListener('message', onMessage);
      encodeIframeRef.current?.contentWindow?.postMessage(
        {
          type: 'encodeAndReturnToken',
          requestId,
          text,
        },
        '*',
      );
    });
  };

  const adjustComposerHeight = () => {
    const el = composerInputRef.current;
    if (!el) return;
    // reset to auto to measure scrollHeight correctly
    el.style.height = 'auto';
    const computed = window.getComputedStyle(el);
    const maxHeight = parseFloat(computed.maxHeight || '0');
    const scroll = el.scrollHeight;
    const newHeight = maxHeight && scroll > maxHeight ? maxHeight : scroll;
    el.style.height = `${newHeight}px`;
    el.style.overflowY = scroll > (maxHeight || Infinity) ? 'auto' : 'hidden';
  };

  const resolveDisplayName = (id: string) => {
    if (id === clientId) {
      return displayName || id;
    }
    const found = onlineUsers.find((user) => user.clientId === id);
    return found?.displayName || id;
  };

  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);

  useEffect(() => {
    if (!clientId) {
      return;
    }
    const initialName = getOrCreateDisplayName(clientId);
    setDisplayName(initialName);
    setNameDraft(initialName);
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let active = true;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const authUrl = `/api/chat?clientId=${encodeURIComponent(clientId)}`;

    const realtime = new Ably.Realtime({ authUrl, clientId });
    const chatClient = new ChatClient(realtime);
    setChatClientInstance(chatClient);

    const detach = async () => {
      if (chatRoomRef.current) {
        try {
          await chatRoomRef.current.detach();
        } catch {
          // Ignore cleanup errors when connection is already closed.
        }
      }

      if (lobbyRoomRef.current) {
        // Only attempt to leave presence if the underlying channel/room is attached.
        // Ably logs an error when presence operations are called while not attached,
        // so check several likely indicators before calling `leave`.
        try {
          const roomAny = lobbyRoomRef.current as any;
          const channelState = roomAny?.channel?.state ?? roomAny?.state ?? (roomAny?.attached ? 'attached' : undefined);
          if (channelState === 'attached') {
            try {
              await lobbyRoomRef.current.presence.leave({ status: 'offline' });
            } catch {
              // Ignore transient presence errors.
            }
          }
        } catch {
          // ignore
        }

        try {
          await lobbyRoomRef.current.detach();
        } catch {
          // Ignore cleanup errors when connection is already closed.
        }
      }

      realtime.close();
    };

    chatClient.connection.onStatusChange((change) => {
      if (!active) {
        return;
      }
      setStatus(change.current);
    });

    const init = async () => {
      try {
        const room = await chatClient.rooms.get(DEFAULT_ROOM);
        lobbyRoomRef.current = room;

        await room.attach();

        const initialDisplayName = getOrCreateDisplayName(clientId);
        await room.presence.enter({ status: 'online', displayName: initialDisplayName });

        const refreshOnlineUsers = async () => {
          const members = await room.presence.get();
          if (!active) {
            return;
          }

          const byClientId = new Map<string, OnlineUser>();
          members.forEach((member) => {
            const id = member.clientId;
            if (!id) {
              return;
            }

            const raw = member.data as { displayName?: unknown } | undefined;
            const candidate = typeof raw?.displayName === 'string' ? sanitizeDisplayName(raw.displayName) : '';
            const name = candidate || id;
            byClientId.set(id, { clientId: id, displayName: name });
          });

          const users = Array.from(byClientId.values()).sort((a, b) =>
            a.displayName.localeCompare(b.displayName),
          );
          setOnlineUsers(users);
        };

        await refreshOnlineUsers();

        const presenceSubscription = room.presence.subscribe(() => {
          void refreshOnlineUsers();
        });

        closeTimer = setTimeout(() => {
          realtime.close();
        }, 1000 * 60 * 15);

        return () => {
          presenceSubscription.unsubscribe();
        };
      } catch (cause) {
        console.error(cause);
        if (active) {
          setError('Chat konnte nicht verbunden werden. Bitte ABLY_API_KEY prüfen.');
        }
        return undefined;
      }
    };

    let cleanupSubscriptions: (() => void) | undefined;
    init().then((cleanup) => {
      cleanupSubscriptions = cleanup;
    });

    return () => {
      active = false;
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
      cleanupSubscriptions?.();
      setChatClientInstance(null);
      void detach();
    };
  }, [clientId]);

  useEffect(() => {
    if (!chatClientInstance || !clientId) {
      return;
    }

    const roomName = activePeerId ? directRoomName(clientId, activePeerId) : DEFAULT_ROOM;
    let active = true;

    const initRoom = async () => {
      try {
        setError(null);
        setTypingUsers([]);
        setMessages([]);

        const room = await chatClientInstance.rooms.get(roomName);
        chatRoomRef.current = room;

        await room.attach();

        const { historyBeforeSubscribe, unsubscribe: unsubscribeMessages } = room.messages.subscribe(
          (messageEvent: ChatMessageEvent) => {
            if (!active) {
              return;
            }
            setMessages((prev) => [...prev, mapMessage(messageEvent)]);
          },
        );

        const history = await historyBeforeSubscribe({ limit: 30 });
        if (active && !isRoomHistoryCleared(roomName)) {
          const chronological = [...history.items].reverse();
          setMessages(chronological.map(mapHistoryMessage));
        } else if (active) {
          setMessages([]);
        }

        const typingSubscription = room.typing.subscribe((typingEvent) => {
          if (!active) {
            return;
          }

          const others = Array.from(typingEvent.currentlyTyping).filter((id) => id !== clientId);
          setTypingUsers(others);
        });

        return () => {
          unsubscribeMessages();
          typingSubscription.unsubscribe();
        };
      } catch (cause) {
        console.error(cause);
        if (active) {
          setError('Chat-Raum konnte nicht geöffnet werden.');
        }
        return undefined;
      }
    };

    let cleanupSubscriptions: (() => void) | undefined;
    initRoom().then((cleanup) => {
      cleanupSubscriptions = cleanup;
    });

    return () => {
      active = false;
      cleanupSubscriptions?.();

      const room = chatRoomRef.current;
      chatRoomRef.current = null;
      if (room) {
        void room.detach();
      }
    };
  }, [chatClientInstance, clientId, activePeerId]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!selectedOnlineUser) {
      return;
    }
    if (!onlineUsers.some((user) => user.clientId === selectedOnlineUser)) {
      setSelectedOnlineUser(null);
    }
  }, [onlineUsers, selectedOnlineUser]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(max-width: 640px)');
    const updateCompact = () => {
      setIsCompactLayout(media.matches);
    };

    updateCompact();
    media.addEventListener('change', updateCompact);
    return () => media.removeEventListener('change', updateCompact);
  }, []);

  useEffect(() => {
    if (!isCompactLayout) {
      return;
    }
    setIsOnlineCollapsed(false);
  }, [isCompactLayout]);

  const saveDisplayName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = sanitizeDisplayName(nameDraft) || clientId;

    setDisplayName(nextName);
    setNameDraft(nextName);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, nextName);
    }

    setOnlineUsers((prev) =>
      prev.map((user) => (user.clientId === clientId ? { ...user, displayName: nextName } : user)),
    );

    if (!lobbyRoomRef.current) {
      return;
    }

    try {
      await lobbyRoomRef.current.presence.update({ status: 'online', displayName: nextName });
    } catch {
      // Ignore transient presence update failures.
    }
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !chatRoomRef.current) {
      return;
    }

    try {
      const token = await requestEncodedTokenFromIframe(text);
      await chatRoomRef.current.messages.send({ text: token });
      await chatRoomRef.current.typing.stop();
      try {
        decodeIframeRef.current?.contentWindow?.postMessage({ type: 'send', text }, '*');
      } catch {}
      try {
        encodeIframeRef.current?.contentWindow?.postMessage({ type: 'send', text }, '*');
      } catch {}
      setDraft('');
    } catch (cause) {
      console.error(cause);
      setError('Nachricht konnte nicht gesendet werden. Encode fehlgeschlagen.');
    }
  };

  const onChangeDraft = async (value: string) => {
    setDraft(value);
    try {
      window.postMessage({ type: 'openEncodePanelFromChat', text: value }, '*');
    } catch {}
    try {
      decodeIframeRef.current?.contentWindow?.postMessage({ type: 'draft', text: value }, '*');
    } catch {}
    try {
      encodeIframeRef.current?.contentWindow?.postMessage({ type: 'draft', text: value }, '*');
    } catch {}
    if (!chatRoomRef.current) {
      return;
    }
    try {
      await chatRoomRef.current.typing.keystroke();
    } catch {
      // Ignore transient typing indicator errors.
    }
  };

  const copyMessageToDecode = (message: UiMessage) => {
    try {
      window.postMessage({ type: 'openDecodePanelFromChat', text: message.text }, '*');
      setCopiedMessageId(message.id);
      window.setTimeout(() => {
        setCopiedMessageId((prev) => (prev === message.id ? null : prev));
      }, 1200);
    } catch {
      setError('Nachricht konnte nicht ins Decode-Tool übernommen werden.');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    adjustComposerHeight();
    const onResize = () => adjustComposerHeight();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draft]);

  const startChatWithUser = (userId: string) => {
    setActivePeerId(userId);
    setDraft('');
    setSelectedOnlineUser(userId);
    composerInputRef.current?.focus();
  };

  const handleClearHistory = () => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Verlauf wirklich löschen?') : true;
    if (!confirmed) return;
    const roomName = activePeerId ? directRoomName(clientId, activePeerId) : DEFAULT_ROOM;
    markRoomHistoryCleared(roomName);
    setMessages([]);
  };

  const chatBodyColumns = isCompactLayout
    ? undefined
    : `${isOnlineCollapsed ? 54 : 220}px minmax(360px, 1fr) 10px ${iframeWidth}px`;

  return (
    <main className={spaceGrotesk.className}>
      <button type="button" className="clear-history absolute top-0 left-0" onClick={handleClearHistory}>
        D
      </button>
      <section className="chat-shell">
        <header className="chat-head">
          <h1>JWTF Chat</h1>
          <p>{activePeerId ? `1:1 mit ${resolveDisplayName(activePeerId)}` : `Room: ${DEFAULT_ROOM}`}</p>
          <span className="badge">{status}</span>
          {activePeerId ? (
            <button
              type="button"
              className="back-to-lobby"
              onClick={() => {
                setActivePeerId(null);
              }}
            >
              Zur Lobby
            </button>
          ) : null}
        </header>

        <div ref={chatBodyRef} className="chat-body" style={chatBodyColumns ? { gridTemplateColumns: chatBodyColumns } : undefined}>
          <aside className={`online-sidebar ${isOnlineCollapsed ? 'collapsed' : ''}`} aria-label="Online Benutzer">
            <div className="sidebar-head">
              <h2>Online</h2>
              <button
                type="button"
                className="toggle-online"
                onClick={() => {
                  setIsOnlineCollapsed((prev) => !prev);
                }}
                aria-expanded={!isOnlineCollapsed}
                aria-label={isOnlineCollapsed ? 'Online-Spalte aufklappen' : 'Online-Spalte einklappen'}
                title={isOnlineCollapsed ? 'Online aufklappen' : 'Online einklappen'}
              >
                {isOnlineCollapsed ? '>' : '<'}
              </button>
            </div>

            {isOnlineCollapsed ? (
              <>
                <p className="online-collapsed-label">Online</p>
                <p className="online-collapsed-count">{onlineUsers.length}</p>
              </>
            ) : (
              <>
                <form className="name-form" onSubmit={saveDisplayName}>
                  <label htmlFor="displayNameInput">Dein Name</label>
                  <div className="name-row">
                    <input
                      id="displayNameInput"
                      type="text"
                      value={nameDraft}
                      onChange={(event) => {
                        setNameDraft(event.target.value);
                      }}
                      placeholder="Name eingeben"
                      maxLength={32}
                    />
                    <button type="submit">Speichern</button>
                  </div>
                </form>

                <p className="online-count">{onlineUsers.length} aktiv</p>
                <ul>
                  {onlineUsers.length === 0 ? <li className="empty-small">Niemand online</li> : null}
                  {onlineUsers.map((user) => (
                    <li
                      key={user.clientId}
                      className={[
                        user.clientId === clientId ? 'me' : '',
                        selectedOnlineUser === user.clientId ? 'selected' : '',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        className="online-user-btn"
                        onClick={() => {
                          if (user.clientId === clientId) {
                            setSelectedOnlineUser(null);
                            return;
                          }
                          setActivePeerId((prev) => (prev === user.clientId ? null : user.clientId));
                          setSelectedOnlineUser((prev) => (prev === user.clientId ? null : user.clientId));
                        }}
                      >
                        <span className="dot" aria-hidden="true" />
                        <span>{user.clientId === clientId ? `${user.displayName} (du)` : user.displayName}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {selectedOnlineUser ? (
                  <div className="start-chat-box">
                    <p>Mit {resolveDisplayName(selectedOnlineUser)} chatten?</p>
                    <button
                      type="button"
                      onClick={() => {
                        startChatWithUser(selectedOnlineUser);
                      }}
                    >
                      1:1 Chat anfangen
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </aside>

            <div className="chat-main">
              <div ref={listRef} className="message-list">
              {messages.length === 0 ? <p className="empty">Noch keine Nachrichten.</p> : null}
              {messages.map((message) => (
                <article key={message.id} className={message.clientId === clientId ? 'mine' : 'theirs'}>
                  <div className="meta">
                    <strong>{resolveDisplayName(message.clientId)}</strong>
                    <span>{message.createdAt}</span>
                  </div>
                  <MessageText text={message.text} />
                  <button
                    type="button"
                    className="copy-message-btn"
                    onClick={() => {
                      copyMessageToDecode(message);
                    }}
                  >
                    {copiedMessageId === message.id ? 'Im Decode' : 'In Decode'}
                  </button>
                </article>
              ))}
            </div>

            {typingUsers.length > 0 ? (
              <p className="typing">{typingUsers.map((id) => resolveDisplayName(id)).join(', ')} tippt gerade...</p>
            ) : (
              <p className="typing muted">&nbsp;</p>
            )}

            <form onSubmit={send} className="composer">
              <textarea
                ref={composerInputRef}
                value={draft}
                onChange={(event) => {
                  void onChangeDraft(event.target.value);
                }}
                placeholder="Nachricht schreiben..."
                rows={1}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit">Senden</button>
              </div>
            </form>

            {error ? <p className="error">{error}</p> : null}
          </div>
          <div
            className="column-resizer"
            role="separator"
            aria-label="Breite zwischen Chat und Tools anpassen"
            aria-orientation="vertical"
            onMouseDown={startResizeChatTools}
          />
          <IframePanel decodeRef={decodeIframeRef} encodeRef={encodeIframeRef} />
        </div>
      </section>

      <style jsx>{`
        main {
          min-height: 100vh;
          padding: 2rem 1rem;
          background:
            radial-gradient(circle at 12% 10%, rgba(255, 193, 7, 0.35), transparent 35%),
            radial-gradient(circle at 85% 25%, rgba(0, 172, 193, 0.25), transparent 40%),
            linear-gradient(130deg, #fff5d6, #f5fbff 42%, #f2fff3);
          display: grid;
          place-items: center;
        }

        .chat-shell {
          width: min(1200px, 100%);
          height: min(82vh, 900px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(24, 24, 27, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 80px rgba(15, 23, 42, 0.16);
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          backdrop-filter: blur(6px);
        }

        .chat-head {
          padding: 1rem 1.2rem;
          background: linear-gradient(120deg, #0f172a, #1e293b);
          color: #f8fafc;
          display: grid;
          gap: 0.2rem;
        }

        .chat-head h1 {
          margin: 0;
          font-size: clamp(1.15rem, 2.1vw, 1.5rem);
          letter-spacing: 0.03em;
        }

        .chat-head p {
          margin: 0;
          color: #cbd5e1;
          font-size: 0.9rem;
        }

        .badge {
          justify-self: start;
          margin-top: 0.3rem;
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.18);
          border: 1px solid rgba(16, 185, 129, 0.45);
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
        }

        .back-to-lobby {
          justify-self: start;
          margin-top: 0.35rem;
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          font: inherit;
          font-size: 0.78rem;
          padding: 0.3rem 0.65rem;
          cursor: pointer;
        }

        .back-to-lobby:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .clear-history {
          justify-self: start;
          margin-top: 0.35rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: #f8fafc;
          font: inherit;
          font-size: 0.78rem;
          padding: 0.3rem 0.65rem;
          cursor: pointer;
        }

        .chat-body {
          min-height: 0;
          display: grid;
          grid-template-columns: 220px minmax(360px, 1fr) 10px 480px;
          column-gap: 0; /* remove gap so panel sits flush */
          height: 100%;
        }

        :global(.iframe-panel-shell) {
          grid-column: 4;
          align-self: stretch;
          padding: 0; /* ensure no extra spacing */
          height: 100%;
          min-height: 0;
        }

        :global(.iframe-panel) {
          height: 100%;
          min-height: 0;
        }

        :global(.chat-main) {
          grid-column: 2;
          align-self: stretch;
          height: 100%;
          min-height: 0;
        }

        :global(.online-sidebar) {
          grid-column: 1;
        }

        .column-resizer {
          grid-column: 3;
          width: 10px;
          cursor: col-resize;
          background:
            linear-gradient(to right, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.08));
          transition: background 120ms ease;
        }

        .column-resizer:hover {
          background:
            linear-gradient(to right, rgba(2, 132, 199, 0.1), rgba(2, 132, 199, 0.34), rgba(2, 132, 199, 0.1));
        }

        .online-sidebar {
          border-right: 1px solid rgba(15, 23, 42, 0.1);
          background: linear-gradient(170deg, rgba(2, 132, 199, 0.07), rgba(14, 116, 144, 0.03));
          padding: 0.9rem 0.8rem;
          overflow-y: auto;
        }

        .sidebar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
        }

        .toggle-online {
          border: 1px solid rgba(2, 132, 199, 0.28);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.85);
          color: #0f172a;
          min-width: 28px;
          height: 28px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .online-sidebar.collapsed {
          padding: 0.6rem 0.5rem;
          overflow: hidden;
        }

        .online-sidebar.collapsed .sidebar-head {
          justify-content: center;
        }

        .online-sidebar.collapsed h2 {
          display: none;
        }

        .online-sidebar.collapsed .toggle-online {
          width: 100%;
          min-width: 0;
          height: 30px;
        }

        .online-collapsed-label {
          margin: 0.55rem 0 0;
          text-align: center;
          font-size: 0.62rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #334155;
        }

        .online-collapsed-count {
          margin: 0.35rem auto 0;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(2, 132, 199, 0.16);
          color: #0f172a;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .name-form {
          margin-bottom: 0.9rem;
          display: grid;
          gap: 0.35rem;
        }

        .name-form label {
          font-size: 0.77rem;
          color: #334155;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .name-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.4rem;
        }

        .name-row input {
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.16);
          padding: 0.42rem 0.55rem;
          font: inherit;
          font-size: 0.84rem;
          outline: none;
          background: rgba(255, 255, 255, 0.92);
        }

        .name-row input:focus {
          border-color: #0284c7;
        }

        .name-row button {
          border: none;
          border-radius: 10px;
          padding: 0.42rem 0.6rem;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          color: #f8fafc;
          background: linear-gradient(120deg, #0ea5e9, #0f766e);
          cursor: pointer;
          width: 100%;
        }

        .online-sidebar h2 {
          margin: 0;
          font-size: 0.95rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #0f172a;
        }

        .online-count {
          margin: 0.25rem 0 0.75rem;
          font-size: 0.82rem;
          color: #475569;
        }

        .online-sidebar ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.4rem;
        }

        .online-sidebar li {
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.6);
        }

        .online-user-btn {
          width: 100%;
          border: none;
          background: transparent;
          border-radius: 10px;
          padding: 0.42rem 0.45rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: #0f172a;
          font-size: 0.88rem;
          text-align: left;
          font: inherit;
          cursor: pointer;
        }

        .online-user-btn:hover {
          background: rgba(2, 132, 199, 0.08);
        }

        .online-sidebar li.selected {
          border: 1px solid rgba(14, 116, 144, 0.45);
          background: rgba(14, 116, 144, 0.14);
        }

        .online-sidebar li.me {
          background: rgba(14, 165, 233, 0.12);
          border: 1px solid rgba(2, 132, 199, 0.28);
        }

        .empty-small {
          color: #64748b;
          font-style: italic;
        }

        .dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.24);
          flex: none;
        }

        .start-chat-box {
          margin-top: 0.75rem;
          border-radius: 12px;
          border: 1px solid rgba(2, 132, 199, 0.25);
          background: rgba(255, 255, 255, 0.7);
          padding: 0.6rem;
          display: grid;
          gap: 0.45rem;
        }

        .start-chat-box p {
          margin: 0;
          color: #0f172a;
          font-size: 0.85rem;
        }

        .start-chat-box button {
          border: none;
          border-radius: 10px;
          padding: 0.5rem 0.65rem;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          color: #f8fafc;
          background: linear-gradient(120deg, #0284c7, #0f766e);
          cursor: pointer;
        }

        .chat-main {
          min-height: 0;
          display: grid;
          grid-template-rows: 1fr auto auto auto;
        }

        .message-list {
          overflow-y: auto;
          padding: 1rem;
          display: grid;
          align-content: start;
          gap: 0.75rem;
        }

        .message-list article {
          padding: 0.65rem 0.8rem;
          border-radius: 14px;
          max-width: min(92%, 900px);
          animation: rise 220ms ease-out;
        }

        .copy-message-btn {
          margin-top: 0.5rem;
          border: 1px solid rgba(15, 23, 42, 0.18);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          padding: 0.24rem 0.55rem;
          font: inherit;
          font-size: 0.74rem;
          cursor: pointer;
        }

        .mine .copy-message-btn {
          border-color: rgba(255, 255, 255, 0.45);
          background: rgba(255, 255, 255, 0.14);
          color: #eff6ff;
        }

        .mine {
          justify-self: end;
          background: linear-gradient(130deg, #0ea5e9, #2563eb);
          color: #eff6ff;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
        }

        .theirs {
          justify-self: start;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.12);
          color: #0f172a;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          gap: 0.8rem;
          margin-bottom: 0.35rem;
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .message-list p,
        .meta,
        .typing,
        .error,
        .empty {
          margin: 0;
        }

        .empty {
          color: #64748b;
          text-align: center;
          margin-top: 2rem;
        }

        .typing {
          padding: 0 1rem;
          font-size: 0.85rem;
          color: #0f172a;
        }

        .muted {
          color: transparent;
        }

        .composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.65rem;
          padding: 0.9rem 1rem;
        }

        .composer input,
        .composer textarea {
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          padding: 0.75rem 0.85rem;
          outline: none;
          font: inherit;
          transition: border-color 150ms ease;
          line-height: 1.25rem;
          max-height: calc(1.25rem * 5 + 1rem);
          overflow-y: auto;
          resize: none;
        }

        .composer input:focus,
        .composer textarea:focus {
          border-color: #0284c7;
        }

        .composer button {
          border-radius: 12px;
          border: none;
          padding: 0.75rem 1rem;
          font: inherit;
          font-weight: 600;
          color: #f8fafc;
          background: linear-gradient(120deg, #f97316, #fb7185);
          cursor: pointer;
        }

        .error {
          padding: 0 1rem 1rem;
          color: #b91c1c;
          font-size: 0.9rem;
        }

        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 640px) {
          .chat-shell {
            height: 88vh;
            border-radius: 18px;
          }

          .chat-body {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }

          .column-resizer {
            display: none;
          }

          .online-sidebar {
            border-right: none;
            border-bottom: 1px solid rgba(15, 23, 42, 0.1);
            max-height: 190px;
          }

          .online-sidebar ul {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }

          .message-list article {
            max-width: 92%;
          }
        }
      `}</style>
    </main>
  );
}
