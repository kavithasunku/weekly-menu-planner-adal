"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChefHat, Star, Sparkles, Trash2, Loader2, CalendarDays } from "lucide-react";

import { UserMenu } from "@/components/auth/UserMenu";

interface MenuSummary {
  id: string;
  name: string;
  isFavorite: boolean;
  isCurrent: boolean;
  createdAt: string;
  weekStartDate: string | null;
  weekEndDate: string | null;
}

export default function MenusPage() {
  const { status } = useSession();
  const router = useRouter();
  const [menus, setMenus] = useState<MenuSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/menus")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load menus");
        setMenus(await res.json());
      })
      .catch(() => setError("Couldn't load your saved menus. Please try again."));
  }, [status]);

  const setCurrent = async (id: string) => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/menus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true }),
      });
      if (res.ok) {
        setMenus((prev) => prev?.map((m) => ({ ...m, isCurrent: m.id === id })) ?? prev);
      }
    } finally {
      setPendingId(null);
    }
  };

  const toggleFavorite = async (id: string, next: boolean) => {
    setMenus((prev) => prev?.map((m) => (m.id === id ? { ...m, isFavorite: next } : m)) ?? prev);
    await fetch(`/api/menus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: next }),
    }).catch(() => {
      setMenus((prev) => prev?.map((m) => (m.id === id ? { ...m, isFavorite: !next } : m)) ?? prev);
    });
  };

  const deleteMenu = async (id: string) => {
    if (!confirm("Delete this menu? This can't be undone.")) return;
    setPendingId(id);
    try {
      const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMenus((prev) => prev?.filter((m) => m.id !== id) ?? prev);
      }
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#3A332C]">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FDFBF7]/80 border-b border-[#EBE6DE]/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-[#3A332C] font-bold text-xl tracking-tight font-serif">
            <ChefHat size={24} className="text-[#AF8F7C]" />
            <span>MenuMagic</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/planner" className="text-sm text-[#7A7168] hover:text-[#3A332C] transition-colors">
              + New Menu
            </Link>
            <UserMenu />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif text-[#3A332C] mb-1">My Menus</h1>
        <p className="text-[#7A7168] font-light mb-8">Your saved weekly menus. Set one as current to make it your active plan.</p>

        {status === "loading" && <p className="text-[#7A7168]">Loading…</p>}

        {status === "unauthenticated" && (
          <div className="rounded-2xl border border-[#EBE6DE] bg-white p-8 text-center">
            <p className="text-[#7A7168] mb-4">Sign in to see your saved menus.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#AF8F7C] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#9A7B68] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {status === "authenticated" && menus && menus.length === 0 && (
          <div className="rounded-2xl border border-[#EBE6DE] bg-white p-8 text-center">
            <p className="text-[#7A7168] mb-4">No saved menus yet.</p>
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 bg-[#AF8F7C] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#9A7B68] transition-colors"
            >
              <Sparkles size={16} /> Plan your first week
            </Link>
          </div>
        )}

        {status === "authenticated" && menus && menus.length > 0 && (
          <div className="space-y-3">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border bg-white transition-all ${
                  menu.isCurrent ? "border-[#AF8F7C] shadow-md shadow-[#AF8F7C]/10" : "border-[#EBE6DE]"
                }`}
              >
                <button
                  onClick={() => toggleFavorite(menu.id, !menu.isFavorite)}
                  className="flex-shrink-0 text-[#B8B0A4] hover:text-[#AF8F7C] transition-colors"
                  title={menu.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star size={18} className={menu.isFavorite ? "fill-[#AF8F7C] text-[#AF8F7C]" : ""} />
                </button>

                <button
                  onClick={() => router.push(`/planner?menuId=${menu.id}`)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#3A332C] truncate">{menu.name}</p>
                    {menu.isCurrent && (
                      <span className="flex-shrink-0 text-xs font-medium text-[#AF8F7C] bg-[#AF8F7C]/10 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A7168] flex items-center gap-1 mt-0.5">
                    <CalendarDays size={12} />
                    Saved {new Date(menu.createdAt).toLocaleDateString()}
                  </p>
                </button>

                {!menu.isCurrent && (
                  <button
                    onClick={() => setCurrent(menu.id)}
                    disabled={pendingId === menu.id}
                    className="flex-shrink-0 text-xs font-medium text-[#AF8F7C] border border-[#AF8F7C]/30 px-3 py-1.5 rounded-full hover:bg-[#AF8F7C]/10 transition-colors disabled:opacity-50"
                  >
                    {pendingId === menu.id ? <Loader2 size={14} className="animate-spin" /> : "Set as current"}
                  </button>
                )}

                <button
                  onClick={() => deleteMenu(menu.id)}
                  disabled={pendingId === menu.id}
                  className="flex-shrink-0 text-[#B8B0A4] hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Delete menu"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
