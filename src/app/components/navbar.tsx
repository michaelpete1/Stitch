"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { Plus, User as UserIcon, LogOut, Pencil, Menu as MenuIcon, X as CloseIcon } from 'lucide-react';
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
      }
    }
  ];

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    'https://randomuser.me/api/portraits/lego/1.jpg';

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-40 flex items-center justify-center w-10 h-10 md:hidden bg-white rounded-full shadow-md focus:outline-none"
        onClick={() => setOpen(v => !v)}
        title={open ? 'Close menu' : 'Open menu'}
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        {open ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r flex flex-col py-4 px-4 shadow-lg transition-transform duration-300 md:static md:translate-x-0 md:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {user && (
          <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
            <Image
              src={avatarUrl}
              alt={`${displayName} avatar`}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-lg font-medium text-[#101418] hover:underline focus:outline-none"
            >
              {displayName}
            </Link>
          </div>
        )}

        <nav className="flex flex-col gap-2 mt-2">
          {[...navLinks, ...unauthLinks, ...authLinks]
            .filter(link => link.show)
            .map(link =>
              link.onClick ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={link.onClick}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#f1f4f9] text-[#101418]"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#f1f4f9] text-[#101418]"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              )
            )}
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
