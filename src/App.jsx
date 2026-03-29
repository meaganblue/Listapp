import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─────────────────────────────────────────────
// CONSTANTS & THEMES
// ─────────────────────────────────────────────
const THEMES = {
  beautyandthebeast: {
    name: "Beauty and the Beast", emoji: "🌹",
    bg: "#FDF6E3", bgCard: "#FFF8ED", bgHeader: "#1B2A6B", bgInput: "#FFF8ED",
    border: "#C9A84C", borderLight: "#E8D48A",
    text: "#1B2A6B", textMid: "#3D4F8A", textMuted: "#8A7A3A", textFaint: "#C9A84C",
    accent: "#C9A84C", danger: "#8B1A1A",
    pillOn: "#1B2A6B", pillOnText: "#FDF6E3", pillOff: "#EDE4C0", pillOffText: "#3D4F8A",
    sectionBg: "#EDE4C0", sectionBorder: "#C9A84C",
    font: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    headerFont: "'Georgia', serif",
  },
  toystory: {
    name: "Toy Story", emoji: "🚀",
    bg: "#87CEEB", bgCard: "#FFFFFF", bgHeader: "#8B4513", bgInput: "#F0F8FF",
    border: "#1A5276", borderLight: "#A9CCE3",
    text: "#1A2F5A", textMid: "#1A5276", textMuted: "#2E86C1", textFaint: "#85C1E9",
    accent: "#C0392B", danger: "#7B241C",
    pillOn: "#C0392B", pillOnText: "#fff", pillOff: "#D6EAF8", pillOffText: "#1A5276",
    sectionBg: "#FFFF66", sectionBorder: "#1A5276",
    font: "'Trebuchet MS', 'Gill Sans', sans-serif",
    headerFont: "'Trebuchet MS', sans-serif",
  },
  gilmore: {
    name: "Gilmore Girls", emoji: "☕",
    bg: "#B8D8FF", bgCard: "#8ABEFF", bgHeader: "#003575", bgInput: "#F8FAFC",
    border: "#B0BEC5", borderLight: "#CFD8DC",
    text: "#1B2A4A", textMid: "#37474F", textMuted: "#78909C", textFaint: "#B0BEC5",
    accent: "#1B2A4A", danger: "#8B2020",
    pillOn: "#1B2A4A", pillOnText: "#F0F4F8", pillOff: "#E3E8EE", pillOffText: "#37474F",
    sectionBg: "#E8EDF2", sectionBorder: "#B0BEC5",
    font: "'Garamond', 'EB Garamond', Georgia, serif",
    headerFont: "'Garamond', Georgia, serif",
  },
  muppets: {
    name: "The Muppet Show", emoji: "🎭",
    bg: "#A2022C", bgCard: "#DA254F", bgHeader: "#558218", bgInput: "#80A837",
    border: "#C62828", borderLight: "#EF9A9A",
    text: "#1B0000", textMid: "#4A0000", textMuted: "#871C1C", textFaint: "#164117",
    accent: "#C62828", danger: "#7B0000",
    pillOn: "#2E7D32", pillOnText: "#164117", pillOff: "#F5F0E0", pillOffText: "#2E7D32",
    sectionBg: "#E8F5E9", sectionBorder: "#2E7D32",
    font: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    headerFont: "'Georgia', serif",
  },
  agatha: {
    name: "Agatha All Along", emoji: "🔮",
    bg: "#B6D3B8", bgCard: "#D2E4D4", bgHeader: "#381D58", bgInput: "#C2B0E5",
    border: "#472B78", borderLight: "#C5B3E6",
    text: "#1A0A2E", textMid: "#3B1F5E", textMuted: "#7E57C2", textFaint: "#C5B3E6",
    accent: "#5B8A5F", danger: "#8B1A1A",
    pillOn: "#3B1F5E", pillOnText: "#F3F0F8", pillOff: "#EDE8F8", pillOffText: "#3B1F5E",
    sectionBg: "#C2B0E5", sectionBorder: "#63349D",
    font: "'Garamond', 'EB Garamond', Georgia, serif",
    headerFont: "'Garamond', Georgia, serif",
  },
};

const WATCH_SECTIONS = {
  Movies:        { icon: "🎬", genres: ["Horror","Comedy","Rom-Com","Action","Drama","Sci-Fi","Thriller","Fantasy","Family","Animation","Documentary","Other"] },
  Shows:         { icon: "📺", genres: ["Horror","Comedy","Drama","Sci-Fi","Thriller","Fantasy","Action","Reality","Anime","Family","Documentary","Other"] },
  "Mini-series": { icon: "🎞️", genres: ["Horror","Comedy","Drama","Thriller","Documentary","True Crime","Other"] },
  Documentaries: { icon: "🎙️", genres: ["True Crime","Nature","History","Social","Music","Sports","Other"] },
  Anime:         { icon: "✨", genres: ["Action","Fantasy","Sci-Fi","Romance","Horror","Comedy","Slice of Life","Other"] },
};

const READ_SECTIONS = {
  Fiction:                   { icon: "📖", genres: ["Romance","Mystery","Horror","Thriller","Sci-Fi","Fantasy","Historical","Literary","Other"] },
  "Non-fiction":             { icon: "📰", genres: ["True Crime","History","Biography","Self-Help","Science","Social","Essays","Other"] },
  "Short Stories / Novella": { icon: "📜", genres: ["Horror","Fantasy","Sci-Fi","Literary","Other"] },
  Poetry:                    { icon: "🌸", genres: ["Classic","Contemporary","Spoken Word","Other"] },
  "Graphic Novel":           { icon: "🎨", genres: ["Superhero","Horror","Fantasy","Sci-Fi","Literary","Other"] },
  Reference:                 { icon: "📚", genres: ["Craft","Language","Science","Other"] },
  Cooking:                   { icon: "🍳", genres: ["Baking","Savoury","Preservation","Foraging","Other"] },
};

