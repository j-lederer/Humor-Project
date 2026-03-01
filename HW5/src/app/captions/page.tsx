import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CaptionCard from "@/components/CaptionCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface Caption {
  id: string;
  [key: string]: unknown;
}

interface VoteRow {
  caption_id: string;
  vote_value: number;
}

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(0, parseInt(pageParam ?? "0", 10) || 0);
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetch one page of captions
  const { data: captions, error: captionsError, count } = await supabase
    .from("captions")
    .select("*", { count: "exact" })
    .order("id")
    .range(from, to);

  if (captionsError) {
    console.error("Error fetching captions:", captionsError);
  }

  const captionList = (captions as Caption[] | null) ?? [];
  const captionIds = captionList.map((c) => c.id);

  // Fetch votes only for captions on this page (stays well under the 1000-row cap)
  const { data: allVotes } = captionIds.length
    ? await supabase
        .from("caption_votes")
        .select("caption_id, vote_value")
        .in("caption_id", captionIds)
    : { data: [] };

  // Fetch the current user's votes for this page (separate query so it's always accurate)
  const { data: myVoteRows } = captionIds.length
    ? await supabase
        .from("caption_votes")
        .select("caption_id, vote_value")
        .in("caption_id", captionIds)
        .eq("profile_id", user.id)
    : { data: [] };

  // Aggregate total counts
  const voteCounts: Record<string, { upvotes: number; downvotes: number }> = {};
  for (const row of (allVotes as VoteRow[] | null) ?? []) {
    if (!voteCounts[row.caption_id]) {
      voteCounts[row.caption_id] = { upvotes: 0, downvotes: 0 };
    }
    if (row.vote_value === 1) voteCounts[row.caption_id].upvotes++;
    else if (row.vote_value === -1) voteCounts[row.caption_id].downvotes++;
  }

  // Map the user's own votes
  const myVotes: Record<string, number> = {};
  for (const row of (myVoteRows as VoteRow[] | null) ?? []) {
    myVotes[row.caption_id] = row.vote_value;
  }

  const getCaptionText = (caption: Caption): string => {
    for (const key of ["caption_text", "caption", "text", "content", "body"]) {
      if (typeof caption[key] === "string") return caption[key] as string;
    }
    return `Caption #${caption.id}`;
  };

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

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
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-8">
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <Link
                href={page > 0 ? `/captions?page=${page - 1}` : "#"}
                className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
                  page === 0
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                ← Previous
              </Link>
              <span className="text-white/70 text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <Link
                href={
                  page < totalPages - 1 ? `/captions?page=${page + 1}` : "#"
                }
                className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
                  page >= totalPages - 1
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                Next →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
