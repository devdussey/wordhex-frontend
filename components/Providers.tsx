"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <AuthProvider>{children}</AuthProvider>
    </ConvexClientProvider>
  );
}