const AVATAR_EMOJIS = ["🦊","🐺","🌙","🌿","🐙","🦋","🔮","🌊","🎭","🚀","☕","🎸"];
const RATING_LABELS = ["","Hated it","Didn't like it","It was okay","Liked it","Loved it"];
const RATING_EMOJIS_MAP = ["","😤","😕","😐","🙂","😍"];

// ─────────────────────────────────────────────
// HELPERS (DB, AI, Export)
// ─────────────────────────────────────────────
async function dbGetProfiles(accountId) {
  const { data } = await supabase.from("users").select("*").eq("account_id", accountId).order("created_at");
  return data || [];
}
async function dbSaveProfile(profile, accountId) {
  await supabase.from("users").upsert({ ...profile, account_id: accountId });
}
async function dbDeleteProfile(id) {
  await supabase.from("users").delete().eq("id", id);
}
async function dbGetItems(userId, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  const { data } = await supabase.from(table).select("*").eq("user_id", userId).order("added", { ascending: false });
  return (data || []).map(row => ({
    id: row.id, title: row.title, section: row.section,
    genre: row.genre, genres: row.genres || [],
    notes: row.notes, status: row.status, added: row.added,
    desc: row.description, rating: row.rating, _listType: listType,
    author: row.author || "",
  }));
}
async function dbAddItem(userId, item, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).insert({
    id: item.id, user_id: userId, title: item.title,
    section: item.section, genre: item.genre, genres: item.genres || [],
    notes: item.notes || "", status: item.status, added: item.added,
    description: item.desc || "", rating: item.rating || 0, list_type: listType,
    author: item.author || "",
  });
}
async function dbUpdateItem(userId, item, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).update({
    status: item.status, rating: item.rating,
    description: item.desc || "", notes: item.notes || "",
    section: item.section, genre: item.genre, genres: item.genres || [],
    author: item.author || "",
  }).eq("id", item.id).eq("user_id", userId);
}
async function dbDeleteItem(userId, itemId, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).delete().eq("id", itemId).eq("user_id", userId);
}

async function callClaude(prompt, maxTokens = 100) {
  const resp = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await resp.json();
  return data?.content?.[0]?.text?.trim() || "";
}

async function autoDetectGenre(title, listType) {
  const sections = listType === "watch" ? Object.keys(WATCH_SECTIONS) : Object.keys(READ_SECTIONS);
  const allGenres = listType === "watch"
    ? [...new Set(Object.values(WATCH_SECTIONS).flatMap(s => s.genres))]
    : [...new Set(Object.values(READ_SECTIONS).flatMap(s => s.genres))];
  const prompt = `For the ${listType === "watch" ? "film/show/documentary" : "book"} titled "${title}", return ONLY a JSON object with these exact keys:
- "section": one of [${sections.map(s => `"${s}"`).join(", ")}]
- "genres": array of 1-3 most fitting genres from [${allGenres.map(g => `"${g}"`).join(", ")}]
- "desc": one sentence description (max 20 words)
Return only the JSON, no other text.`;
  try {
    const raw = await callClaude(prompt, 150);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      section: parsed.section || sections[0],
      genres: Array.isArray(parsed.genres) ? parsed.genres.slice(0, 3) : [parsed.genres || "Other"],
      desc: parsed.desc || "",
    };
  } catch {
    return { section: sections[0], genres: ["Other"], desc: "" };
  }
}

