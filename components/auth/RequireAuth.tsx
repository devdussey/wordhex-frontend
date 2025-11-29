"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import '@/styles/auth.css';

export default function RequireAuth({
  children,
  redirectTo = '/login',
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`${redirectTo}?next=${next}`);
    }
  }, [loading, user, router, pathname, redirectTo]);

  if (loading) {
    return (
      <div className="auth-loading">
        Checking session...
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
