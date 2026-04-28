'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    if (typeof window !== 'undefined') posthog.opt_in_capturing();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 border-t border-gray-700 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-gray-300">
          We use cookies for authentication and analytics.{' '}
          <a href="/privacy" className="underline text-gray-100">Learn more</a>
        </p>
        <button
          onClick={accept}
          className="px-4 py-2 bg-white text-gray-900 rounded text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
