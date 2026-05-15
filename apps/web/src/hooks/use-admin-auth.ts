'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminAccessToken, clearAdminTokens } from '@/lib/admin-auth';

interface UseAdminAuthReturn {
  token: string | null;
  mounted: boolean;
  logout: () => void;
}

export function useAdminAuth(redirectTo = '/admin/login'): UseAdminAuthReturn {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = getAdminAccessToken();
    setToken(t);
    setMounted(true);
    if (!t) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  function logout() {
    clearAdminTokens();
    router.replace(redirectTo);
  }

  return { token, mounted, logout };
}
