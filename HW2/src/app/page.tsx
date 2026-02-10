import { supabase } from "@/lib/supabase";

interface HumorTheme {
  id: number;
  created_datetime_utc: string;
  name: string;
  description: string | null;
}

async function getHumorThemes(): Promise<HumorTheme[]> {
  const { data, error } = await supabase
    .from("humor_themes")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching humor themes:", error);
    return [];
  }

  return data || [];
}

export default async function Home() {
  const themes = await getHumorThemes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <main className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">
            Humor Themes
          </h1>
          <p className="mt-4 text-xl text-white/80">
            Explore different humor themes from our database
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="rounded-xl bg-white/10 p-6 backdrop-blur-sm transition-transform hover:scale-105"
            >
              <h2 className="text-xl font-semibold text-white">{theme.name}</h2>
              {theme.description && (
                <p className="mt-2 text-white/70">{theme.description}</p>
              )}
              <p className="mt-4 text-sm text-white/50">
                Added: {new Date(theme.created_datetime_utc).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {themes.length === 0 && (
          <div className="text-center text-white/80">
            <p>No themes found. Check your Supabase connection.</p>
          </div>
        )}
      </main>
    </div>
  );
}