async function fetchTitleSuggestions(query, listType) {
  if (!query || query.length < 2) return [];
  const typeHint = listType === "watch" ? "films, TV shows, and documentaries" : "books";
  const prompt = `List 6 real ${typeHint} whose titles start with or closely match "${query}". Return ONLY a JSON array of objects with keys "title" and "year". Example: [{"title":"The Matrix","year":"1999"}]. No other text.`;
  try {
    const raw = await callClaude(prompt, 200);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch { return []; }
}

async function generateSuggestions(watchItems, readItems) {
  const rated = [...watchItems, ...readItems].filter(i => i.rating >= 4);
  if (rated.length === 0) return "Rate items 4–5 ★ after watching or reading to unlock personalised suggestions.";
  const liked = rated.map(i => `"${i.title}"`).slice(0, 10).join(", ");
  try {
    return await callClaude(`User loved: ${liked}. Suggest 5 films/shows AND 3 books they'd enjoy. For each: title + one sentence why. Be specific.`, 600);
  } catch { return "Could not reach suggestions service."; }
}

function downloadCSV(items, listType, profileName) {
  const headers = listType === "read"
    ? ["Title","Author","Section","Genres","Status","Rating","Notes"]
    : ["Title","Section","Genres","Status","Rating","Notes"];
  const rows = items.map(i => {
    const genres = (i.genres?.length ? i.genres : i.genre ? [i.genre] : []).join("; ");
    const rating = i.rating > 0 ? `${i.rating}/5` : "";
    if (listType === "read") return [i.title, i.author || "", i.section, genres, i.status, rating, i.notes || ""];
    return [i.title, i.section, genres, i.status, rating, i.notes || ""];
  });
  const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${profileName}-${listType}-list.csv`; a.click();
  URL.revokeObjectURL(url);
}

function downloadTXT(items, listType, profileName) {
  const lines = [`${profileName}'s ${listType === "watch" ? "Watch" : "Read"} List`, "=".repeat(40), ""];
  const bySection = {};
  items.forEach(i => { if (!bySection[i.section]) bySection[i.section] = []; bySection[i.section].push(i); });
  Object.entries(bySection).forEach(([section, sItems]) => {
    lines.push(`── ${section} ──`);
    sItems.forEach(i => {
      const rating = i.rating > 0 ? ` [${"★".repeat(i.rating)}]` : "";
      const author = listType === "read" && i.author ? ` by ${i.author}` : "";
      const genres = (i.genres?.length ? i.genres : i.genre ? [i.genre] : []).join(", ");
      lines.push(`  ${i.title}${author}${rating}`);
      if (genres) lines.push(`    genres: ${genres}`);
      if (i.status !== "unwatched" && i.status !== "unread") lines.push(`    status: ${i.status}`);
      if (i.notes) lines.push(`    notes: ${i.notes}`);
    });
    lines.push("");
  });
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${profileName}-${listType}-list.txt`; a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// UI COMPONENTS (Modals, Rows, etc.)
// ─────────────────────────────────────────────
function ManualModal({ onClose }) {
  const sections = [
    { title: "Getting Started", content: "Create an account with a username and password — no email needed. Once in, create up to 4 profiles (great for households or different moods). Each profile has its own separate watch and read lists." },
    { title: "Adding Titles", content: "Tap '+ Add title' or '+ Add book'. Start typing and the app will suggest matching titles. Select one or type your own. The AI will automatically detect the section (Movies, Shows, Fiction, etc.) and genre tags. You can always edit these after." },
    { title: "Tracking Progress", content: "Each entry has a status dot on the left. Tap it to cycle through: To Watch → Watching → Watched (or To Read → Reading → Read). Items in progress appear in the Watching/Reading tab. Finished items move to the Watched/Read tab." },
    { title: "Ratings", content: "Once something is marked as Watched or Read, a Rate button appears. Tap it to give a score from 1 (Hated it) to 5 (Loved it). Ratings power the personalised suggestions in the ✨ For You tab." },
    { title: "Editing Entries", content: "Tap the ✎ pencil icon on any entry to edit its section, genre tags (up to 3), notes, and author (for books). Changes save instantly." },
    { title: "Descriptions", content: "Tap any title to expand it and see a short AI-generated description. This fetches automatically the first time you expand an entry." },
    { title: "Suggestions", content: "Head to the ✨ For You tab and tap Generate Suggestions. The AI looks at everything you've rated 4–5 stars and recommends films, shows, and books you might love. Rate more items for better results." },
    { title: "Exporting Your List", content: "Tap the ⬇ Export button at the top of any list to download it as a CSV (opens in Excel or Google Sheets) or a plain text file." },
    { title: "Themes", content: "Each profile can have its own colour theme. From the profile selection screen, tap 🎨 under any profile to choose from Beauty and the Beast, Toy Story, Gilmore Girls, The Muppet Show, or Agatha All Along." },
    { title: "Switching Profiles", content: "Tap the ⇄ Switch button in the top right while using the app to jump between profiles or manage them. You can also log out from there." },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col font-serif">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <div className="text-[#E0D4FF] text-lg font-bold">✦ How to use Lists</div>
            <div className="text-[#8888BB] text-[11px] mt-1">Your complete guide</div>
          </div>
          <button onClick={onClose} className="text-[#8888BB] text-2xl cursor-pointer hover:text-white transition-colors">×</button>
        </div>
        <div className="overflow-y-auto p-5 pb-8 space-y-6">
          {sections.map((s, i) => (
            <div key={i}>
              <div className="text-[#C9B8FF] text-[11px] font-bold uppercase tracking-widest mb-2">{s.title}</div>
              <div className="text-[#B0A0CC] text-sm leading-relaxed">{s.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showManual, setShowManual] = useState(false);
  const fakeEmail = (u) => `${u.toLowerCase().replace(/[^a-z0-9]/g, "")}@lists.app`;

  const handle = async () => {
    if (!username.trim() || !password.trim()) { setError("Please fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    const email = fakeEmail(username.trim());
    if (mode === "signup") {
      const { data: existing } = await supabase.from("accounts").select("id").eq("username", username.trim().toLowerCase()).maybeSingle();
      if (existing) { setError("That username is already taken."); setLoading(false); return; }
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      await supabase.from("accounts").insert({ id: data.user.id, username: username.trim().toLowerCase() });
      onAuth(data.user);
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError("Invalid username or password."); setLoading(false); return; }
      onAuth(data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col items-center justify-center p-8 font-serif text-center">
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
      <div className="text-[#E0D4FF] text-4xl mb-2 tracking-widest">✦ Lists</div>
      <div className="max-w-xs mb-8">
        <div className="text-[#9988CC] text-[13px] leading-relaxed">
          Your personal watch list and reading tracker. Track films, shows, and books — all in one place.
        </div>
        <button onClick={() => setShowManual(true)} className="text-[#6677BB] text-xs underline mt-2">
          How does it work? →
        </button>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
          className="w-full bg-white/10 border border-white/20 rounded-lg text-[#E0D4FF] p-3 outline-none focus:border-white/40 transition-all" autoCapitalize="none" autoCorrect="off" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
          className="w-full bg-white/10 border border-white/20 rounded-lg text-[#E0D4FF] p-3 outline-none focus:border-white/40 transition-all" />
        {error && <div className="text-red-400 text-xs">{error}</div>}
        <button onClick={handle} disabled={loading} className="w-full bg-[#5A3EA6] text-white p-3 rounded-lg font-bold hover:bg-[#6a4fb6] transition-colors disabled:opacity-50">
          {loading ? "…" : mode === "login" ? "Log In" : "Create Account"}
        </button>
        <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); }}
          className="text-[#8888BB] text-sm underline mt-4 block mx-auto">
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, theme: T }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-125 focus:scale-125"
          style={{ color: n <= (hovered || value) ? T.accent : T.borderLight }}
        >★</button>
      ))}
      {(hovered || value) > 0 && (
        <span className="text-[11px] opacity-70 ml-2" style={{ color: T.textMuted }}>
          {RATING_EMOJIS_MAP[hovered || value]} {RATING_LABELS[hovered || value]}
        </span>
      )}
    </div>
  );
}

function RatingModal({ item, onRate, onClose, theme: T }) {
  const [rating, setRating] = useState(item.rating || 0);
  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
      <div className="p-6 max-w-xs w-full rounded-2xl shadow-2xl" style={{ background: T.bgCard, border: `1px solid ${T.border}`, fontFamily: T.font }}>
        <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1" style={{ color: T.textMuted }}>Rate this</div>
        <div className="text-lg mb-6 leading-tight" style={{ color: T.text, fontFamily: T.headerFont }}>{item.title}</div>
        <StarRating value={rating} onChange={setRating} theme={T} />
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-xs opacity-70" style={{ color: T.textMuted }}>Cancel</button>
          <button onClick={() => { onRate(rating); onClose(); }} className="px-5 py-2 text-xs font-bold rounded-lg text-white" style={{ background: T.accent }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ item, sections, onSave, onClose, theme: T, listType }) {
  const sectionKeys = Object.keys(sections);
  const [section, setSection] = useState(item.section || sectionKeys[0]);
  const [selectedGenres, setSelectedGenres] = useState(item.genres?.length ? item.genres : item.genre ? [item.genre] : ["Other"]);
  const [notes, setNotes] = useState(item.notes || "");
  const [author, setAuthor] = useState(item.author || "");
  const availableGenres = sections[section]?.genres || ["Other"];
  const toggleGenre = (g) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 3 ? [...prev, g] : prev);
  };
  return (
    <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="p-6 max-w-sm w-full rounded-2xl shadow-2xl" style={{ background: T.bgCard, border: `1px solid ${T.border}`, fontFamily: T.font }}>
        <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1" style={{ color: T.textMuted }}>Edit entry</div>
        <div className="text-lg mb-6 leading-tight" style={{ color: T.text, fontFamily: T.headerFont }}>{item.title}</div>
        
        <div className="space-y-4">
          {listType === "read" && (
            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1" style={{ color: T.textMuted }}>Author</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-2 rounded-lg border text-sm"
                style={{ background: T.bgInput, borderColor: T.border, color: T.text }} />
            </div>
          )}
          <div>
            <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1" style={{ color: T.textMuted }}>Section</label>
            <select value={section} onChange={e => { setSection(e.target.value); setSelectedGenres(["Other"]); }} className="w-full p-2 rounded-lg border text-sm"
              style={{ background: T.bgInput, borderColor: T.border, color: T.text }}>
              {sectionKeys.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-2" style={{ color: T.textMuted }}>Genres (max 3)</label>
            <div className="flex flex-wrap gap-1.5">
              {availableGenres.map(g => (
                <button key={g} onClick={() => toggleGenre(g)} className="px-3 py-1 rounded-full text-[11px] transition-all"
                  style={{
                    background: selectedGenres.includes(g) ? T.accent : T.sectionBg,
                    border: `1px solid ${T.border}`,
                    color: selectedGenres.includes(g) ? "#fff" : T.textMid
                  }}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1" style={{ color: T.textMuted }}>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 rounded-lg border text-sm"
              style={{ background: T.bgInput, borderColor: T.border, color: T.text }} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-xs opacity-70" style={{ color: T.textMuted }}>Cancel</button>
          <button onClick={() => { onSave({ section, genres: selectedGenres, genre: selectedGenres[0], notes, author }); onClose(); }}
            className="px-5 py-2 text-xs font-bold rounded-lg text-white" style={{ background: T.accent }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, onCycle, onRemove, onRateRequest, onEdit, onDescUpdate, theme: T, isArchive }) {
  const [expanded, setExpanded] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [desc, setDesc] = useState(item.desc || "");

  const handleExpand = async () => {
    setExpanded(e => !e);
    if (!desc && !expanded) {
      setLoadingDesc(true);
      try {
        const result = await callClaude(`One sentence description (max 20 words) of "${item.title}". Return only the sentence, no quotes.`, 80);
        setDesc(result);
        onDescUpdate(item.id, result);
      } catch {}
      setLoadingDesc(false);
    }
  };

  const done = item.status === "watched" || item.status === "read";
  const wip  = item.status === "watching" || item.status === "reading";
  const genreList = item.genres?.length ? item.genres : item.genre ? [item.genre] : [];

  return (
    <div className="mb-1 rounded-xl overflow-hidden transition-all shadow-sm border"
      style={{ background: T.bgCard, borderColor: done ? T.borderLight : T.border, opacity: done ? 0.7 : 1 }}>
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => !isArchive && onCycle(item.id)}
          className="w-5 h-5 rounded-full border-none flex items-center justify-center text-[8px] text-white font-bold transition-transform hover:scale-110 active:scale-95"
          style={{ background: done ? T.accent : wip ? T.textMid : T.borderLight }}
        >{done ? "✓" : wip ? "▶" : ""}</button>

        <button onClick={handleExpand} className="flex-1 text-left min-w-0">
          <div className={`text-[14px] truncate font-medium ${done ? 'line-through opacity-60' : ''}`} style={{ color: T.text }}>
            {item.title}
          </div>
          {item.author && <div className="text-[10px] italic opacity-70" style={{ color: T.textMuted }}>by {item.author}</div>}
          <div className="flex flex-wrap gap-1 mt-1">
            {genreList.map(g => (
              <span key={g} className="px-2 py-[1px] text-[9px] rounded-full border border-current opacity-70"
                style={{ background: T.sectionBg, color: T.textMuted }}>{g}</span>
            ))}
          </div>
        </button>

        <div className="flex items-center gap-3 shrink-0">
          {done && item.rating > 0 && <span className="text-[10px] tracking-widest" style={{ color: T.accent }}>{"★".repeat(item.rating)}</span>}
          {done && item.rating === 0 && (
            <button onClick={() => onRateRequest(item)} className="px-2 py-0.5 text-[9px] border rounded transition-opacity hover:opacity-100 opacity-60" style={{ color: T.textMuted, borderColor: T.borderLight }}>Rate</button>
          )}
          <button onClick={() => onEdit(item)} className="text-xs opacity-40 hover:opacity-100 hover:scale-110 transition-all" style={{ color: T.textFaint }}>✎</button>
          <button onClick={() => onRemove(item.id)} className="text-lg leading-none opacity-40 hover:opacity-100 hover:text-red-500 transition-all" style={{ color: T.borderLight }}>×</button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t transition-all animate-in slide-in-from-top-1" style={{ borderColor: T.borderLight }}>
          {item.notes && <div className="text-[11px] italic opacity-70 mb-2" style={{ color: T.textMuted }}>{item.notes}</div>}
          <div className="text-xs leading-relaxed" style={{ color: T.textMid }}>
            {loadingDesc ? "✨ Thinking..." : desc || "No description available."}
          </div>
        </div>
      )}
    </div>
  );
}

function GenreSection({ genre, items, onCycle, onRemove, onRateRequest, onEdit, onDescUpdate, theme: T }) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 mb-1.5 px-1 py-1 group">
        <span className="text-[9px] uppercase tracking-widest font-bold opacity-60" style={{ color: T.textMuted }}>{genre}</span>
        <div className="flex-1 h-px opacity-20" style={{ background: T.borderLight }} />
        <span className="text-[9px] opacity-40 group-hover:opacity-100">{items.length} {open ? "▲" : "▼"}</span>
      </button>
      {open && items.map(item => (
        <ItemRow key={item.id} item={item} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} onDescUpdate={onDescUpdate} theme={T} isArchive={false} />
      ))}
    </div>
  );
}

function MainSection({ sectionKey, sectionDef, items, onCycle, onRemove, onRateRequest, onEdit, onDescUpdate, theme: T, search, listType }) {
  const [open, setOpen] = useState(true);
  const todoStatus = listType === "read" ? "unread" : "unwatched";
  const filtered = items.filter(i =>
    i.section === sectionKey && i.status === todoStatus &&
    (i.title.toLowerCase().includes(search.toLowerCase()) ||
     (i.author && i.author.toLowerCase().includes(search.toLowerCase())))
  );
  if (filtered.length === 0) return null;

  const byGenre = {};
  sectionDef.genres.forEach(g => { byGenre[g] = []; });
  filtered.forEach(i => {
    const itemGenres = i.genres?.length ? i.genres : i.genre ? [i.genre] : ["Other"];
    const primaryGenre = itemGenres[0] || "Other";
    if (!byGenre[primaryGenre]) byGenre[primaryGenre] = [];
    byGenre[primaryGenre].push(i);
  });

  return (
    <div className="mb-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.99] shadow-sm mb-2"
        style={{ background: T.sectionBg, borderColor: T.sectionBorder }}>
        <span className="text-lg">{sectionDef.icon}</span>
        <span className="text-[15px] font-bold" style={{ color: T.text, fontFamily: T.headerFont }}>{sectionKey}</span>
        <span className="text-xs opacity-60">({filtered.length})</span>
        <span className="ml-auto text-[10px] opacity-50">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="pl-3 animate-in fade-in slide-in-from-left-2">
          {sectionDef.genres.map(g => (
            <GenreSection key={g} genre={g} items={byGenre[g] || []} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} onDescUpdate={onDescUpdate} theme={T} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveSection({ items, onCycle, onRateRequest, onRemove, onEdit, onDescUpdate, theme: T, title, emptyMsg, canCycle }) {
  if (items.length === 0) return <div className="py-12 text-center text-sm opacity-40">{emptyMsg}</div>;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-4 ml-1" style={{ color: T.textMuted }}>{title} — {items.length}</div>
      {items.map(item => (
        <ItemRow key={item.id} item={item} onCycle={canCycle ? onCycle : () => {}} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} onDescUpdate={onDescUpdate} theme={T} isArchive={!canCycle} />
      ))}
    </div>
  );
}

function AddForm({ sections, onAdd, onClose, theme: T, listType }) {
  const [title, setTitle]             = useState("");
  const [author, setAuthor]           = useState("");
  const [detecting, setDetecting]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg]       = useState(false);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [syncToOther, setSyncToOther] = useState(false);
  
  const inputRef = useRef(null);
  const suggTimer = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleTitleChange = (val) => {
    setTitle(val);
    setShowSugg(true);
    clearTimeout(suggTimer.current);
    if (val.length < 2) { setSuggestions([]); return; }
    setLoadingSugg(true);
    suggTimer.current = setTimeout(async () => {
      const results = await fetchTitleSuggestions(val, listType);
      setSuggestions(results);
      setLoadingSugg(false);
    }, 600);
  };

  const selectSuggestion = (s) => {
    setTitle(s.title);
    setShowSugg(false);
    setSuggestions([]);
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    setDetecting(true);
    const detected = await autoDetectGenre(title.trim(), listType);
    setDetecting(false);
    onAdd({ title: title.trim(), author: author.trim(), ...detected }, syncToOther);
  };

  return (
    <div className="p-4 mb-6 rounded-2xl shadow-xl border animate-in zoom-in-95" style={{ background: T.bgCard, borderColor: T.border }}>
      <div className="relative mb-3">
        <input ref={inputRef} value={title} onChange={e => handleTitleChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && title.trim()) handleAdd(); if (e.key === "Escape") onClose(); }}
          onBlur={() => setTimeout(() => setShowSugg(false), 200)}
          placeholder="Title… (type to search)"
          className="w-full bg-transparent border-b p-2 text-lg outline-none"
          style={{ borderColor: T.border, color: T.text, fontFamily: T.font }}
        />
        {showSugg && (suggestions.length > 0 || loadingSugg) && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 border overflow-hidden animate-in fade-in slide-in-from-top-2"
            style={{ background: T.bgCard, borderColor: T.border }}>
            {loadingSugg && <div className="p-3 text-xs opacity-50">Searching…</div>}
            {suggestions.map((s, i) => (
              <button key={i} onMouseDown={() => selectSuggestion(s)} className="w-full flex items-center justify-between p-3 text-left border-b last:border-0 hover:bg-black/5"
                style={{ borderColor: T.borderLight }}>
                <span className="text-sm font-medium" style={{ color: T.text }}>{s.title}</span>
                {s.year && <span className="text-[10px] opacity-50">{s.year}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {listType === "read" && (
        <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author (optional)"
          className="w-full bg-transparent border-b p-2 text-sm italic outline-none mb-4"
          style={{ borderColor: T.borderLight, color: T.textMid }}
        />
      )}
      
      <div className="flex items-center gap-2 mb-4">
         <label className="flex items-center gap-2 cursor-pointer text-[11px] opacity-70">
           <input type="checkbox" checked={syncToOther} onChange={e => setSyncToOther(e.target.checked)}
             className="cursor-pointer" style={{ accentColor: T.accent }} />
           Also add to {listType === "watch" ? "Reading List" : "Movie List"}?
         </label>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[10px] italic opacity-60">{detecting ? "✨ AI is categorizing..." : ""}</div>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-xs opacity-70">Cancel</button>
          <button onClick={handleAdd} disabled={detecting || !title.trim()}
            className="px-5 py-1.5 text-xs font-bold rounded-lg text-white shadow-md active:scale-95 transition-all"
            style={{ background: T.accent, opacity: detecting ? 0.7 : 1 }}>{detecting ? "…" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}

function SuggestionsPage({ userId, theme: T }) {
  const [watchItems, setWatchItems] = useState([]);
  const [readItems, setReadItems]   = useState([]);
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading]       = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    Promise.all([dbGetItems(userId, "watch"), dbGetItems(userId, "read")]).then(([w, r]) => {
      setWatchItems(w); setReadItems(r); setDataLoaded(true);
    });
  }, [userId]);

  const ratedCount = [...watchItems, ...readItems].filter(i => i.rating >= 4).length;

  const load = async () => {
    setLoading(true);
    const s = await generateSuggestions(watchItems, readItems);
    setSuggestions(s);
    setLoading(false);
  };

  if (!dataLoaded) return <div className="text-center py-12 opacity-50">Loading…</div>;

  return (
    <div className="animate-in fade-in zoom-in-95">
      <div className="text-sm opacity-70 mb-6 leading-relaxed">
        {ratedCount === 0 ? "Rate items 4–5 ★ to unlock personalised suggestions." : `Tailored for you based on ${ratedCount} high-rated items.`}
      </div>
      <button onClick={load} disabled={loading || ratedCount === 0}
        className="w-full py-4 rounded-2xl font-bold text-white shadow-lg active:scale-[0.98] transition-all mb-8 disabled:opacity-40"
        style={{ background: ratedCount === 0 ? T.sectionBg : T.accent, color: ratedCount === 0 ? T.textFaint : "#fff" }}>
        {loading ? "✨ Dreaming up ideas..." : "✨ Generate Suggestions"}
      </button>
      {suggestions && (
        <div className="p-6 rounded-2xl border leading-relaxed shadow-inner" style={{ background: T.sectionBg, borderColor: T.sectionBorder }}>
          <pre className="whitespace-pre-wrap text-sm" style={{ fontFamily: T.font, color: T.text }}>{suggestions}</pre>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// LIST PAGE & PROFILE SELECT (Updated Sections)
// ─────────────────────────────────────────────
function ListPage({ userId, listType, sections, theme: T, profileName }) {
  const todoStatus = listType === "watch" ? "unwatched" : "unread";
  const wipStatus  = listType === "watch" ? "watching"  : "reading";
  const doneStatus = listType === "watch" ? "watched"   : "read";

  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [subTab, setSubTab]           = useState("list");
  const [search, setSearch]           = useState("");
  const [adding, setAdding]           = useState(false);
  const [ratingItem, setRatingItem]   = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    setLoading(true);
    dbGetItems(userId, listType).then(data => { setItems(data); setLoading(false); });
  }, [userId, listType]);

  const cycleStatus = useCallback(async (id) => {
    const order = [todoStatus, wipStatus, doneStatus];
    let updatedItem = null;
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next = order[(order.indexOf(item.status) + 1) % order.length];
      updatedItem = { ...item, status: next };
      return updatedItem;
    }));
    if (updatedItem) await dbUpdateItem(userId, updatedItem, listType);
  }, [userId, listType, todoStatus, wipStatus, doneStatus]);

  const removeItem = useCallback(async (id) => {
    await dbDeleteItem(userId, id, listType);
    setItems(prev => prev.filter(i => i.id !== id));
  }, [userId, listType]);

  const addItem = async ({ title, section, genres, genre, desc, author }, alsoAddToOther = false) => {
    const id = Date.now();
    const newItem = { id, title, section, genre: genre || genres?.[0] || "Other", genres: genres || [], notes: "", status: todoStatus, added: id, desc: desc || "", rating: 0, _listType: listType, author: author || "" };
    await dbAddItem(userId, newItem, listType);
    setItems(prev => [newItem, ...prev]);

    if (alsoAddToOther) {
       const otherType = listType === "watch" ? "read" : "watch";
       const detected = await autoDetectGenre(title, otherType);
       const syncedItem = { id: id + 1, title, author: author || "", ...detected, notes: "Auto-synced", status: otherType === "read" ? "unread" : "unwatched", added: id + 1, rating: 0, _listType: otherType };
       await dbAddItem(userId, syncedItem, otherType);
    }
    setAdding(false);
  };

  const rateItem = useCallback(async (id, rating) => {
    let updatedItem = null;
    setItems(prev => prev.map(i => { if (i.id !== id) return i; updatedItem = { ...i, rating }; return updatedItem; }));
    if (updatedItem) await dbUpdateItem(userId, updatedItem, listType);
  }, [userId, listType]);

  const saveEdit = useCallback(async (id, changes) => {
    let updatedItem = null;
    setItems(prev => prev.map(i => { if (i.id !== id) return i; updatedItem = { ...i, ...changes }; return updatedItem; }));
    if (updatedItem) await dbUpdateItem(userId, updatedItem, listType);
  }, [userId, listType]);

  const updateDesc = useCallback(async (id, desc) => {
    let updatedItem = null;
    setItems(prev => prev.map(i => { if (i.id !== id) return i; updatedItem = { ...i, desc }; return updatedItem; }));
    if (updatedItem) await dbUpdateItem(userId, updatedItem, listType);
  }, [userId, listType]);

  const wipItems  = items.filter(i => i.status === wipStatus);
  const doneItems = items.filter(i => i.status === doneStatus);
  const todoCount = items.filter(i => i.status === todoStatus).length;

  const subTabs = [
    { key: "list", label: listType === "watch" ? "🎬 To Watch" : "📖 To Read",  count: todoCount },
    { key: "wip",  label: listType === "watch" ? "▶ Watching"  : "📗 Reading",  count: wipItems.length },
    { key: "done", label: listType === "watch" ? "✓ Watched"   : "✓ Read",      count: doneItems.length },
  ];

  if (loading) return <div className="text-center py-12 opacity-50">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setSubTab(t.key)} className="px-4 py-1.5 rounded-full text-xs font-medium transition-all border shadow-sm"
              style={{ background: subTab === t.key ? T.pillOn : T.pillOff, borderColor: subTab === t.key ? T.pillOn : T.border, color: subTab === t.key ? T.pillOnText : T.pillOffText }}>
              {t.label}{t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setShowDownload(s => !s)} className="px-3 py-1.5 rounded-full text-[11px] border shadow-sm" style={{ background: T.sectionBg, borderColor: T.border, color: T.textMuted }}>⬇ Export</button>
          {showDownload && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl shadow-2xl z-50 p-1 border animate-in slide-in-from-top-2" style={{ background: T.bgCard, borderColor: T.border }}>
              <button onClick={() => { downloadCSV(items, listType, profileName); setShowDownload(false); }} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-black/5" style={{ color: T.text }}>📊 Download CSV</button>
              <button onClick={() => { downloadTXT(items, listType, profileName); setShowDownload(false); }} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-black/5" style={{ color: T.text }}>📄 Download TXT</button>
            </div>
          )}
        </div>
      </div>

      {subTab === "list" && (
        <div className="space-y-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles or authors…" className="w-full px-4 py-2.5 rounded-xl text-sm border shadow-inner outline-none focus:ring-1"
            style={{ background: T.bgInput, borderColor: T.border, color: T.text }} />
          {adding
            ? <AddForm sections={sections} onAdd={addItem} onClose={() => setAdding(false)} theme={T} listType={listType} />
            : <button onClick={() => { setAdding(true); setSubTab("list"); }} className="w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 hover:opacity-70 transition-all" style={{ borderColor: T.border, color: T.textMuted }}>
                <span className="text-xl">+</span><span className="text-sm font-medium">Add {listType === "watch" ? "title" : "book"}</span>
              </button>
          }
          {items.length === 0 && !adding && <div className="text-center py-20 opacity-40 text-sm italic">Your list is empty. Time to find something new!</div>}
          {Object.entries(sections).map(([key, def]) => (
            <MainSection key={key} sectionKey={key} sectionDef={def} items={items} onCycle={cycleStatus} onRemove={removeItem} onRateRequest={setRatingItem} onEdit={setEditingItem} onDescUpdate={updateDesc} theme={T} search={search} listType={listType} />
          ))}
        </div>
      )}

      {subTab === "wip" && <ArchiveSection items={wipItems} onCycle={cycleStatus} onRateRequest={setRatingItem} onRemove={removeItem} onEdit={setEditingItem} onDescUpdate={updateDesc} theme={T} title={listType === "watch" ? "Watching" : "Reading"} emptyMsg="Nothing in progress." canCycle={true} />}
      {subTab === "done" && <ArchiveSection items={doneItems} onRateRequest={setRatingItem} onRemove={removeItem} onEdit={setEditingItem} onDescUpdate={updateDesc} theme={T} title={listType === "watch" ? "Finished" : "Finished reading"} emptyMsg="Nothing finished yet." />}

      {ratingItem && <RatingModal item={ratingItem} onRate={r => rateItem(ratingItem.id, r)} onClose={() => setRatingItem(null)} theme={T} />}
      {editingItem && <EditModal item={editingItem} sections={sections} onSave={changes => saveEdit(editingItem.id, changes)} onClose={() => setEditingItem(null)} theme={T} listType={listType} />}
    </div>
  );
}

function ProfileSelectPage({ profiles, onSelect, onAdd, onRemove, onThemeChange, onLogout }) {
  const [newName, setNewName]             = useState("");
  const [addingProfile, setAddingProfile] = useState(false);
  const [editingTheme, setEditingTheme]   = useState(null);
  const [showManual, setShowManual]       = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { if (addingProfile) inputRef.current?.focus(); }, [addingProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] flex flex-col items-center justify-center p-8 font-serif">
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
      <div className="text-[#E0D4FF] text-3xl mb-1 tracking-widest">✦ Lists</div>
      <div className="text-[#8888BB] text-[10px] uppercase tracking-[0.2em] mb-12">Who's watching?</div>

      <div className="flex flex-wrap gap-6 justify-center max-w-2xl mb-12">
        {profiles.map(u => {
          const T = THEMES[u.theme] || THEMES.beautyandthebeast;
          return (
            <div key={u.id} className="relative group">
              <button onClick={() => onSelect(u.id)} className="w-36 aspect-square bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/10 hover:-translate-y-1 shadow-xl">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2" style={{ background: T.bgHeader, borderColor: T.border }}>{u.avatar}</div>
                <div className="text-[#E0D4FF] text-sm font-bold">{u.name}</div>
                <div className="text-[9px] text-[#8888BB] uppercase tracking-widest">{T.emoji} {T.name.split(" ")[0]}</div>
              </button>
              <div className="absolute top-full mt-3 left-0 right-0 flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingTheme(editingTheme === u.id ? null : u.id)} className="p-1.5 border border-white/20 rounded-md text-[10px] bg-white/5">🎨</button>
                {profiles.length > 1 && <button onClick={() => onRemove(u.id)} className="p-1.5 border border-white/20 rounded-md text-[10px] bg-white/5">✕</button>}
              </div>
              {editingTheme === u.id && (
                <div className="absolute top-[120%] left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-white/20 rounded-xl p-2 z-50 w-44 shadow-2xl">
                  {Object.entries(THEMES).map(([tk, th]) => (
                    <button key={tk} onClick={() => { onThemeChange(u.id, tk); setEditingTheme(null); }} className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 hover:bg-white/10 ${u.theme === tk ? 'bg-white/10' : ''}`}>
                      <span>{th.emoji}</span><span className="text-white">{th.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {profiles.length < 4 && !addingProfile && (
          <button onClick={() => setAddingProfile(true)} className="w-36 aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-all">
            <span className="text-3xl font-light">+</span><span className="text-[10px] uppercase">Add Profile</span>
          </button>
        )}

        {addingProfile && (
          <div className="w-40 p-4 bg-white/10 border border-white/20 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
            <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name…"
              onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onAdd(newName.trim()); setNewName(""); setAddingProfile(false); } if (e.key === "Escape") setAddingProfile(false); }}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-center text-sm text-white outline-none focus:border-white/30" />
            <div className="flex gap-2 w-full">
              <button onClick={() => setAddingProfile(false)} className="flex-1 text-[10px] text-white/50 border border-white/10 p-1.5 rounded-lg">✕</button>
              <button onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); setAddingProfile(false); } }} className="flex-1 text-[10px] bg-white/10 text-white p-1.5 rounded-lg font-bold">Add</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6 items-center">
        <button onClick={onLogout} className="text-[#8888BB] text-xs border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5">Log out</button>
        <button onClick={() => setShowManual(true)} className="text-[#6677BB] text-xs underline">Manual / Help</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP (Integrated)
