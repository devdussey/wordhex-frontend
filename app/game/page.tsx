"use client";

import RequireAuth from '@/components/auth/RequireAuth';
import GameClient from './GameClient';

export default function Page() {
  return (
    <RequireAuth redirectTo="/login">
      <GameClient />
    </RequireAuth>
  );
}
