"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function IframePanel({
  decodeRef,
  encodeRef,
}: {
  decodeRef: React.RefObject<HTMLIFrameElement | null>;
  encodeRef: React.RefObject<HTMLIFrameElement | null>;
}) {
  const [isDecodeOpen, setIsDecodeOpen] = useState(false);
  const [isEncodeOpen, setIsEncodeOpen] = useState(true);
  const pendingDecodeTextRef = useRef<string | null>(null);
  const pendingEncodeTextRef = useRef<string | null>(null);

  const postToIframe = (
    ref: React.RefObject<HTMLIFrameElement | null>,
    payload: Record<string, unknown>,
  ) => {
    const iframeWindow = ref.current?.contentWindow;
    if (!iframeWindow) {
      return false;
    }

    try {
      iframeWindow.postMessage(payload, '*');
      return true;
    } catch {
      // Ignore transient iframe access timing issues.
      return false;
    }
  };

  const syncEncodeDraft = (text: string) => {
    if (!postToIframe(encodeRef, { type: 'draft', text })) {
      pendingEncodeTextRef.current = text;
    }
  };

  const syncDecodeToken = (text: string) => {
    if (!postToIframe(decodeRef, { type: 'copyToDecode', text })) {
      pendingDecodeTextRef.current = text;
    }
  };

  const syncDecodeTokenWithRetry = (text: string) => {
    pendingDecodeTextRef.current = text;
    const delays = [0, 140, 320, 700, 1200];
    delays.forEach((delay) => {
      window.setTimeout(() => {
        if (pendingDecodeTextRef.current === null) {
          return;
        }
        syncDecodeToken(pendingDecodeTextRef.current);
        revealDecodeInput();
      }, delay);
    });

    window.setTimeout(() => {
      pendingDecodeTextRef.current = null;
    }, 1800);
  };

  const revealEncodeInput = () => {
    postToIframe(encodeRef, { type: 'focusEncodePayloadInput' });
  };

  const revealDecodeInput = () => {
    postToIframe(decodeRef, { type: 'focusDecodeTokenInput' });
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: unknown; text?: unknown } | undefined;
      if (!data || typeof data.type !== 'string') {
        return;
      }

      if (data.type === 'openEncodePanelFromChat') {
        setIsDecodeOpen(false);
        setIsEncodeOpen(true);
        if (typeof data.text === 'string') {
          pendingEncodeTextRef.current = data.text;
        }
        window.setTimeout(() => {
          revealEncodeInput();
          if (pendingEncodeTextRef.current !== null) {
            syncEncodeDraft(pendingEncodeTextRef.current);
          }
        }, 220);
        return;
      }

      if (data.type === 'openDecodePanelFromChat') {
        setIsEncodeOpen(false);
        setIsDecodeOpen(true);
        if (typeof data.text === 'string') {
          syncDecodeTokenWithRetry(data.text);
        }
        window.setTimeout(() => {
          revealDecodeInput();
          if (pendingDecodeTextRef.current !== null) {
            syncDecodeTokenWithRetry(pendingDecodeTextRef.current);
          }
        }, 220);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <aside className="iframe-panel-shell">
      <div className="iframe-panel">
        <header className="panel-head">
          <h2>Tools</h2>
        </header>
        <div className="iframe-row">
          <div className="iframe-box">
            <button
              type="button"
              className="collapse-trigger"
              aria-expanded={isDecodeOpen}
              onClick={() =>
                setIsDecodeOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setIsEncodeOpen(false);
                  }
                  if (next) {
                    window.setTimeout(() => revealDecodeInput(), 180);
                  }
                  return next;
                })
              }
            >
              <h3>Decode</h3>
              <span>{isDecodeOpen ? 'zuklappen' : 'aufklappen'}</span>
            </button>
            {isDecodeOpen ? (
              <iframe
                ref={decodeRef}
                src="/home"
                title="Decode tool"
                onLoad={() => {
                  if (pendingDecodeTextRef.current !== null) {
                    syncDecodeTokenWithRetry(pendingDecodeTextRef.current);
                  }
                  revealDecodeInput();
                }}
              />
            ) : null}
          </div>
          <div className="iframe-box">
            <button
              type="button"
              className="collapse-trigger"
              aria-expanded={isEncodeOpen}
              onClick={() =>
                setIsEncodeOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setIsDecodeOpen(false);
                  }
                  if (next) {
                    window.setTimeout(() => revealEncodeInput(), 180);
                  }
                  return next;
                })
              }
            >
              <h3>Encode</h3>
              <span>{isEncodeOpen ? 'zuklappen' : 'aufklappen'}</span>
            </button>
            {isEncodeOpen ? (
              <iframe
                ref={encodeRef}
                src="/encode"
                title="Encode tool"
                onLoad={() => {
                  if (pendingEncodeTextRef.current !== null) {
                    syncEncodeDraft(pendingEncodeTextRef.current);
                    pendingEncodeTextRef.current = null;
                  }
                  revealEncodeInput();
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <style jsx>{`
        .iframe-panel-shell {
          padding: 0; /* flush against chat shell */
          display: flex;
          align-items: stretch;
        }

        .iframe-panel {
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(24, 24, 27, 0.08);
          border-radius: 24px;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          min-height: 100%;
          height: 100%;
        }

        .panel-head h2 {
          margin: 0;
          font-size: 1rem;
        }

        .iframe-row {
          display: flex;
          flex-direction: column; /* stack iframes vertically */
          gap: 0.75rem;
          flex: 1 1 auto;
          min-height: 0;
        }

        .iframe-box {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 0 0 auto;
          min-height: 0;
        }

        .iframe-box h3 {
          margin: 0;
          font-size: 0.92rem;
        }

        .collapse-trigger {
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 10px;
          background: rgba(248, 250, 252, 0.95);
          color: #0f172a;
          font: inherit;
          padding: 0.4rem 0.55rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }

        .collapse-trigger span {
          font-size: 0.75rem;
          opacity: 0.78;
        }

        iframe {
          width: 100%;
          height: min(48vh, 480px);
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: white;
          min-height: 220px;
        }
      `}</style>
    </aside>
  );
}
