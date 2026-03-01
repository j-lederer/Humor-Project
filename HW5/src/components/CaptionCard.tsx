"use client";

import { useTransition, useState } from "react";
import { submitVote } from "@/app/actions";

interface CaptionCardProps {
  id: string;
  text: string;
  upvotes: number;
  downvotes: number;
  myVote: number | null; // 1, -1, or null if not yet voted
}

export default function CaptionCard({
  id,
  text,
  upvotes,
  downvotes,
  myVote: initialVote,
}: CaptionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [myVote, setMyVote] = useState<number | null>(initialVote);
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(downvotes);
  const [error, setError] = useState<string | null>(null);

  const handleVote = (vote: number) => {
    if (myVote !== null) return; // already voted
    setError(null);
    startTransition(async () => {
      const result = await submitVote(id, vote);
      if (result.error) {
        setError(result.error);
      } else {
        setMyVote(vote);
        if (vote === 1) setLocalUpvotes((n) => n + 1);
        else setLocalDownvotes((n) => n + 1);
      }
    });
  };

  const alreadyVoted = myVote !== null;

  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 flex flex-col gap-4">
      <p className="text-white text-lg leading-relaxed">{text}</p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => handleVote(1)}
          disabled={isPending || alreadyVoted}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-semibold transition-colors
            ${myVote === 1
              ? "bg-green-500/60 border-green-300 text-white"
              : alreadyVoted
              ? "bg-white/5 border-white/20 text-white/40 cursor-not-allowed"
              : "bg-green-500/30 hover:bg-green-500/50 border-green-400/50 text-green-100 cursor-pointer"
            } disabled:opacity-60`}
        >
          <span className="text-xl">👍</span>
          <span>{localUpvotes}</span>
        </button>

        <button
          onClick={() => handleVote(-1)}
          disabled={isPending || alreadyVoted}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-semibold transition-colors
            ${myVote === -1
              ? "bg-red-500/60 border-red-300 text-white"
              : alreadyVoted
              ? "bg-white/5 border-white/20 text-white/40 cursor-not-allowed"
              : "bg-red-500/30 hover:bg-red-500/50 border-red-400/50 text-red-100 cursor-pointer"
            } disabled:opacity-60`}
        >
          <span className="text-xl">👎</span>
          <span>{localDownvotes}</span>
        </button>

        {isPending && <span className="text-white/60 text-sm">Saving...</span>}
        {alreadyVoted && !isPending && (
          <span className="text-white/50 text-sm">
            You voted {myVote === 1 ? "👍" : "👎"}
          </span>
        )}
        {error && <span className="text-red-300 text-sm">{error}</span>}
      </div>
    </div>
  );
}
