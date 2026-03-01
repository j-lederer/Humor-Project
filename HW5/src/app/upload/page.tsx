"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

interface CaptionRecord {
  id?: string;
  caption_text?: string;
  caption?: string;
  text?: string;
  content?: string;
  body?: string;
  [key: string]: unknown;
}

function getCaptionText(caption: CaptionRecord): string {
  for (const key of ["caption_text", "caption", "text", "content", "body"]) {
    if (typeof caption[key] === "string") return caption[key] as string;
  }
  return JSON.stringify(caption);
}

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionRecord[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase.auth, router]);

  const handleFile = (file: File) => {
    setError("");
    setCaptions([]);
    setUploadedImageUrl(null);

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, GIF, or HEIC.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError("");
    setStatus("Getting upload URL...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStatus("Uploading image and generating captions...");

      const res = await fetch("/api/generate-captions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate captions");
      }

      setUploadedImageUrl(data.imageUrl);
      setCaptions(Array.isArray(data.captions) ? data.captions : []);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
    setCaptions([]);
    setError("");
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-fuchsia-600 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              Upload Image
            </h1>
            <p className="mt-1 text-white/70">Signed in as {user?.email}</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            Home
          </Link>
        </div>

        {/* Upload area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-white bg-white/20"
              : "border-white/40 bg-white/10 hover:bg-white/15"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="text-white">
            <p className="text-2xl mb-2">
              {uploading ? status : "Drop an image here or click to upload"}
            </p>
            {!uploading && (
              <p className="text-white/60">
                Supports JPEG, PNG, WebP, GIF, HEIC
              </p>
            )}
            {uploading && (
              <div className="mt-4">
                <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-400 rounded-lg text-red-100">
            {error}
          </div>
        )}

        {/* Image preview and captions */}
        {imagePreview && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-white">Your Image</h2>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm cursor-pointer"
                >
                  Upload Another
                </button>
              </div>
              <img
                src={uploadedImageUrl || imagePreview}
                alt="Uploaded"
                className="max-w-full max-h-96 rounded-lg mx-auto"
              />
            </div>

            {captions.length > 0 && (
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Generated Captions
                </h2>
                <div className="space-y-3">
                  {captions.map((caption, i) => (
                    <div
                      key={caption.id || i}
                      className="rounded-lg bg-white/10 p-4 text-white text-lg"
                    >
                      {getCaptionText(caption)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
