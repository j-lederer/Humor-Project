"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitVote(captionId: string, vote: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to vote." };
  }

  const { error } = await supabase.from("caption_votes").insert({
    caption_id: captionId,
    profile_id: user.id,
    vote_value: vote,
    created_datetime_utc: new Date().toISOString(),
  });

  if (error) {
    console.error("Vote insert error:", error);
    return { error: error.message };
  }

  revalidatePath("/captions");
  return { success: true };
}
