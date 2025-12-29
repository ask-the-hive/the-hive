'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { getUserFacingErrorInfo } from '@/lib/user-facing-error';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const info = getUserFacingErrorInfo(error);
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#0a0a0a',
            color: '#ffffff',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>{info.title}</h1>
          <p style={{ color: '#cfcfcf', marginBottom: '10px', maxWidth: '560px', textAlign: 'center' }}>
            {info.message}
          </p>
          {isOffline && (
            <p style={{ color: '#888', marginBottom: '10px' }}>You appear to be offline.</p>
          )}
          <div style={{ color: '#888', marginBottom: '20px', maxWidth: '560px', textAlign: 'center' }}>
            {info.nextSteps.map((step, idx) => (
              <div key={idx}>{step}</div>
            ))}
            {error.digest ? <div style={{ marginTop: '10px' }}>Reference: {error.digest}</div> : null}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => reset?.()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
