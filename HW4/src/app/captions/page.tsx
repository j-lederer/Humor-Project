import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CaptionCard from "@/components/CaptionCard";

// Always fetch fresh data — never serve a cached version
export const dynamic = "force-dynamic";

interface Caption {
  id: string;
  [key: string]: unknown;
}

interface VoteRow {
  caption_id: string;
  vote_value: number;
  profile_id: string;
}

export default async function CaptionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch all captions
  const { data: captions, error: captionsError } = await supabase
    .from("captions")
    .select("*")
    .order("id");

  if (captionsError) {
    console.error("Error fetching captions:", captionsError);
  }

  // Fetch all votes to compute counts
  const { data: votes } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value, profile_id");

  // Aggregate vote counts and track the current user's votes
  const voteCounts: Record<string, { upvotes: number; downvotes: number }> = {};
  const myVotes: Record<string, number> = {}; // captionId -> 1 or -1

  for (const row of (votes as VoteRow[] | null) ?? []) {
    if (!voteCounts[row.caption_id]) {
      voteCounts[row.caption_id] = { upvotes: 0, downvotes: 0 };
    }
    if (row.vote_value === 1) {
      voteCounts[row.caption_id].upvotes++;
    } else if (row.vote_value === -1) {
      voteCounts[row.caption_id].downvotes++;
    }
    if (row.profile_id === user.id) {
      myVotes[row.caption_id] = row.vote_value;
    }
  }

  const getCaptionText = (caption: Caption): string => {
    for (const key of ["caption_text", "caption", "text", "content", "body"]) {
      if (typeof caption[key] === "string") return caption[key] as string;
    }
    return `Caption #${caption.id}`;
  };

  const captionList = (captions as Caption[] | null) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-fuchsia-600 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              Rate Captions
            </h1>
            <p className="mt-1 text-white/70">Signed in as {user.email}</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            Home
          </Link>
        </div>

        {captionList.length === 0 ? (
          <div className="text-center text-white/80 bg-white/10 rounded-xl p-12">
            <p className="text-xl">No captions found.</p>
            <p className="mt-2 text-white/60">
              Make sure the &quot;captions&quot; table exists in your Supabase
              project.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {captionList.map((caption) => {
              const counts = voteCounts[caption.id] ?? {
                upvotes: 0,
                downvotes: 0,
              };
              return (
                <CaptionCard
                  key={caption.id}
                  id={caption.id}
                  text={getCaptionText(caption)}
                  upvotes={counts.upvotes}
                  downvotes={counts.downvotes}
                  myVote={myVotes[caption.id] ?? null}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
