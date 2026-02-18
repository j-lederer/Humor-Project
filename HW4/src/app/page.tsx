"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { User } from "@supabase/supabase-js";

function HomeContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase.auth]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600">
      <main className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-12 shadow-xl">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-4">
          HW4: Caption Voting
        </h1>
        <p className="text-xl text-white/80 mb-8">
          Sign in to rate captions with upvotes and downvotes
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-lg text-red-100">
            Authentication failed. Please try again.
          </div>
        )}

        {user ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/20 border border-green-400 rounded-lg">
              <p className="text-green-100">
                Signed in as: <strong>{user.email}</strong>
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/captions")}
                className="px-6 py-3 bg-white text-violet-600 font-semibold rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
              >
                Rate Captions
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-white/70">
              Sign in with Google to rate captions
            </p>
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-3 mx-auto px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
