"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { Plus, User as UserIcon, LogOut, Pencil } from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // Use singleton client!

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch and listen to user auth state
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Main navigation links for authenticated users
  const navLinks = [
    {
      href: "/add-course",
      label: "Add Course",
      icon: <Plus size={20} className="text-[#101418]" />,
      show: !!user,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <UserIcon size={20} className="text-[#101418]" />,
      show: !!user,
    },
  ];

  // For users not authenticated
  const unauthLinks = [
    {
      href: "/signuppage",
      label: "Sign Up",
      icon: <Pencil size={20} className="text-[#101418]" />,
      show: !user,
    },
  ];

  // For authenticated users (logout only)
  const authLinks = [
    {
      href: "#",
      label: "Logout",
      icon: <LogOut size={20} className="text-[#101418]" />,
      onClick: async () => {
        await supabase.auth.signOut();
        setOpen(false);
      },
      show: !!user,
    },
  ];

  // Avatar: use user_metadata fields if present, fallback to email letter
  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "https://randomuser.me/api/portraits/lego/1.jpg";

  return (
    <>
      {/* Mobile menu button */}
      <button
        aria-label="Open menu"
        className="fixed top-4 left-4 z-40 flex flex-col justify-center items-center w-10 h-10 md:hidden bg-white rounded-full shadow-md transition-transform duration-300 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`block w-6 h-0.5 bg-[#101418] transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`}></span>
        <span className={`block w-6 h-0.5 bg-[#101418] my-1 transition-all duration-300 ${open ? "opacity-0" : ""}`}></span>
        <span className={`block w-6 h-0.5 bg-[#101418] transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`}></span>
      </button>

      {/* Overlay for mobile menu */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r flex flex-col py-4 px-4 shadow-lg
        transition-transform duration-300 md:static md:translate-x-0 md:shadow-none
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Avatar and username */}
        {user && (
          <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
            <span className="rounded-full bg-[#ffe5db] w-10 h-10 flex items-center justify-center overflow-hidden">
              <Image
                src={avatarUrl}
                alt={`${displayName}'s avatar`}
                width={40}
                height={40}
                className="rounded-full object-cover"
                priority
              />
            </span>
            <span className="text-lg font-medium text-[#101418]">{displayName}</span>
          </div>
        )}
        <nav className="flex flex-col gap-2 mt-2">
          {[...navLinks, ...unauthLinks, ...authLinks]
            .filter((l) => l.show)
            .map((link) =>
              link.label === "Logout" ? (
                <button
                  key={link.label}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-[#f1f4f9] text-[#101418] text-base text-left"
                  onClick={link.onClick}
                >
                  {link.icon}
                  <span className="text-base">{link.label}</span>
                </button>
              ) : (
                <Link
                  href={link.href}
                  key={link.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-[#f1f4f9] text-[#101418]"
                  onClick={() => setOpen(false)}
                >
                  {link.icon}
                  <span className="text-base">{link.label}</span>
                </Link>
              )
            )}
        </nav>
      </aside>
      {/* Fade in animation for avatar */}
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