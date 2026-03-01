import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const API_BASE = "https://api.almostcrackd.ai";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = session.access_token;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const contentType = file.type;
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
  ];

  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${contentType}` },
      { status: 400 }
    );
  }

  try {
    // Step 1: Generate presigned URL
    const presignedRes = await fetch(
      `${API_BASE}/pipeline/generate-presigned-url`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentType }),
      }
    );

    if (!presignedRes.ok) {
      const err = await presignedRes.text();
      return NextResponse.json(
        { error: `Failed to get presigned URL: ${err}` },
        { status: presignedRes.status }
      );
    }

    const { presignedUrl, cdnUrl } = await presignedRes.json();

    // Step 2: Upload image bytes to presigned URL
    const fileBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json(
        { error: `Failed to upload image: ${err}` },
        { status: uploadRes.status }
      );
    }

    // Step 3: Register image URL in the pipeline
    const registerRes = await fetch(
      `${API_BASE}/pipeline/upload-image-from-url`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      }
    );

    if (!registerRes.ok) {
      const err = await registerRes.text();
      return NextResponse.json(
        { error: `Failed to register image: ${err}` },
        { status: registerRes.status }
      );
    }

    const { imageId } = await registerRes.json();

    // Step 4: Generate captions
    const captionsRes = await fetch(
      `${API_BASE}/pipeline/generate-captions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
      }
    );

    if (!captionsRes.ok) {
      const err = await captionsRes.text();
      return NextResponse.json(
        { error: `Failed to generate captions: ${err}` },
        { status: captionsRes.status }
      );
    }

    const captions = await captionsRes.json();

    return NextResponse.json({ captions, imageUrl: cdnUrl });
  } catch (err) {
    console.error("Caption pipeline error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
