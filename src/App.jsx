import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────
const THEMES = {
  muppets: {
    name: "The Muppet Show", emoji: "🎭",
    bg: "#1C1228", bgCard: "#261A36", bgHeader: "#120D1C", bgInput: "#2E2040",
    border: "#7B4FA6", borderLight: "#4A2D6A",
    text: "#F0E6FF", textMid: "#C9A8F5", textMuted: "#9066C8", textFaint: "#5C3D8A",
    accent: "#E84B8A", danger: "#FF4466",
    pillOn: "#E84B8A", pillOnText: "#fff", pillOff: "#2E2040", pillOffText: "#C9A8F5",
    sectionBg: "#221530", sectionBorder: "#5C3D8A",
    font: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    headerFont: "'Georgia', serif",
  },
  hitchhiker: {
    name: "Hitchhiker's Guide", emoji: "🌌",
    bg: "#0D1117", bgCard: "#161B22", bgHeader: "#0A0E14", bgInput: "#1C2128",
    border: "#30A0FF", borderLight: "#1A4A7A",
    text: "#E6F1FF", textMid: "#88C4FF", textMuted: "#4A90D9", textFaint: "#2A5A9A",
    accent: "#00FF9C", danger: "#FF4444",
    pillOn: "#00FF9C", pillOnText: "#0D1117", pillOff: "#1C2840", pillOffText: "#88C4FF",
    sectionBg: "#111823", sectionBorder: "#1E3A5F",
    font: "'Courier New', Courier, monospace",
    headerFont: "'Courier New', Courier, monospace",
  },
  gilmore: {
    name: "Gilmore Girls", emoji: "☕",
    bg: "#E8F4F0", bgCard: "#F2FAF7", bgHeader: "#2D6A4F", bgInput: "#F5FCFA",
    border: "#52B788", borderLight: "#95D5B2",
    text: "#1B3A2D", textMid: "#2D6A4F", textMuted: "#52B788", textFaint: "#95D5B2",
    accent: "#1B3A2D", danger: "#8B2020",
    pillOn: "#1B3A2D", pillOnText: "#E8F4F0", pillOff: "#D8F3DC", pillOffText: "#2D6A4F",
    sectionBg: "#D8F3DC", sectionBorder: "#52B788",
    font: "'Garamond', 'EB Garamond', Georgia, serif",
    headerFont: "'Garamond', Georgia, serif",
  },
  toystory: {
    name: "Toy Story", emoji: "🚀",
    bg: "#EEF6FF", bgCard: "#F8FBFF", bgHeader: "#1A6FBF", bgInput: "#F0F8FF",
    border: "#4A9FE0", borderLight: "#A8D4F5",
    text: "#0D2B4A", textMid: "#1A5A8A", textMuted: "#4A90C0", textFaint: "#8ABCDC",
    accent: "#E8441A", danger: "#C0200A",
    pillOn: "#E8441A", pillOnText: "#fff", pillOff: "#D0EAFF", pillOffText: "#1A5A8A",
    sectionBg: "#E0F0FF", sectionBorder: "#4A9FE0",
    font: "'Trebuchet MS', 'Gill Sans', sans-serif",
    headerFont: "'Trebuchet MS', sans-serif",
  },
};

// ─────────────────────────────────────────────
// TAXONOMIES
// ─────────────────────────────────────────────
const WATCH_SECTIONS = {
  Movies:        { icon: "🎬", genres: ["Horror","Comedy","Rom-Com","Action","Drama","Sci-Fi","Thriller","Fantasy","Family","Animation","Documentary","Other"] },
  Shows:         { icon: "📺", genres: ["Horror","Comedy","Drama","Sci-Fi","Thriller","Fantasy","Action","Reality","Anime","Family","Documentary","Other"] },
  "Mini-series": { icon: "🎞️", genres: ["Horror","Comedy","Drama","Thriller","Documentary","True Crime","Other"] },
  Documentaries: { icon: "🎙️", genres: ["True Crime","Nature","History","Social","Music","Sports","Other"] },
  Anime:         { icon: "✨", genres: ["Action","Fantasy","Sci-Fi","Romance","Horror","Comedy","Slice of Life","Other"] },
};

const READ_SECTIONS = {
  Fiction:                  { icon: "📖", genres: ["Romance","Mystery","Horror","Thriller","Sci-Fi","Fantasy","Historical","Literary","Other"] },
  "Non-fiction":            { icon: "📰", genres: ["True Crime","History","Biography","Self-Help","Science","Social","Essays","Other"] },
  "Short Stories / Novella":{ icon: "📜", genres: ["Horror","Fantasy","Sci-Fi","Literary","Other"] },
  Poetry:                   { icon: "🌸", genres: ["Classic","Contemporary","Spoken Word","Other"] },
  "Graphic Novel":          { icon: "🎨", genres: ["Superhero","Horror","Fantasy","Sci-Fi","Literary","Other"] },
  Reference:                { icon: "📚", genres: ["Craft","Language","Science","Other"] },
  Cooking:                  { icon: "🍳", genres: ["Baking","Savoury","Preservation","Foraging","Other"] },
};

