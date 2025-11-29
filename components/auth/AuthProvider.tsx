"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type User = {
  userId: Id<"users">;
  email: string;
};

type AuthResult = { error?: Error } | undefined;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signInMutation = useMutation(api.auth.signIn);
  const signUpMutation = useMutation(api.auth.signUp);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('convex_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('convex_user');
      }
    }
    setLoading(false);
  }, []);

  const signInWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signInMutation({ email, password });
      const user = { userId: result.userId, email: result.email };
      setUser(user);
      localStorage.setItem('convex_user', JSON.stringify(user));
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signUpMutation({ email, password });
      const user = { userId: result.userId, email: result.email };
      setUser(user);
      localStorage.setItem('convex_user', JSON.stringify(user));
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('convex_user');
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
