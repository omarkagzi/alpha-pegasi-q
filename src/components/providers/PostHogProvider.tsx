'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
        // No events fire until user accepts cookies (Task 23 adds consent UI)
        opt_out_capturing_by_default: true,
      });

      const consent = localStorage.getItem('cookie-consent');
      if (consent === 'accepted') {
        posthog.opt_in_capturing();
      }

      // Persist UTM params as super properties for acquisition attribution
      const params = new URLSearchParams(window.location.search);
      const utmProps: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
        const val = params.get(key);
        if (val) utmProps[key] = val;
      });
      if (Object.keys(utmProps).length > 0) {
        posthog.register(utmProps);
      }
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