const AVATAR_EMOJIS = ["🦊","🐺","🌙","🌿","🐙","🦋","🔮","🌊","🎭","🚀","☕","🎸"];
const RATING_LABELS = ["","Hated it","Didn't like it","It was okay","Liked it","Loved it"];
const RATING_EMOJIS_MAP = ["","😤","😕","😐","🙂","😍"];
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

// ─────────────────────────────────────────────
// SUPABASE DATA LAYER
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
  }));
}
async function dbAddItem(userId, item, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).insert({
    id: item.id, user_id: userId, title: item.title,
    section: item.section, genre: item.genre, genres: item.genres || [],
    notes: item.notes || "", status: item.status, added: item.added,
    description: item.desc || "", rating: item.rating || 0, list_type: listType,
  });
}
async function dbUpdateItem(userId, item, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).update({
    status: item.status, rating: item.rating,
    description: item.desc || "", notes: item.notes || "",
    section: item.section, genre: item.genre, genres: item.genres || [],
  }).eq("id", item.id).eq("user_id", userId);
}
async function dbDeleteItem(userId, itemId, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).delete().eq("id", itemId).eq("user_id", userId);
}

// ─────────────────────────────────────────────
// ANTHROPIC HELPERS
// ─────────────────────────────────────────────
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

async function generateSuggestions(watchItems, readItems) {
  const rated = [...watchItems, ...readItems].filter(i => i.rating >= 4);
  if (rated.length === 0) return "Rate items 4–5 ★ after watching or reading to unlock personalised suggestions.";
  const liked = rated.map(i => `"${i.title}"`).slice(0, 10).join(", ");
  try {
    return await callClaude(
      `User loved: ${liked}. Suggest 5 films/shows AND 3 books they'd enjoy. For each: title + one sentence why. Be specific.`,
      600
    );
  } catch {
    return "Could not reach suggestions service.";
  }
}

