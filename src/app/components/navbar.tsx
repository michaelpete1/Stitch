"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Plus,
  User as UserIcon,
  LogOut,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  X as CloseIcon,
  Compass,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  show: boolean;
  onClick?: () => void;
}

interface NavbarProps {
  onLogout: () => Promise<void>;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function Navbar({ onLogout, user }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const navLinks: NavLink[] = [
    {
      href: "/add-course",
      label: "Add Course",
      icon: <Plus size={20} />,
      show: !!user,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <UserIcon size={20} />,
      show: !!user,
    },
  ];

  const unauthLinks: NavLink[] = [
    {
      href: "/#how-it-works",
      label: "Explore",
      icon: <Compass size={20} />,
      show: !user,
    },
  ];

  const authLinks: NavLink[] = [
    {
      href: "#",
      label: "Logout",
      icon: <LogOut size={20} />,
      show: !!user,
      onClick: async () => {
        await onLogout();
        setOpen(false);
      },
    },
  ];

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email.split("@")[0]
    : "User";

  const userEmoji = "👤";

  return (
    <>
      <button
        type="button"
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 md:hidden bg-white rounded-full shadow-md focus:outline-none transition-transform duration-300 hover:scale-110 active:scale-95"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="primary-navigation"
        title={open ? "Close menu" : "Open menu"}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        {open ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
      </button>

      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        className={`fixed inset-0 border-0 p-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        id="primary-navigation"
        className={`fixed top-0 left-0 z-50 h-[100dvh] w-[min(18rem,88vw)] bg-gradient-to-b from-indigo-100 via-white to-blue-100 border-r flex flex-col py-6 px-4 shadow-xl transition-[transform,width] duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0 md:shadow-xl md:block ${collapsed ? "md:w-16" : "md:w-48 lg:w-56"} ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } rounded-r-2xl md:rounded-none`}
      >
        <div className={`flex items-center mb-8 animate-fade-in-down ${collapsed ? "md:justify-center" : "gap-3"}`}>
          <Link href="/" aria-label="Stitch home" className={collapsed ? "md:hidden" : "block"}>
            <Image src="/stitch-logo.png" alt="Stitch" width={140} height={51} priority className="h-[51px] w-[140px] object-contain" />
          </Link>
          <button
            type="button"
            className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-100 md:flex ${collapsed ? "md:mx-auto" : "md:ml-auto"}`}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
        </div>
        <hr className="mb-6 border-indigo-200 md:hidden" />
        {user && (
          <div className={`flex items-center mb-8 animate-fade-in-down ${collapsed ? "md:justify-center" : "gap-3"}`}>
            <span
              className="text-4xl select-none"
              role="img"
              aria-label="Profile Emoji"
            >
              {userEmoji}
            </span>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`min-w-0 truncate text-lg font-medium text-[#101418] hover:underline focus:outline-none transition-colors ${collapsed ? "md:hidden" : ""}`}
            >
              {displayName}
            </Link>
          </div>
        )}
        <nav className={`flex flex-col gap-2 mt-2 ${collapsed ? "md:items-center" : ""}`}>
          {[...navLinks, ...unauthLinks, ...authLinks]
            .filter((link) => link.show)
            .map((link) => {
              const isActive = link.href !== "#" && pathname === link.href;
              return link.onClick ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={link.onClick}
                  aria-label={collapsed ? link.label : undefined}
                  title={collapsed ? link.label : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-2 transition-all duration-200 font-medium focus:ring-2 focus:ring-indigo-300 shadow-sm ${collapsed ? "md:w-11 md:justify-center md:px-0" : "md:w-full"}
                    ${isActive ? "bg-indigo-200 text-indigo-900" : "hover:bg-indigo-100 text-[#101418]"}
                  `}
                >
                  {link.icon}
                  <span className={collapsed ? "md:hidden" : ""}>{link.label}</span>
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-label={collapsed ? link.label : undefined}
                  title={collapsed ? link.label : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-2 transition-all duration-200 font-medium focus:ring-2 focus:ring-indigo-300 shadow-sm ${collapsed ? "md:w-11 md:justify-center md:px-0" : "md:w-full"}
                    ${isActive ? "bg-indigo-200 text-indigo-900" : "hover:bg-indigo-100 text-[#101418]"}
                  `}
                >
                  {link.icon}
                  <span className={collapsed ? "md:hidden" : ""}>{link.label}</span>
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
