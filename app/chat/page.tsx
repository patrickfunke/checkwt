"use client";

import { FormEvent, useEffect, useRef, useState } from 'react';
import * as Ably from 'ably';
import { ChatClient, type ChatMessageEvent, type Message, type Room } from '@ably/chat';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

type UiMessage = {
  id: string;
  text: string;
  clientId: string;
  createdAt: string;
};

const DEFAULT_ROOM = process.env.NEXT_PUBLIC_ABLY_ROOM ?? 'my-first-room';
const CLIENT_ID_STORAGE_KEY = 'ably-chat-client-id';

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

export default function ChatPage() {
  const [clientId, setClientId] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('connecting');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let active = true;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const authUrl = `/api/chat?clientId=${encodeURIComponent(clientId)}`;

    const realtime = new Ably.Realtime({ authUrl, clientId });
    const chatClient = new ChatClient(realtime);

    const detach = async () => {
      if (roomRef.current) {
        await roomRef.current.detach();
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
        roomRef.current = room;

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
        if (active) {
          const chronological = [...history.items].reverse();
          setMessages(chronological.map(mapHistoryMessage));
        }

        const typingSubscription = room.typing.subscribe((typingEvent) => {
          if (!active) {
            return;
          }

          const others = Array.from(typingEvent.currentlyTyping).filter((id) => id !== clientId);
          setTypingUsers(others);
        });

        closeTimer = setTimeout(() => {
          realtime.close();
        }, 1000 * 60 * 15);

        return () => {
          unsubscribeMessages();
          typingSubscription.unsubscribe();
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
      void detach();
    };
  }, [clientId]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !roomRef.current) {
      return;
    }

    try {
      await roomRef.current.messages.send({ text });
      await roomRef.current.typing.stop();
      setDraft('');
    } catch (cause) {
      console.error(cause);
      setError('Nachricht konnte nicht gesendet werden.');
    }
  };

  const onChangeDraft = async (value: string) => {
    setDraft(value);
    if (!roomRef.current) {
      return;
    }
    try {
      await roomRef.current.typing.keystroke();
    } catch {
      // Ignore transient typing indicator errors.
    }
  };

  return (
    <main className={spaceGrotesk.className}>
      <section className="chat-shell">
        <header className="chat-head">
          <h1>Ably Chat</h1>
          <p>Room: {DEFAULT_ROOM}</p>
          <span className="badge">{status}</span>
        </header>

        <div ref={listRef} className="message-list">
          {messages.length === 0 ? <p className="empty">Noch keine Nachrichten.</p> : null}
          {messages.map((message) => (
            <article key={message.id} className={message.clientId === clientId ? 'mine' : 'theirs'}>
              <div className="meta">
                <strong>{message.clientId}</strong>
                <span>{message.createdAt}</span>
              </div>
              <p>{message.text}</p>
            </article>
          ))}
        </div>

        {typingUsers.length > 0 ? (
          <p className="typing">{typingUsers.join(', ')} tippt gerade...</p>
        ) : (
          <p className="typing muted">&nbsp;</p>
        )}

        <form onSubmit={send} className="composer">
          <input
            type="text"
            value={draft}
            onChange={(event) => {
              void onChangeDraft(event.target.value);
            }}
            placeholder="Nachricht schreiben..."
          />
          <button type="submit">Senden</button>
        </form>

        {error ? <p className="error">{error}</p> : null}
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
          width: min(840px, 100%);
          height: min(82vh, 900px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(24, 24, 27, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 80px rgba(15, 23, 42, 0.16);
          display: grid;
          grid-template-rows: auto 1fr auto auto auto;
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
          max-width: min(82%, 560px);
          animation: rise 220ms ease-out;
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

        .composer input {
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          padding: 0.75rem 0.85rem;
          outline: none;
          font: inherit;
          transition: border-color 150ms ease;
        }

        .composer input:focus {
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

          .message-list article {
            max-width: 92%;
          }
        }
      `}</style>
    </main>
  );
}