// src/components/RedirectWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function RedirectWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return;
      
      if (!user) {
        await refreshUser();
      }
      
      const currentUser = user;
      
      if (!currentUser) {
        if (pathname !== '/signuppage') {
          router.replace('/signuppage');
        }
      } else if (currentUser && pathname === '/signuppage') {
        router.replace('/');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [user, authLoading, pathname, router, refreshUser]);

  if (loading || authLoading) return null;

  return <>{children}</>;
}