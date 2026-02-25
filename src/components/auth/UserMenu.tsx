"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="w-10 h-10 rounded-full bg-[#AF8F7C]/10 animate-pulse border border-[#AF8F7C]/20" />
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Link
        href="/login"
        className="bg-[#3A332C] text-white px-7 py-2.5 rounded-full text-sm font-medium hover:bg-[#1A1714] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md shadow-[#3A332C]/20 border border-[#3A332C]"
      >
        Log In
      </Link>
    );
  }

  const name = session.user?.name || session.user?.email || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#AF8F7C] to-[#8C7362] text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-[#AF8F7C] focus:ring-offset-2"
        title={name}
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl shadow-[#3A332C]/10 border border-[#EBE6DE] overflow-hidden z-50 transform origin-top-right transition-all">
          <div className="px-4 py-3 border-b border-[#EBE6DE] bg-[#FDFBF7]">
            <p className="text-sm font-medium text-[#3A332C] truncate">{name}</p>
            <p className="text-xs text-[#7A7168] truncate">{session.user?.email}</p>
          </div>
          <div className="p-2">
            <Link
              href="/planner"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#3A332C] hover:bg-[#F5F2EB] rounded-xl transition-colors"
            >
              <User size={16} className="text-[#AF8F7C]" />
              My Plans
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
