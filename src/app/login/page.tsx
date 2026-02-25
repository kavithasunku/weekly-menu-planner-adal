"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ChefHat } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading("google");
    setError("");
    await signIn("google", { callbackUrl: "/planner" });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    setError("");
    const res = await signIn("resend", {
      email,
      redirect: false,
      callbackUrl: "/planner",
    });
    setLoading(null);
    if (res?.error) {
      setError("Something went wrong. Please try again.");
    } else {
      setEmailSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[#AF8F7C]/10 blur-[120px] -z-10" />
      <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#8C7362]/5 blur-[100px] -z-10" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-6">
            <div className="bg-[#AF8F7C]/10 p-2.5 rounded-xl group-hover:bg-[#AF8F7C]/20 transition-colors">
              <ChefHat size={26} className="text-[#AF8F7C]" />
            </div>
            <span className="text-[#3A332C] font-semibold text-xl tracking-wide font-serif">MenuMagic</span>
          </Link>
          <h1 className="text-3xl font-serif text-[#3A332C] mb-2">Welcome back</h1>
          <p className="text-[#7A7168] font-light">Sign in to access your personalized menus.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#EBE6DE] rounded-3xl p-8 shadow-xl shadow-[#AF8F7C]/5">
          {emailSent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[#AF8F7C]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AF8F7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <h2 className="text-xl font-serif text-[#3A332C] mb-2">Check your inbox</h2>
              <p className="text-[#7A7168] font-light text-sm leading-relaxed">
                We sent a magic link to <span className="font-medium text-[#3A332C]">{email}</span>. Click it to sign in — no password needed.
              </p>
              <button
                onClick={() => { setEmailSent(false); setEmail(""); }}
                className="mt-6 text-sm text-[#AF8F7C] hover:text-[#8C7362] transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-[#EBE6DE] hover:border-[#AF8F7C]/40 text-[#3A332C] px-5 py-3.5 rounded-2xl font-medium transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === "google" ? (
                  <svg className="animate-spin h-5 w-5 text-[#AF8F7C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[#EBE6DE]" />
                <span className="text-xs text-[#A69B91] font-light tracking-wider uppercase">or</span>
                <div className="flex-1 h-px bg-[#EBE6DE]" />
              </div>

              {/* Magic Link */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#3A332C] mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#FDFBF7] border border-[#EBE6DE] focus:border-[#AF8F7C] focus:ring-2 focus:ring-[#AF8F7C]/10 rounded-2xl px-4 py-3.5 text-[#3A332C] placeholder-[#C4BDB6] outline-none transition-all"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={!!loading || !email}
                  className="w-full bg-[#3A332C] text-white px-5 py-3.5 rounded-2xl font-medium hover:bg-[#1A1714] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === "email" ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : null}
                  Send Magic Link
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-[#A69B91] font-light">
          By signing in, you agree to our{" "}
          <Link href="#" className="text-[#AF8F7C] hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="#" className="text-[#AF8F7C] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
