import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
      <main className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-2xl">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-4">
          Protected Content
        </h1>

        <div className="bg-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Welcome, {user.user_metadata?.full_name || user.email}!
          </h2>

          <div className="text-left text-white/80 space-y-2">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Last Sign In:</strong>{" "}
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "N/A"}
            </p>
          </div>
        </div>

        <p className="text-white/70 mb-8">
          This page is only accessible to authenticated users. If you were not
          logged in, you would have been redirected to the home page.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
}
