'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import {
  Plus,
  User as UserIcon,
  LogOut,
  Pencil,
  Menu as MenuIcon,
  X as CloseIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  show: boolean;
  onClick?: () => void;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const navLinks: NavLink[] = [
    { href: '/add-course', label: 'Add Course', icon: <Plus size={20} />, show: !!user },
    { href: '/profile', label: 'Profile', icon: <UserIcon size={20} />, show: !!user }
  ];

  const unauthLinks: NavLink[] = [
    { href: '/signuppage', label: 'Sign Up', icon: <Pencil size={20} />, show: !user }
  ];

  const authLinks: NavLink[] = [
    {
      href: '#',
      label: 'Logout',
      icon: <LogOut size={20} />,
      show: !!user,
      onClick: async () => {
        await supabase.auth.signOut();
        setOpen(false);
        router.push('/signuppage');
      }
    }
  ];

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const userEmoji = user?.user_metadata?.emoji || '👤';

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 md:hidden bg-white rounded-full shadow-md focus:outline-none transition-transform duration-300 hover:scale-110 active:scale-95"
        onClick={() => setOpen(v => !v)}
        title={open ? 'Close menu' : 'Open menu'}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        {open ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
      </button>

      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-56 bg-gradient-to-b from-indigo-100 via-white to-blue-100 border-r flex flex-col py-6 px-4 shadow-xl transition-transform duration-500 ease-in-out md:static md:translate-x-0 md:shadow-xl md:block ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } rounded-r-2xl md:rounded-none`}
      >
        {/* Branding section */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
          <Image
            src="/vercel.svg"
            alt="App Logo"
            width={36}
            height={36}
            className="rounded-full object-cover border-2 border-indigo-200 shadow"
          />
          <span className="text-xl font-bold text-indigo-700 tracking-tight select-none">Stitch</span>
        </div>
        <hr className="mb-6 border-indigo-200" />
        {user && (
          <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
            <span className="text-4xl select-none" role="img" aria-label="Profile Emoji">{userEmoji}</span>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-lg font-medium text-[#101418] hover:underline focus:outline-none transition-colors"
            >
              {displayName}
            </Link>
          </div>
        )}
        <nav className="flex flex-col gap-2 mt-2">
          {[...navLinks, ...unauthLinks, ...authLinks]
            .filter(link => link.show)
            .map(link => {
              const isActive = link.href !== '#' && pathname === link.href;
              return link.onClick ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={link.onClick}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 font-medium focus:ring-2 focus:ring-indigo-300 shadow-sm
                    ${isActive ? 'bg-indigo-200 text-indigo-900' : 'hover:bg-indigo-100 text-[#101418]'}
                  `}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 font-medium focus:ring-2 focus:ring-indigo-300 shadow-sm
                    ${isActive ? 'bg-indigo-200 text-indigo-900' : 'hover:bg-indigo-100 text-[#101418]'}
                  `}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
        </nav>
      </aside>

      <style jsx global>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s both;
        }
      `}</style>
    </>
  );
}