// ─────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState("login"); // login | signup
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const fakeEmail = (u) => `${u.toLowerCase().replace(/[^a-z0-9]/g, "")}@lists.app`;

  const handle = async () => {
    if (!username.trim() || !password.trim()) { setError("Please fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    const email = fakeEmail(username.trim());

    if (mode === "signup") {
      // Check username not taken by trying to sign in first
      const { data: existing } = await supabase.from("accounts").select("id").eq("username", username.trim().toLowerCase()).maybeSingle();
      if (existing) { setError("That username is already taken."); setLoading(false); return; }

      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }

      // Store username mapping
      await supabase.from("accounts").insert({ id: data.user.id, username: username.trim().toLowerCase() });
      onAuth(data.user, username.trim());
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError("Invalid username or password."); setLoading(false); return; }

      const { data: acct } = await supabase.from("accounts").select("username").eq("id", data.user.id).maybeSingle();
      onAuth(data.user, acct?.username || username.trim());
    }
    setLoading(false);
  };

  const inp = {
    width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 8, color: "#E0D4FF", padding: "0.7rem 1rem", fontSize: "0.95rem",
    fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Georgia, serif" }}>
      <div style={{ color: "#E0D4FF", fontSize: "2rem", marginBottom: "0.3rem", letterSpacing: "0.08em" }}>✦ Lists</div>
      <div style={{ color: "#8888BB", fontSize: "0.78rem", marginBottom: "2.5rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        {mode === "login" ? "Welcome back" : "Create account"}
      </div>

      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
          onKeyDown={e => e.key === "Enter" && handle()} style={inp} autoCapitalize="none" autoCorrect="off" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
          onKeyDown={e => e.key === "Enter" && handle()} style={inp} />

        {error && <div style={{ color: "#FF8888", fontSize: "0.8rem", textAlign: "center" }}>{error}</div>}

        <button onClick={handle} disabled={loading} style={{ background: "#5A3EA6", border: "none", borderRadius: 8, color: "#fff", padding: "0.75rem", fontSize: "0.95rem", fontFamily: "Georgia, serif", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", opacity: loading ? 0.7 : 1 }}>
          {loading ? "…" : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); }}
          style={{ background: "transparent", border: "none", color: "#8888BB", fontSize: "0.82rem", fontFamily: "Georgia, serif", cursor: "pointer", textDecoration: "underline" }}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────
function StarRating({ value, onChange, theme: T }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", padding: "0 0.05rem", lineHeight: 1,
            color: n <= (hovered || value) ? T.accent : T.borderLight,
            transform: n <= (hovered || value) ? "scale(1.2)" : "scale(1)", transition: "all 0.1s" }}
          title={RATING_LABELS[n]}
        >★</button>
      ))}
      {(hovered || value) > 0 && (
        <span style={{ fontSize: "0.75rem", color: T.textMuted, marginLeft: "0.4rem" }}>
          {RATING_EMOJIS_MAP[hovered || value]} {RATING_LABELS[hovered || value]}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RATING MODAL
// ─────────────────────────────────────────────
function RatingModal({ item, onRate, onClose, theme: T }) {
  const [rating, setRating] = useState(item.rating || 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1.6rem", maxWidth: 360, width: "100%", fontFamily: T.font }}>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.textMuted, marginBottom: "0.4rem" }}>Rate this</div>
        <div style={{ fontSize: "1.05rem", color: T.text, fontFamily: T.headerFont, marginBottom: "1.3rem", lineHeight: 1.4 }}>{item.title}</div>
        <StarRating value={rating} onChange={setRating} theme={T} />
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, padding: "0.4rem 1rem", fontSize: "0.82rem", fontFamily: T.font, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onRate(rating); onClose(); }} style={{ background: T.accent, border: "none", borderRadius: 6, color: "#fff", padding: "0.4rem 1.2rem", fontSize: "0.82rem", fontFamily: T.font, cursor: "pointer", fontWeight: "bold" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────
function EditModal({ item, sections, onSave, onClose, theme: T }) {
  const sectionKeys = Object.keys(sections);
  const [section, setSection] = useState(item.section || sectionKeys[0]);
  const [selectedGenres, setSelectedGenres] = useState(item.genres?.length ? item.genres : item.genre ? [item.genre] : ["Other"]);
  const [notes, setNotes]     = useState(item.notes || "");

  const availableGenres = sections[section]?.genres || ["Other"];

  const toggleGenre = (g) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 3 ? [...prev, g] : prev
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1.5rem", maxWidth: 400, width: "100%", fontFamily: T.font, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.textMuted, marginBottom: "0.3rem" }}>Edit entry</div>
        <div style={{ fontSize: "1rem", color: T.text, fontFamily: T.headerFont, marginBottom: "1.2rem", lineHeight: 1.3 }}>{item.title}</div>

        {/* Section */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, display: "block", marginBottom: "0.4rem" }}>Section</label>
          <select value={section} onChange={e => { setSection(e.target.value); setSelectedGenres(["Other"]); }}
            style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: T.font, outline: "none" }}>
            {sectionKeys.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Genres — multi select */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, display: "block", marginBottom: "0.4rem" }}>
            Genres <span style={{ color: T.textFaint, textTransform: "none", letterSpacing: 0 }}>(up to 3)</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {availableGenres.map(g => (
              <button key={g} onClick={() => toggleGenre(g)} style={{
                background: selectedGenres.includes(g) ? T.accent : T.sectionBg,
                border: `1px solid ${selectedGenres.includes(g) ? T.accent : T.border}`,
                borderRadius: 20, color: selectedGenres.includes(g) ? "#fff" : T.textMid,
                padding: "0.22rem 0.65rem", fontSize: "0.75rem", fontFamily: T.font, cursor: "pointer", transition: "all 0.12s",
              }}>{g}</button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "1.3rem" }}>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, display: "block", marginBottom: "0.4rem" }}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…"
            style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: T.font, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, padding: "0.4rem 1rem", fontSize: "0.82rem", fontFamily: T.font, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSave({ section, genres: selectedGenres, genre: selectedGenres[0], notes }); onClose(); }}
            style={{ background: T.accent, border: "none", borderRadius: 6, color: "#fff", padding: "0.4rem 1.2rem", fontSize: "0.82rem", fontFamily: T.font, cursor: "pointer", fontWeight: "bold" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ITEM ROW
// ─────────────────────────────────────────────
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
    <div style={{ background: T.bgCard, border: `1px solid ${done ? T.borderLight : T.border}`, borderRadius: 8, marginBottom: "0.35rem", overflow: "hidden", opacity: done ? 0.68 : 1, transition: "opacity 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.85rem" }}>
        {/* Status dot */}
        <button onClick={() => !isArchive && onCycle(item.id)}
          style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, border: "none", cursor: isArchive ? "default" : "pointer",
            background: done ? T.accent : wip ? T.textMid : T.borderLight,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", color: "#fff", fontWeight: "bold", transition: "transform 0.15s" }}
          onMouseEnter={e => { if (!isArchive) e.currentTarget.style.transform = "scale(1.2)"; }}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >{done ? "✓" : wip ? "▶" : ""}</button>

        {/* Title + genre pills */}
        <button onClick={handleExpand} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, minWidth: 0 }}>
          <div style={{ fontSize: "0.88rem", color: done ? T.textMuted : T.text, textDecoration: done ? "line-through" : "none", fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.title}
          </div>
          {genreList.length > 0 && (
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
              {genreList.map(g => (
                <span key={g} style={{ fontSize: "0.58rem", background: T.sectionBg, border: `1px solid ${T.sectionBorder}`, borderRadius: 10, color: T.textMuted, padding: "0.08rem 0.4rem", letterSpacing: "0.04em" }}>{g}</span>
              ))}
            </div>
          )}
        </button>

        {/* Rating */}
        {done && item.rating > 0 && (
          <span style={{ fontSize: "0.7rem", color: T.accent, letterSpacing: 1, flexShrink: 0 }}>{"★".repeat(item.rating)}</span>
        )}
        {done && item.rating === 0 && (
          <button onClick={() => onRateRequest(item)} style={{ background: "transparent", border: `1px solid ${T.borderLight}`, borderRadius: 4, color: T.textMuted, padding: "0.13rem 0.45rem", fontSize: "0.65rem", fontFamily: T.font, cursor: "pointer", flexShrink: 0 }}>Rate</button>
        )}

        {/* Edit */}
        <button onClick={() => onEdit(item)} style={{ background: "transparent", border: "none", color: T.textFaint, cursor: "pointer", fontSize: "0.8rem", flexShrink: 0, lineHeight: 1, padding: "0 0.1rem", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = T.accent}
          onMouseLeave={e => e.currentTarget.style.color = T.textFaint}
          title="Edit"
        >✎</button>

        {/* Remove */}
        <button onClick={() => onRemove(item.id)} style={{ background: "transparent", border: "none", color: T.borderLight, cursor: "pointer", fontSize: "0.95rem", flexShrink: 0, lineHeight: 1, padding: "0 0.1rem", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = T.danger}
          onMouseLeave={e => e.currentTarget.style.color = T.borderLight}
        >×</button>
      </div>

      {expanded && (
        <div style={{ padding: "0 0.85rem 0.7rem", borderTop: `1px solid ${T.borderLight}` }}>
          {item.notes && <div style={{ fontSize: "0.7rem", color: T.textMuted, marginTop: "0.4rem", fontStyle: "italic" }}>{item.notes}</div>}
          <div style={{ fontSize: "0.75rem", color: T.textMid, marginTop: "0.4rem", lineHeight: 1.55 }}>
            {loadingDesc ? "Fetching description…" : desc || <span style={{ color: T.textFaint }}>No description available.</span>}
          </div>
          {!isArchive && (
            <button onClick={() => onCycle(item.id)}
              style={{ marginTop: "0.6rem", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMid, padding: "0.25rem 0.65rem", fontSize: "0.72rem", fontFamily: T.font, cursor: "pointer" }}>
              {wip ? "✓ Mark as done" : done ? "↩ Move back" : "▶ Mark in progress"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GENRE SECTION
// ─────────────────────────────────────────────
function GenreSection({ genre, items, onCycle, onRemove, onRateRequest, onEdit, onDescUpdate, theme: T }) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: "transparent", border: "none", cursor: "pointer", padding: "0.28rem 0", textAlign: "left" }}>
        <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: T.textMuted, fontFamily: T.font }}>{genre}</span>
        <span style={{ flex: 1, height: 1, background: T.borderLight }} />
        <span style={{ fontSize: "0.62rem", color: T.textFaint }}>{items.length} {open ? "▲" : "▼"}</span>
      </button>
      {open && items.map(item => (
        <ItemRow key={item.id} item={item} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} onDescUpdate={onDescUpdate} theme={T} isArchive={false} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN SECTION
// ─────────────────────────────────────────────
function MainSection({ sectionKey, sectionDef, items, onCycle, onRemove, onRateRequest, onEdit, onDescUpdate, theme: T, search, listType }) {
  const [open, setOpen] = useState(true);
  const todoStatus = listType === "read" ? "unread" : "unwatched";
  const filtered = items.filter(i =>
    i.section === sectionKey &&
    i.status === todoStatus &&
    i.title.toLowerCase().includes(search.toLowerCase())
  );
  if (filtered.length === 0) return null;

  const byGenre = {};
  sectionDef.genres.forEach(g => { byGenre[g] = []; });
  filtered.forEach(i => {
    const itemGenres = i.genres?.length ? i.genres : i.genre ? [i.genre] : ["Other"];
    // Place item under its first/primary genre
    const primaryGenre = itemGenres[0] || "Other";
    if (!byGenre[primaryGenre]) byGenre[primaryGenre] = [];
    byGenre[primaryGenre].push(i);
  });

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: T.sectionBg, border: `1px solid ${T.sectionBorder}`, borderRadius: 8, padding: "0.5rem 0.85rem", cursor: "pointer", marginBottom: open ? "0.45rem" : 0 }}>
        <span style={{ fontSize: "0.95rem" }}>{sectionDef.icon}</span>
        <span style={{ fontSize: "0.85rem", fontFamily: T.headerFont, color: T.text, fontWeight: "bold" }}>{sectionKey}</span>
        <span style={{ fontSize: "0.7rem", color: T.textMuted }}>({filtered.length})</span>
        <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: T.textMuted }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: "0.4rem" }}>
          {sectionDef.genres.map(g => (
            <GenreSection key={g} genre={g} items={byGenre[g] || []} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} onDescUpdate={onDescUpdate} theme={T} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ARCHIVE SECTION
// ─────────────────────────────────────────────
function ArchiveSection({ items, onCycle, onRateRequest, onRemove, onEdit, onDescUpdate, theme: T, title, emptyMsg, canCycle }) {
  if (items.length === 0) return <div style={{ color: T.textFaint, fontSize: "0.85rem", padding: "2.5rem 0", textAlign: "center" }}>{emptyMsg}</div>;
  return (
    <div>
      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: T.textMuted, marginBottom: "0.75rem" }}>{title} — {items.length}</div>
      {items.map(item => (
        <ItemRow key={item.id} item={item} onCycle={canCycle ? onCycle : () => {}} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} onDescUpdate={onDescUpdate} theme={T} isArchive={!canCycle} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ADD FORM
// ─────────────────────────────────────────────
function AddForm({ sections, onAdd, onClose, theme: T, listType }) {
  const [title, setTitle]       = useState("");
  const [detecting, setDetecting] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setDetecting(true);
    const detected = await autoDetectGenre(title.trim(), listType);
    setDetecting(false);
    onAdd({ title: title.trim(), ...detected });
  };

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
      <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && title.trim()) handleAdd(); if (e.key === "Escape") onClose(); }}
        placeholder="Title… (press Enter)"
        style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, color: T.text, padding: "0.35rem 0", fontSize: "1rem", fontFamily: T.font, outline: "none", marginBottom: "0.75rem", boxSizing: "border-box" }}
      />
      {detecting && <div style={{ fontSize: "0.75rem", color: T.textMuted, marginBottom: "0.5rem" }}>✨ Auto-detecting genre…</div>}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5, color: T.textMuted, padding: "0.3rem 0.85rem", fontSize: "0.8rem", fontFamily: T.font, cursor: "pointer" }}>Cancel</button>
        <button onClick={handleAdd} disabled={detecting || !title.trim()}
          style={{ background: T.accent, border: "none", borderRadius: 5, color: "#fff", padding: "0.3rem 0.95rem", fontSize: "0.8rem", fontFamily: T.font, cursor: detecting ? "not-allowed" : "pointer", fontWeight: "bold", opacity: detecting ? 0.7 : 1 }}>
          {detecting ? "…" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUGGESTIONS
// ─────────────────────────────────────────────
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

  if (!dataLoaded) return <div style={{ color: T.textFaint, padding: "2rem 0", textAlign: "center" }}>Loading…</div>;

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ fontSize: "0.78rem", color: T.textMuted, marginBottom: "1rem", lineHeight: 1.5 }}>
        {ratedCount === 0 ? "Rate items 4–5 ★ to unlock personalised suggestions." : `Based on your ${ratedCount} highly-rated item${ratedCount !== 1 ? "s" : ""}.`}
      </div>
      <button onClick={load} disabled={loading || ratedCount === 0}
        style={{ background: ratedCount === 0 ? T.sectionBg : T.accent, border: `1px solid ${ratedCount === 0 ? T.borderLight : T.accent}`, borderRadius: 8, color: ratedCount === 0 ? T.textFaint : "#fff", padding: "0.55rem 1.4rem", fontSize: "0.85rem", fontFamily: T.font, cursor: ratedCount === 0 ? "not-allowed" : "pointer", marginBottom: "1.2rem", fontWeight: "bold" }}>
        {loading ? "Thinking…" : "✨ Generate Suggestions"}
      </button>
      {suggestions && (
        <div style={{ background: T.sectionBg, border: `1px solid ${T.sectionBorder}`, borderRadius: 10, padding: "1rem 1.2rem" }}>
          <pre style={{ margin: 0, fontFamily: T.font, fontSize: "0.85rem", color: T.text, whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{suggestions}</pre>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// LIST PAGE
// ─────────────────────────────────────────────
function ListPage({ userId, listType, sections, theme: T }) {
  const todoStatus = listType === "watch" ? "unwatched" : "unread";
  const wipStatus  = listType === "watch" ? "watching"  : "reading";
  const doneStatus = listType === "watch" ? "watched"   : "read";

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [subTab, setSubTab]       = useState("list");
  const [search, setSearch]       = useState("");
  const [adding, setAdding]       = useState(false);
  const [ratingItem, setRatingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    dbGetItems(userId, listType).then(data => { setItems(data); setLoading(false); });
  }, [userId, listType]);

  const cycleStatus = useCallback(async (id) => {
    const order = [todoStatus, wipStatus, doneStatus];
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next = order[(order.indexOf(item.status) + 1) % order.length];
      const updated = { ...item, status: next };
      dbUpdateItem(userId, updated, listType);
      return updated;
    }));
  }, [userId, listType, todoStatus, wipStatus, doneStatus]);

  const removeItem = useCallback(async (id) => {
    await dbDeleteItem(userId, id, listType);
    setItems(prev => prev.filter(i => i.id !== id));
  }, [userId, listType]);

  const addItem = async ({ title, section, genres, genre, desc }) => {
    const id = Date.now();
    const newItem = { id, title, section, genre: genre || genres?.[0] || "Other", genres: genres || [], notes: "", status: todoStatus, added: id, desc: desc || "", rating: 0, _listType: listType };
    await dbAddItem(userId, newItem, listType);
    setItems(prev => [newItem, ...prev]);
    setAdding(false);
  };

  const rateItem = useCallback(async (id, rating) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, rating };
      dbUpdateItem(userId, updated, listType);
      return updated;
    }));
  }, [userId, listType]);

  const saveEdit = useCallback(async (id, changes) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, ...changes };
      dbUpdateItem(userId, updated, listType);
      return updated;
    }));
  }, [userId, listType]);

  const updateDesc = useCallback(async (id, desc) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, desc };
      dbUpdateItem(userId, updated, listType);
      return updated;
    }));
  }, [userId, listType]);

  const wipItems  = items.filter(i => i.status === wipStatus);
  const doneItems = items.filter(i => i.status === doneStatus);
  const todoCount = items.filter(i => i.status === todoStatus).length;

  const subTabs = [
    { key: "list", label: listType === "watch" ? "🎬 To Watch" : "📖 To Read",  count: todoCount },
    { key: "wip",  label: listType === "watch" ? "▶ Watching"  : "📗 Reading",  count: wipItems.length },
    { key: "done", label: listType === "watch" ? "✓ Watched"   : "✓ Read",      count: doneItems.length },
  ];

  if (loading) return <div style={{ color: T.textFaint, padding: "2rem 0", textAlign: "center" }}>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            background: subTab === t.key ? T.pillOn : T.pillOff,
            border: `1px solid ${subTab === t.key ? T.pillOn : T.border}`,
            borderRadius: 20, color: subTab === t.key ? T.pillOnText : T.pillOffText,
            padding: "0.3rem 0.9rem", fontSize: "0.77rem", fontFamily: T.font, cursor: "pointer", transition: "all 0.15s",
          }}>{t.label}{t.count > 0 && <span style={{ opacity: 0.7 }}> ({t.count})</span>}</button>
        ))}
      </div>

      {subTab === "list" && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "0.38rem 0.7rem", fontSize: "0.83rem", fontFamily: T.font, outline: "none" }} />
          </div>
          {adding
            ? <AddForm sections={sections} onAdd={addItem} onClose={() => setAdding(false)} theme={T} listType={listType} />
            : <button onClick={() => setAdding(true)}
                style={{ width: "100%", background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "0.72rem", fontSize: "0.85rem", fontFamily: T.font, cursor: "pointer", marginBottom: "1rem", transition: "all 0.15s" }}
                onMouseEnter={e => { e.target.style.borderColor = T.accent; e.target.style.color = T.accent; }}
                onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.textMuted; }}
              >+ Add {listType === "watch" ? "title" : "book"}</button>
          }
          {items.length === 0 && !adding && (
            <div style={{ color: T.textFaint, textAlign: "center", padding: "3rem 0", fontSize: "0.85rem" }}>Nothing here yet. Add something!</div>
          )}
          {Object.entries(sections).map(([key, def]) => (
            <MainSection key={key} sectionKey={key} sectionDef={def} items={items} onCycle={cycleStatus} onRemove={removeItem} onRateRequest={setRatingItem} onEdit={setEditingItem} onDescUpdate={updateDesc} theme={T} search={search} listType={listType} />
          ))}
        </>
      )}

      {subTab === "wip" && (
        <ArchiveSection items={wipItems} onCycle={cycleStatus} onRateRequest={setRatingItem} onRemove={removeItem} onEdit={setEditingItem} onDescUpdate={updateDesc} theme={T}
          title={listType === "watch" ? "Currently watching" : "Currently reading"} emptyMsg="Nothing in progress." canCycle={true} />
      )}
      {subTab === "done" && (
        <ArchiveSection items={doneItems} onRateRequest={setRatingItem} onRemove={removeItem} onEdit={setEditingItem} onDescUpdate={updateDesc} theme={T}
          title={listType === "watch" ? "Finished" : "Finished reading"} emptyMsg="Nothing finished yet." />
      )}

      {ratingItem && <RatingModal item={ratingItem} onRate={r => rateItem(ratingItem.id, r)} onClose={() => setRatingItem(null)} theme={T} />}
      {editingItem && <EditModal item={editingItem} sections={sections} onSave={changes => saveEdit(editingItem.id, changes)} onClose={() => setEditingItem(null)} theme={T} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE SELECT PAGE
// ─────────────────────────────────────────────
function ProfileSelectPage({ profiles, onSelect, onAdd, onRemove, onThemeChange, onLogout }) {
  const [newName, setNewName]       = useState("");
  const [addingProfile, setAddingProfile] = useState(false);
  const [editingTheme, setEditingTheme]   = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { if (addingProfile) inputRef.current?.focus(); }, [addingProfile]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Georgia, serif" }}>
      <div style={{ color: "#E0D4FF", fontSize: "2rem", marginBottom: "0.3rem", letterSpacing: "0.08em" }}>✦ Lists</div>
      <div style={{ color: "#8888BB", fontSize: "0.78rem", marginBottom: "3rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Who's watching?</div>

      <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}>
        {profiles.map(u => {
          const T = THEMES[u.theme || "gilmore"];
          return (
            <div key={u.id} style={{ position: "relative" }}>
              <button onClick={() => onSelect(u.id)} style={{ width: 130, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "1.5rem 1rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: T.bgHeader, border: `2px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{u.avatar}</div>
                <div style={{ color: "#E0D4FF", fontSize: "0.88rem" }}>{u.name}</div>
                <div style={{ color: "#8888BB", fontSize: "0.62rem", letterSpacing: "0.08em" }}>{T.emoji} {T.name.split(" ").slice(0,2).join(" ")}</div>
              </button>
              <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", marginTop: "0.5rem" }}>
                <button onClick={() => setEditingTheme(editingTheme === u.id ? null : u.id)}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, color: "#8888BB", fontSize: "0.6rem", padding: "0.18rem 0.45rem", cursor: "pointer" }}>🎨</button>
                {profiles.length > 1 && (
                  <button onClick={() => onRemove(u.id)}
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#664444", fontSize: "0.6rem", padding: "0.18rem 0.45rem", cursor: "pointer" }}>✕</button>
                )}
              </div>
              {editingTheme === u.id && (
                <div style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "0.75rem", zIndex: 50, width: 200 }}>
                  {Object.entries(THEMES).map(([tk, th]) => (
                    <button key={tk} onClick={() => { onThemeChange(u.id, tk); setEditingTheme(null); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: u.theme === tk ? "rgba(255,255,255,0.1)" : "transparent", border: "none", borderRadius: 6, padding: "0.4rem 0.6rem", cursor: "pointer", color: "#E0D4FF", fontSize: "0.78rem", fontFamily: "Georgia, serif", marginBottom: "0.2rem" }}>
                      <span>{th.emoji}</span><span>{th.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {profiles.length < 4 && !addingProfile && (
          <button onClick={() => setAddingProfile(true)} style={{ width: 130, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 14, padding: "1.5rem 1rem", cursor: "pointer", color: "#6666AA", fontSize: "0.82rem", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
          >
            <span style={{ fontSize: "2rem", opacity: 0.4 }}>+</span>
            <span>Add Profile</span>
          </button>
        )}

        {addingProfile && (
          <div style={{ width: 150, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.7rem" }}>
            <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name…"
              onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onAdd(newName.trim()); setNewName(""); setAddingProfile(false); } if (e.key === "Escape") setAddingProfile(false); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#E0D4FF", padding: "0.4rem 0.5rem", fontSize: "0.85rem", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button onClick={() => setAddingProfile(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, color: "#6666AA", padding: "0.25rem 0.6rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "Georgia, serif" }}>✕</button>
              <button onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); setAddingProfile(false); } }}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, color: "#E0D4FF", padding: "0.25rem 0.7rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "Georgia, serif" }}>Add</button>
            </div>
          </div>
        )}
      </div>

      <button onClick={onLogout} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#6666AA", padding: "0.4rem 1.2rem", fontSize: "0.78rem", fontFamily: "Georgia, serif", cursor: "pointer" }}>
        Log out
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser]       = useState(undefined); // undefined = loading
  const [username, setUsername]       = useState("");
  const [profiles, setProfiles]       = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [mainTab, setMainTab]         = useState("watch");
  const [showSwitch, setShowSwitch]   = useState(false);

  // Check existing session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        supabase.from("accounts").select("username").eq("id", session.user.id).maybeSingle()
          .then(({ data }) => setUsername(data?.username || ""));
      } else {
        setAuthUser(null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load profiles when auth user is set
  useEffect(() => {
    if (!authUser) return;
    dbGetProfiles(authUser.id).then(setProfiles);
  }, [authUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null); setUsername(""); setProfiles([]); setActiveProfile(null);
  };

  // Loading state
  if (authUser === undefined) return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", color: "#8888BB", fontFamily: "Georgia, serif" }}>Loading…</div>
  );

  // Not logged in
  if (!authUser) return (
    <AuthPage onAuth={(user, uname) => { setAuthUser(user); setUsername(uname); }} />
  );

  // Logged in but no profile selected
  if (!activeProfile || !profiles.find(p => p.id === activeProfile)) {
    return (
      <ProfileSelectPage
        profiles={profiles}
        onSelect={id => { setActiveProfile(id); setMainTab("watch"); }}
        onAdd={async (name) => {
          const used = profiles.map(p => p.avatar);
          const avatar = AVATAR_EMOJIS.find(e => !used.includes(e)) || "⭐";
          const themeKeys = Object.keys(THEMES);
          const theme = themeKeys[profiles.length % themeKeys.length];
          const id = `profile-${Date.now()}`;
          const newProfile = { id, name, avatar, theme };
          await dbSaveProfile(newProfile, authUser.id);
          setProfiles(prev => [...prev, newProfile]);
        }}
        onRemove={async (id) => {
          await dbDeleteProfile(id);
          setProfiles(prev => prev.filter(p => p.id !== id));
        }}
        onThemeChange={async (id, theme) => {
          setProfiles(prev => prev.map(p => {
            if (p.id !== id) return p;
            const updated = { ...p, theme };
            dbSaveProfile(updated, authUser.id);
            return updated;
          }));
        }}
        onLogout={handleLogout}
      />
    );
  }

  const profile = profiles.find(p => p.id === activeProfile);
  const T = THEMES[profile.theme || "gilmore"];

  const mainTabs = [
    { key: "watch",   label: "🎬 Watch" },
    { key: "read",    label: "📚 Read" },
    { key: "suggest", label: "✨ For You" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.bgHeader, borderBottom: `1px solid ${T.border}`, padding: "1.1rem 1.5rem 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.2rem" }}>{profile.avatar}</span>
              <span style={{ fontSize: "0.95rem", fontFamily: T.headerFont, color: T.text, fontWeight: "bold", letterSpacing: "0.04em" }}>{profile.name}'s Lists</span>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowSwitch(s => !s)} style={{ background: "rgba(0,0,0,0.08)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "0.28rem 0.75rem", fontSize: "0.73rem", fontFamily: T.font, color: T.textMid, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>⇄</span><span>Switch</span>
              </button>
              {showSwitch && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 0.5rem)", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.5rem", zIndex: 100, minWidth: 160, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                  {profiles.map(p => (
                    <button key={p.id} onClick={() => { setActiveProfile(p.id); setShowSwitch(false); setMainTab("watch"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: p.id === activeProfile ? T.sectionBg : "transparent", border: "none", borderRadius: 6, padding: "0.42rem 0.6rem", cursor: "pointer", color: T.text, fontSize: "0.82rem", fontFamily: T.font, marginBottom: "0.12rem" }}>
                      <span>{p.avatar}</span><span>{p.name}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: `1px solid ${T.borderLight}`, marginTop: "0.3rem", paddingTop: "0.3rem" }}>
                    <button onClick={() => { setActiveProfile(null); setShowSwitch(false); }}
                      style={{ width: "100%", background: "transparent", border: "none", borderRadius: 6, padding: "0.38rem 0.6rem", cursor: "pointer", color: T.textMuted, fontSize: "0.73rem", fontFamily: T.font, textAlign: "left" }}>
                      👥 Manage profiles
                    </button>
                    <button onClick={() => { handleLogout(); setShowSwitch(false); }}
                      style={{ width: "100%", background: "transparent", border: "none", borderRadius: 6, padding: "0.38rem 0.6rem", cursor: "pointer", color: T.textMuted, fontSize: "0.73rem", fontFamily: T.font, textAlign: "left" }}>
                      🚪 Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.2rem" }}>
            {mainTabs.map(t => (
              <button key={t.key} onClick={() => setMainTab(t.key)} style={{
                background: mainTab === t.key ? T.bg : "transparent",
                border: `1px solid ${T.border}`,
                borderBottom: mainTab === t.key ? `1px solid ${T.bg}` : `1px solid ${T.border}`,
                borderRadius: "7px 7px 0 0",
                color: mainTab === t.key ? T.accent : T.textMuted,
                padding: "0.38rem 0.95rem", fontSize: "0.78rem", fontFamily: T.font,
                cursor: "pointer", marginRight: "0.2rem",
                fontWeight: mainTab === t.key ? "bold" : "normal",
                position: "relative", bottom: -1, transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.4rem 1.2rem 5rem" }}>
        {mainTab === "watch"   && <ListPage key={`w-${profile.id}`} userId={profile.id} listType="watch" sections={WATCH_SECTIONS} theme={T} />}
        {mainTab === "read"    && <ListPage key={`r-${profile.id}`} userId={profile.id} listType="read"  sections={READ_SECTIONS}  theme={T} />}
        {mainTab === "suggest" && <SuggestionsPage key={`s-${profile.id}`} userId={profile.id} theme={T} />}
      </div>

      {showSwitch && <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setShowSwitch(false)} />}
    </div>
  );
}