// ─────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser]           = useState(undefined);
  const [profiles, setProfiles]           = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [mainTab, setMainTab]             = useState("watch");
  const [showSwitch, setShowSwitch]       = useState(false);
  const [showManual, setShowManual]       = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setAuthUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    dbGetProfiles(authUser.id).then(setProfiles);
  }, [authUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null); setProfiles([]); setActiveProfile(null);
  };

  if (authUser === undefined) return <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-[#8888BB] font-serif">Loading…</div>;
  if (!authUser) return <AuthPage onAuth={setAuthUser} />;

  const profile = profiles.find(p => p.id === activeProfile);
  if (!activeProfile || !profile) {
    return (
      <ProfileSelectPage profiles={profiles} onSelect={id => { setActiveProfile(id); setMainTab("watch"); }}
        onAdd={async (name) => {
          const used = profiles.map(p => p.avatar);
          const avatar = AVATAR_EMOJIS.find(e => !used.includes(e)) || "⭐";
          const id = `profile-${Date.now()}`;
          const newProfile = { id, name, avatar, theme: Object.keys(THEMES)[profiles.length % 5] };
          await dbSaveProfile(newProfile, authUser.id);
          setProfiles(prev => [...prev, newProfile]);
        }}
        onRemove={async (id) => { await dbDeleteProfile(id); setProfiles(prev => prev.filter(p => p.id !== id)); }}
        onThemeChange={async (id, theme) => {
          setProfiles(prev => prev.map(p => {
            if (p.id !== id) return p;
            const updated = { ...p, theme };
            dbSaveProfile(updated, authUser.id);
            return updated;
          }));
        }}
        onLogout={handleLogout} />
    );
  }

  const T = THEMES[profile.theme] || THEMES.beautyandthebeast;
  const mainTabs = [{ key: "watch", label: "🎬 Watch" }, { key: "read", label: "📚 Read" }, { key: "suggest", label: "✨ For You" }];

  return (
    <div className="min-h-screen transition-colors duration-500 pb-20" style={{ background: T.bg, fontFamily: T.font, color: T.text }}>
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
      <header className="sticky top-0 z-30 shadow-lg border-b px-4 pt-4" style={{ background: T.bgHeader, borderColor: T.border }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white/10 border-2" style={{ borderColor: T.border }}>{profile.avatar}</div>
              <h1 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: T.headerFont }}>{profile.name}'s Lists</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowManual(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 border border-white/10 hover:bg-white/10 text-xs">?</button>
              <div className="relative">
                <button onClick={() => setShowSwitch(!showSwitch)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-all">⇄ Switch</button>
                {showSwitch && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl z-50 p-2 border animate-in zoom-in-95" style={{ background: T.bgCard, borderColor: T.border }}>
                    {profiles.map(p => (
                      <button key={p.id} onClick={() => { setActiveProfile(p.id); setShowSwitch(false); }} className="w-full flex items-center gap-3 p-2 text-sm rounded-lg hover:bg-black/5" style={{ color: T.text }}>
                        <span className="text-lg">{p.avatar}</span><span className="font-medium">{p.name}</span>
                      </button>
                    ))}
                    <div className="mt-2 pt-2 border-t opacity-20" style={{ borderColor: T.textMuted }} />
                    <button onClick={() => { setActiveProfile(null); setShowSwitch(false); }} className="w-full text-left p-2 text-[11px] opacity-60 font-bold uppercase tracking-widest">Manage Profiles</button>
                    <button onClick={handleLogout} className="w-full text-left p-2 text-[11px] opacity-60 font-bold uppercase tracking-widest">Log out</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <nav className="flex gap-1">
            {mainTabs.map(t => (
              <button key={t.key} onClick={() => setMainTab(t.key)} className={`px-4 py-2 text-sm font-bold transition-all rounded-t-xl border-t border-l border-r relative -bottom-[1px] ${mainTab === t.key ? '' : 'opacity-50'}`}
                style={{ background: mainTab === t.key ? T.bg : "transparent", borderColor: mainTab === t.key ? T.border : "transparent", color: mainTab === t.key ? T.accent : "white" }}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {mainTab === "watch"   && <ListPage userId={profile.id} listType="watch" sections={WATCH_SECTIONS} theme={T} profileName={profile.name} />}
        {mainTab === "read"    && <ListPage userId={profile.id} listType="read"  sections={READ_SECTIONS}  theme={T} profileName={profile.name} />}
        {mainTab === "suggest" && <SuggestionsPage userId={profile.id} theme={T} />}
      </main>
      {showSwitch && <div className="fixed inset-0 z-20" onClick={() => setShowSwitch(false)} />}
    </div>
  );
}
