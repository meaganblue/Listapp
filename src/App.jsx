import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const THEMES = {
  beautyandthebeast: {
    name: "Beauty and the Beast", emoji: "🌹",
    bg: "#FDF6E3", bgCard: "#FFF8ED", bgHeader: "#1B2A6B", bgInput: "#FFF8ED",
    border: "#C9A84C", borderLight: "#E8D48A",
    text: "#1B2A6B", textMid: "#3D4F8A", textMuted: "#8A7A3A", textFaint: "#C9A84C",
    accent: "#C9A84C", danger: "#8B1A1A",
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

// ── DB ──────────────────────────────────────
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

// ── MANUAL MODAL ─────────────────────────────
function ManualModal({ onClose }) {
  const sections = [
    { title: "Getting Started", content: "Create an account with a username and password — no email needed. Create up to 4 profiles per account." },
    { title: "Adding Titles", content: "Tap '+ Add title' or '+ Add book'. Enter the title, pick a section and genre, and optionally add a description." },
    { title: "Tracking Progress", content: "Tap the status dot to cycle: To Watch → Watching → Watched (or To Read → Reading → Read)." },
    { title: "Ratings", content: "Once something is marked Watched/Read, a Rate button appears. Rate 1–5 stars." },
    { title: "Editing Entries", content: "Tap ✎ to edit section, genre tags (up to 3), notes, and author. Tap a title to expand and see its description." },
    { title: "Themes", content: "From the profile selection screen, tap 🎨 under any profile to change its colour theme." },
    { title: "Switching Profiles", content: "Tap ⇄ Switch in the header to jump between profiles or manage them." },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "88vh", display: "flex", flexDirection: "column", fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ color: "#E0D4FF", fontSize: "1.1rem", fontWeight: "bold" }}>✦ How to use Lists</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8888BB", fontSize: "1.3rem", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: "1rem 1.5rem 1.5rem" }}>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: "1.2rem" }}>
              <div style={{ color: "#C9B8FF", fontSize: "0.78rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>{s.title}</div>
              <div style={{ color: "#B0A0CC", fontSize: "0.85rem", lineHeight: 1.6 }}>{s.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AUTH PAGE ────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode]     = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const fakeEmail = u => `${u.toLowerCase().replace(/[^a-z0-9]/g, "")}@lists.app`;

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

  const inp = { width: "100%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, color: "#F0EAD6", padding: "0.7rem 1rem", fontSize: "0.95rem", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", backgroundImage: "url('/Icon.png')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Georgia, serif", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,20,0.62)", backdropFilter: "blur(1px)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {showManual && <ManualModal onClose={() => setShowManual(false)} />}
        <div style={{ color: "#F0EAD6", fontSize: "2.2rem", marginBottom: "0.3rem", letterSpacing: "0.08em", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>✦ Lists</div>
        <div style={{ maxWidth: 300, textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ color: "rgba(220,210,255,0.85)", fontSize: "0.82rem", lineHeight: 1.6 }}>Your personal watch list and reading tracker — organised, tracked, and rated.</div>
          <button onClick={() => setShowManual(true)} style={{ background: "transparent", border: "none", color: "rgba(160,180,255,0.85)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", marginTop: "0.5rem" }}>How does it work? →</button>
        </div>
        <div style={{ color: "rgba(200,195,230,0.8)", fontSize: "0.75rem", marginBottom: "1.5rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>{mode === "login" ? "Welcome back" : "Create account"}</div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" onKeyDown={e => e.key === "Enter" && handle()} style={inp} autoCapitalize="none" autoCorrect="off" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
          {error && <div style={{ color: "#FF9999", fontSize: "0.8rem", textAlign: "center" }}>{error}</div>}
          <button onClick={handle} disabled={loading} style={{ background: "rgba(90,62,166,0.85)", border: "1px solid rgba(160,130,220,0.4)", borderRadius: 8, color: "#fff", padding: "0.75rem", fontSize: "0.95rem", fontFamily: "Georgia, serif", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", opacity: loading ? 0.7 : 1 }}>
            {loading ? "…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
          <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); }} style={{ background: "transparent", border: "none", color: "rgba(160,160,200,0.85)", fontSize: "0.82rem", fontFamily: "Georgia, serif", cursor: "pointer", textDecoration: "underline" }}>
            {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </div>
        <div style={{ color: "rgba(120,120,160,0.75)", fontSize: "0.68rem", marginTop: "2.5rem", textAlign: "center" }}>No email required.</div>
      </div>
    </div>
  );
}

// ── STAR RATING ──────────────────────────────
function StarRating({ value, onChange, theme: T }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", padding: "0 0.05rem", lineHeight: 1, color: n <= (hovered||value) ? T.accent : T.borderLight, transform: n <= (hovered||value) ? "scale(1.2)" : "scale(1)", transition: "all 0.1s" }}
          title={RATING_LABELS[n]}>★</button>
      ))}
      {(hovered||value) > 0 && <span style={{ fontSize: "0.75rem", color: T.textMuted, marginLeft: "0.4rem" }}>{RATING_EMOJIS_MAP[hovered||value]} {RATING_LABELS[hovered||value]}</span>}
    </div>
  );
}

// ── RATING MODAL ─────────────────────────────
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

// ── EDIT MODAL ───────────────────────────────
function EditModal({ item, sections, onSave, onClose, theme: T, listType }) {
  const sectionKeys = Object.keys(sections);
  const [section, setSection] = useState(item.section || sectionKeys[0]);
  const [selectedGenres, setSelectedGenres] = useState(item.genres?.length ? item.genres : item.genre ? [item.genre] : ["Other"]);
  const [notes, setNotes] = useState(item.notes || "");
  const [author, setAuthor] = useState(item.author || "");
  const availableGenres = sections[section]?.genres || ["Other"];
  const toggleGenre = g => setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 3 ? [...prev, g] : prev);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1.5rem", maxWidth: 400, width: "100%", fontFamily: T.font, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: T.textMuted, marginBottom: "0.3rem" }}>Edit entry</div>
        <div style={{ fontSize: "1rem", color: T.text, fontFamily: T.headerFont, marginBottom: "1.2rem", lineHeight: 1.3 }}>{item.title}</div>
        {listType === "read" && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, display: "block", marginBottom: "0.4rem" }}>Author</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name…" style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: T.font, outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, display: "block", marginBottom: "0.4rem" }}>Section</label>
          <select value={section} onChange={e => { setSection(e.target.value); setSelectedGenres(["Other"]); }} style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: T.font, outline: "none" }}>
            {sectionKeys.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, display: "block", marginBottom: "0.4rem" }}>Genres <span style={{ color: T.textFaint, textTransform: "none", letterSpacing: 0 }}>(up to 3)</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {availableGenres.map(g => (
              <button key={g} onClick={() => toggleGenre(g)} style={{ background: selectedGenres.includes(g) ? T.accent : T.sectionBg, border: `1px solid ${selectedGenres.includes(g) ? T.accent : T.border}`, borderRadius: 20, color: selectedGenres.includes(g) ? "#fff" : T.textMid, padding: "0.22rem 0.65rem", fontSize: "0.75rem", fontFamily: T.font, cursor: "pointer", transition: "all 0.12s" }}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "1.3rem" }}>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, display: "block", marginBottom: "0.4rem" }}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: T.font, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, padding: "0.4rem 1rem", fontSize: "0.82rem", fontFamily: T.font, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSave({ section, genres: selectedGenres, genre: selectedGenres[0], notes, author }); onClose(); }} style={{ background: T.accent, border: "none", borderRadius: 6, color: "#fff", padding: "0.4rem 1.2rem", fontSize: "0.82rem", fontFamily: T.font, cursor: "pointer", fontWeight: "bold" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── ITEM ROW ─────────────────────────────────
function ItemRow({ item, onCycle, onRemove, onRateRequest, onEdit, theme: T, isArchive }) {
  const [expanded, setExpanded] = useState(false);

  const done = item.status === "watched" || item.status === "read";
  const wip  = item.status === "watching" || item.status === "reading";
  const genreList = item.genres?.length ? item.genres : item.genre ? [item.genre] : [];

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${done ? T.borderLight : T.border}`, borderRadius: 7, marginBottom: "0.25rem", overflow: "hidden", opacity: done ? 0.68 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.42rem 0.75rem" }}>
        <button onClick={() => !isArchive && onCycle(item.id)}
          style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, border: "none", cursor: isArchive ? "default" : "pointer", background: done ? T.accent : wip ? T.textMid : T.borderLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4rem", color: "#fff", fontWeight: "bold", transition: "transform 0.15s" }}
          onMouseEnter={e => { if (!isArchive) e.currentTarget.style.transform = "scale(1.25)"; }}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >{done ? "✓" : wip ? "▶" : ""}</button>

        <button onClick={() => setExpanded(e => !e)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0.3rem", lineHeight: 1.3 }}>
            <span style={{ fontSize: "0.85rem", color: done ? T.textMuted : T.text, textDecoration: done ? "line-through" : "none", fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{item.title}</span>
            {item.author && <span style={{ fontSize: "0.65rem", color: T.textMuted, fontStyle: "italic", whiteSpace: "nowrap" }}>by {item.author}</span>}
            {genreList.map(g => <span key={g} style={{ fontSize: "0.56rem", background: T.sectionBg, border: `1px solid ${T.sectionBorder}`, borderRadius: 10, color: T.textMuted, padding: "0.06rem 0.38rem", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{g}</span>)}
          </div>
        </button>

        {done && item.rating > 0 && <span style={{ fontSize: "0.65rem", color: T.accent, letterSpacing: 1, flexShrink: 0 }}>{"★".repeat(item.rating)}</span>}
        {done && item.rating === 0 && <button onClick={() => onRateRequest(item)} style={{ background: "transparent", border: `1px solid ${T.borderLight}`, borderRadius: 4, color: T.textMuted, padding: "0.1rem 0.38rem", fontSize: "0.6rem", fontFamily: T.font, cursor: "pointer", flexShrink: 0 }}>Rate</button>}
        <button onClick={() => onEdit(item)} style={{ background: "transparent", border: "none", color: T.textFaint, cursor: "pointer", fontSize: "0.75rem", flexShrink: 0, lineHeight: 1, padding: "0 0.08rem", transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textFaint} title="Edit">✎</button>
        <button onClick={() => onRemove(item.id)} style={{ background: "transparent", border: "none", color: T.borderLight, cursor: "pointer", fontSize: "0.9rem", flexShrink: 0, lineHeight: 1, padding: "0 0.08rem", transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = T.danger} onMouseLeave={e => e.currentTarget.style.color = T.borderLight}>×</button>
      </div>
      {expanded && (
        <div style={{ padding: "0 0.75rem 0.65rem", borderTop: `1px solid ${T.borderLight}` }}>
          {item.notes && <div style={{ fontSize: "0.7rem", color: T.textMuted, marginTop: "0.4rem", fontStyle: "italic" }}>{item.notes}</div>}
          <div style={{ fontSize: "0.75rem", color: T.textMid, marginTop: "0.4rem", lineHeight: 1.55 }}>
            {item.desc || <span style={{ color: T.textFaint }}>No description.</span>}
          </div>
          {!isArchive && (
            <button onClick={() => onCycle(item.id)} style={{ marginTop: "0.55rem", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMid, padding: "0.22rem 0.6rem", fontSize: "0.7rem", fontFamily: T.font, cursor: "pointer" }}>
              {wip ? "✓ Mark as done" : done ? "↩ Move back" : "▶ Mark in progress"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── GENRE SECTION ────────────────────────────
function GenreSection({ genre, items, onCycle, onRemove, onRateRequest, onEdit, theme: T, isArchive }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => (b.rating||0) - (a.rating||0) || b.added - a.added);
  return (
    <div style={{ marginBottom: "0.4rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: "transparent", border: "none", cursor: "pointer", padding: "0.22rem 0", textAlign: "left" }}>
        <span style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.1em", color: T.textMuted, fontFamily: T.font }}>{genre}</span>
        <span style={{ flex: 1, height: 1, background: T.borderLight }} />
        <span style={{ fontSize: "0.58rem", color: T.textFaint }}>{items.length} {open ? "▲" : "▼"}</span>
      </button>
      {open && sorted.map(item => <ItemRow key={item.id} item={item} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} theme={T} isArchive={isArchive} />)}
    </div>
  );
}

// ── MAIN SECTION ─────────────────────────────
function MainSection({ sectionKey, sectionDef, items, onCycle, onRemove, onRateRequest, onEdit, theme: T, search, statusFilter, isArchive }) {
  const [open, setOpen] = useState(false);
  const filtered = items.filter(i => i.section === sectionKey && i.status === statusFilter && (i.title.toLowerCase().includes(search.toLowerCase()) || (i.author && i.author.toLowerCase().includes(search.toLowerCase()))));
  if (filtered.length === 0) return null;
  const byGenre = {};
  sectionDef.genres.forEach(g => { byGenre[g] = []; });
  filtered.forEach(i => { const pg = (i.genres?.length ? i.genres : i.genre ? [i.genre] : ["Other"])[0] || "Other"; if (!byGenre[pg]) byGenre[pg] = []; byGenre[pg].push(i); });
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: T.sectionBg, border: `1px solid ${T.sectionBorder}`, borderRadius: 6, padding: "0.42rem 0.75rem", cursor: "pointer", marginBottom: open ? "0.4rem" : 0 }}>
        <span style={{ fontSize: "0.9rem" }}>{sectionDef.icon}</span>
        <span style={{ fontSize: "0.82rem", fontFamily: T.headerFont, color: T.text, fontWeight: "bold" }}>{sectionKey}</span>
        <span style={{ fontSize: "0.67rem", color: T.textMuted }}>({filtered.length})</span>
        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: T.textMuted }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ paddingLeft: "0.35rem" }}>{sectionDef.genres.map(g => <GenreSection key={g} genre={g} items={byGenre[g]||[]} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onEdit={onEdit} theme={T} isArchive={isArchive} />)}</div>}
    </div>
  );
}

// ── ADD FORM ─────────────────────────────────
function AddForm({ sections, onAdd, onClose, theme: T, listType }) {
  const sectionKeys = Object.keys(sections);
  const [title, setTitle]             = useState("");
  const [author, setAuthor]           = useState("");
  const [desc, setDesc]               = useState("");
  const [section, setSection]         = useState(sectionKeys[0]);
  const [selectedGenres, setSelectedGenres] = useState(["Other"]);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const availableGenres = sections[section]?.genres || ["Other"];

  const handleSectionChange = val => {
    setSection(val);
    setSelectedGenres(["Other"]);
  };

  const toggleGenre = g => setSelectedGenres(prev =>
    prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 3 ? [...prev, g] : prev
  );

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      author: author.trim(),
      desc: desc.trim(),
      section,
      genres: selectedGenres,
      genre: selectedGenres[0] || "Other",
    });
  };

  const fieldStyle = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${T.border}`,
    color: T.text,
    padding: "0.35rem 0",
    fontSize: "0.88rem",
    fontFamily: T.font,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "0.68rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: T.textMuted,
    display: "block",
    marginBottom: "0.35rem",
  };

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>

      {/* Title */}
      <div style={{ marginBottom: "0.85rem" }}>
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && title.trim()) handleAdd(); if (e.key === "Escape") onClose(); }}
          placeholder={listType === "watch" ? "Title…" : "Title…"}
          style={{ ...fieldStyle, fontSize: "1rem" }}
        />
      </div>

      {/* Author (read only) */}
      {listType === "read" && (
        <div style={{ marginBottom: "0.85rem" }}>
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            style={{ ...fieldStyle, fontStyle: "italic" }}
          />
        </div>
      )}

      {/* Description */}
      <div style={{ marginBottom: "0.85rem" }}>
        <label style={labelStyle}>Description <span style={{ color: T.textFaint, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="A short description…"
          rows={2}
          style={{
            ...fieldStyle,
            borderBottom: "none",
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "0.4rem 0.6rem",
            resize: "vertical",
            background: T.bgInput,
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Section */}
      <div style={{ marginBottom: "0.85rem" }}>
        <label style={labelStyle}>Section</label>
        <select
          value={section}
          onChange={e => handleSectionChange(e.target.value)}
          style={{
            width: "100%",
            background: T.bgInput,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            color: T.text,
            padding: "0.4rem 0.6rem",
            fontSize: "0.85rem",
            fontFamily: T.font,
            outline: "none",
          }}
        >
          {sectionKeys.map(s => <option key={s} value={s}>{sections[s].icon} {s}</option>)}
        </select>
      </div>

      {/* Genres */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>Genre <span style={{ color: T.textFaint, textTransform: "none", letterSpacing: 0 }}>(up to 3)</span></label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {availableGenres.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              style={{
                background: selectedGenres.includes(g) ? T.accent : T.sectionBg,
                border: `1px solid ${selectedGenres.includes(g) ? T.accent : T.border}`,
                borderRadius: 20,
                color: selectedGenres.includes(g) ? "#fff" : T.textMid,
                padding: "0.22rem 0.65rem",
                fontSize: "0.75rem",
                fontFamily: T.font,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >{g}</button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5, color: T.textMuted, padding: "0.3rem 0.85rem", fontSize: "0.8rem", fontFamily: T.font, cursor: "pointer" }}>Cancel</button>
        <button onClick={handleAdd} disabled={!title.trim()} style={{ background: T.accent, border: "none", borderRadius: 5, color: "#fff", padding: "0.3rem 0.95rem", fontSize: "0.8rem", fontFamily: T.font, cursor: !title.trim() ? "not-allowed" : "pointer", fontWeight: "bold", opacity: !title.trim() ? 0.6 : 1 }}>Add</button>
      </div>
    </div>
  );
}

// ── LIST PAGE ────────────────────────────────
function ListPage({ userId, listType, sections, theme: T, profileName }) {
  const todoStatus = listType === "watch" ? "unwatched" : "unread";
  const wipStatus  = listType === "watch" ? "watching"  : "reading";
  const doneStatus = listType === "watch" ? "watched"   : "read";

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [subTab, setSubTab]     = useState("list");
  const [search, setSearch]     = useState("");
  const [adding, setAdding]     = useState(false);
  const [ratingItem, setRatingItem]   = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    dbGetItems(userId, listType).then(data => { setItems(data); setLoading(false); });
  }, [userId, listType]);

  const cycleStatus = useCallback(async (id) => {
    const order = [todoStatus, wipStatus, doneStatus];
    let updated = null;
    setItems(prev => prev.map(item => { if (item.id !== id) return item; updated = { ...item, status: order[(order.indexOf(item.status)+1)%order.length] }; return updated; }));
    if (updated) await dbUpdateItem(userId, updated, listType);
  }, [userId, listType, todoStatus, wipStatus, doneStatus]);

  const removeItem = useCallback(async (id) => {
    await dbDeleteItem(userId, id, listType);
    setItems(prev => prev.filter(i => i.id !== id));
  }, [userId, listType]);

  const addItem = async ({ title, section, genres, genre, desc, author }) => {
    const id = Date.now();
    const newItem = {
      id, title, section,
      genre: genre || genres?.[0] || "Other",
      genres: genres || [],
      notes: "",
      status: todoStatus,
      added: id,
      desc: desc || "",
      rating: 0,
      _listType: listType,
      author: author || "",
    };
    await dbAddItem(userId, newItem, listType);
    setItems(prev => [newItem, ...prev]);
    setAdding(false);
  };

  const rateItem = useCallback(async (id, rating) => {
    let updated = null;
    setItems(prev => prev.map(i => { if (i.id !== id) return i; updated = { ...i, rating }; return updated; }));
    if (updated) await dbUpdateItem(userId, updated, listType);
  }, [userId, listType]);

  const saveEdit = useCallback(async (id, changes) => {
    let updated = null;
    setItems(prev => prev.map(i => { if (i.id !== id) return i; updated = { ...i, ...changes }; return updated; }));
    if (updated) await dbUpdateItem(userId, updated, listType);
  }, [userId, listType]);

  const todoCount = items.filter(i => i.status === todoStatus).length;
  const wipCount  = items.filter(i => i.status === wipStatus).length;
  const doneCount = items.filter(i => i.status === doneStatus).length;

  const subTabs = [
    { key: "list", label: listType === "watch" ? "To Watch" : "To Read",  count: todoCount },
    { key: "wip",  label: listType === "watch" ? "Watching"  : "Reading", count: wipCount },
    { key: "done", label: listType === "watch" ? "Watched"   : "Read",    count: doneCount },
  ];

  if (loading) return <div style={{ color: T.textFaint, padding: "2rem 0", textAlign: "center" }}>Loading…</div>;

  return (
    <div>
      {/* Card-style sub-tabs */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginBottom: "1rem", borderBottom: `1px solid ${T.border}` }}>
        {subTabs.map(t => {
          const active = subTab === t.key;
          return (
            <button key={t.key} onClick={() => { setSubTab(t.key); setSearch(""); }}
              style={{
                background: active ? T.bg : T.sectionBg,
                border: `1px solid ${T.border}`,
                borderBottom: active ? `1px solid ${T.bg}` : `1px solid ${T.border}`,
                borderRadius: "5px 5px 0 0",
                color: active ? T.accent : T.textMuted,
                padding: "0.32rem 0.85rem",
                fontSize: "0.74rem",
                fontFamily: T.font,
                cursor: "pointer",
                fontWeight: active ? "bold" : "normal",
                position: "relative",
                bottom: -1,
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}>
              {t.label}{t.count > 0 && <span style={{ opacity: 0.6, fontSize: "0.66rem", marginLeft: "0.2rem" }}>({t.count})</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "0.85rem" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "0.35rem 0.65rem", fontSize: "0.82rem", fontFamily: T.font, outline: "none", boxSizing: "border-box" }} />
      </div>

      {subTab === "list" && (
        <>
          {adding
            ? <AddForm sections={sections} onAdd={addItem} onClose={() => setAdding(false)} theme={T} listType={listType} />
            : <button onClick={() => setAdding(true)} style={{ width: "100%", background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 7, color: T.textMuted, padding: "0.6rem", fontSize: "0.83rem", fontFamily: T.font, cursor: "pointer", marginBottom: "0.85rem" }}>
                + Add {listType === "watch" ? "title" : "book"}
              </button>
          }
          {Object.entries(sections).map(([key, def]) => <MainSection key={key} sectionKey={key} sectionDef={def} items={items} onCycle={cycleStatus} onRemove={removeItem} onRateRequest={setRatingItem} onEdit={setEditingItem} theme={T} search={search} statusFilter={todoStatus} isArchive={false} />)}
        </>
      )}

      {subTab === "wip" && (
        <>
          {Object.entries(sections).map(([key, def]) => <MainSection key={key} sectionKey={key} sectionDef={def} items={items} onCycle={cycleStatus} onRemove={removeItem} onRateRequest={setRatingItem} onEdit={setEditingItem} theme={T} search={search} statusFilter={wipStatus} isArchive={false} />)}
          {items.filter(i => i.status === wipStatus).length === 0 && <div style={{ color: T.textFaint, fontSize: "0.85rem", padding: "2.5rem 0", textAlign: "center" }}>Nothing {listType === "watch" ? "being watched" : "being read"} right now.</div>}
        </>
      )}

      {subTab === "done" && (
        <>
          {Object.entries(sections).map(([key, def]) => <MainSection key={key} sectionKey={key} sectionDef={def} items={items} onCycle={cycleStatus} onRemove={removeItem} onRateRequest={setRatingItem} onEdit={setEditingItem} theme={T} search={search} statusFilter={doneStatus} isArchive={true} />)}
          {items.filter(i => i.status === doneStatus).length === 0 && <div style={{ color: T.textFaint, fontSize: "0.85rem", padding: "2.5rem 0", textAlign: "center" }}>Nothing {listType === "watch" ? "watched" : "read"} yet.</div>}
        </>
      )}

      {ratingItem && <RatingModal item={ratingItem} onRate={r => rateItem(ratingItem.id, r)} onClose={() => setRatingItem(null)} theme={T} />}
      {editingItem && <EditModal item={editingItem} sections={sections} onSave={changes => saveEdit(editingItem.id, changes)} onClose={() => setEditingItem(null)} theme={T} listType={listType} />}
    </div>
  );
}

// ── PROFILE SELECT ───────────────────────────
function ProfileSelectPage({ profiles, onSelect, onAdd, onRemove, onThemeChange, onLogout }) {
  const [newName, setNewName]             = useState("");
  const [addingProfile, setAddingProfile] = useState(false);
  const [editingTheme, setEditingTheme]   = useState(null);
  const [showManual, setShowManual]       = useState(false);
  const inputRef = useRef(null);

  return (
    <div style={{ minHeight: "100vh", backgroundImage: "url('/Icon.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Georgia, serif", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,20,0.60)", backdropFilter: "blur(1px)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        {showManual && <ManualModal onClose={() => setShowManual(false)} />}
        <div style={{ color: "#E0D4FF", fontSize: "2rem", marginBottom: "0.3rem", letterSpacing: "0.08em" }}>✦ Lists</div>
        <div style={{ color: "rgba(180,175,220,0.8)", fontSize: "0.78rem", marginBottom: "3rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Who's watching?</div>

        <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}>
          {profiles.map(u => {
            const Th = THEMES[u.theme] || THEMES.beautyandthebeast;
            return (
              <div key={u.id} style={{ position: "relative" }}>
                <button onClick={() => onSelect(u.id)}
                  style={{ width: 130, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, padding: "1.5rem 1rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: Th.bgHeader, border: `2px solid ${Th.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{u.avatar}</div>
                  <div style={{ color: "#E0D4FF", fontSize: "0.88rem" }}>{u.name}</div>
                  <div style={{ color: "rgba(180,175,220,0.75)", fontSize: "0.62rem", letterSpacing: "0.08em" }}>{Th.emoji} {Th.name.split(" ").slice(0,2).join(" ")}</div>
                </button>
                <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", marginTop: "0.5rem" }}>
                  <button onClick={() => setEditingTheme(editingTheme === u.id ? null : u.id)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 4, color: "rgba(180,175,220,0.8)", fontSize: "0.6rem", padding: "0.18rem 0.45rem", cursor: "pointer" }}>🎨</button>
                  {profiles.length > 1 && <button onClick={() => onRemove(u.id)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#886666", fontSize: "0.6rem", padding: "0.18rem 0.45rem", cursor: "pointer" }}>✕</button>}
                </div>
                {editingTheme === u.id && (
                  <div style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "0.75rem", zIndex: 50, width: 210 }}>
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
            <button onClick={() => setAddingProfile(true)}
              style={{ width: 130, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 14, padding: "1.5rem 1rem", cursor: "pointer", color: "rgba(160,155,200,0.8)", fontSize: "0.82rem", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}>
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
                <button onClick={() => setAddingProfile(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, color: "rgba(150,145,190,0.8)", padding: "0.25rem 0.6rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "Georgia, serif" }}>✕</button>
                <button onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); setAddingProfile(false); } }} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, color: "#E0D4FF", padding: "0.25rem 0.7rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "Georgia, serif" }}>Add</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "rgba(180,175,220,0.85)", padding: "0.4rem 1.2rem", fontSize: "0.78rem", fontFamily: "Georgia, serif", cursor: "pointer" }}>Log out</button>
          <button onClick={() => setShowManual(true)} style={{ background: "transparent", border: "none", color: "rgba(160,180,255,0.85)", fontSize: "0.75rem", fontFamily: "Georgia, serif", cursor: "pointer", textDecoration: "underline" }}>Help / Manual</button>
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ─────────────────────────────────
export default function App() {
  const [authUser, setAuthUser]           = useState(undefined);
  const [profiles, setProfiles]           = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [mainTab, setMainTab]             = useState("watch");
  const [showSwitch, setShowSwitch]       = useState(false);
  const [showManual, setShowManual]       = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAuthUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (authUser) dbGetProfiles(authUser.id).then(setProfiles); }, [authUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null); setProfiles([]); setActiveProfile(null);
  };

  if (authUser === undefined) return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", color: "#8888BB", fontFamily: "Georgia, serif" }}>Loading…</div>
  );

  if (!authUser) return <AuthPage onAuth={setAuthUser} />;

  if (!activeProfile || !profiles.find(p => p.id === activeProfile)) {
    return (
      <ProfileSelectPage
        profiles={profiles}
        onSelect={id => { setActiveProfile(id); setMainTab("watch"); }}
        onAdd={async (name) => {
          const used = profiles.map(p => p.avatar);
          const avatar = AVATAR_EMOJIS.find(e => !used.includes(e)) || "⭐";
          const theme = Object.keys(THEMES)[profiles.length % Object.keys(THEMES).length];
          const id = `profile-${Date.now()}`;
          const np = { id, name, avatar, theme };
          await dbSaveProfile(np, authUser.id);
          setProfiles(prev => [...prev, np]);
        }}
        onRemove={async (id) => { await dbDeleteProfile(id); setProfiles(prev => prev.filter(p => p.id !== id)); }}
        onThemeChange={async (id, theme) => {
          setProfiles(prev => prev.map(p => { if (p.id !== id) return p; const u = { ...p, theme }; dbSaveProfile(u, authUser.id); return u; }));
        }}
        onLogout={handleLogout}
      />
    );
  }

  const profile = profiles.find(p => p.id === activeProfile);
  const T = THEMES[profile.theme] || THEMES.beautyandthebeast;

  const mainTabs = [
    { key: "watch", emoji: "🎬", label: "Watch" },
    { key: "read",  emoji: "📚", label: "Read" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text, display: "flex", flexDirection: "column" }}>
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      <div style={{
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
        padding: "0.55rem 0 0 1rem",
        position: "sticky",
        top: 0,
        zIndex: 20,
        flexShrink: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        {/* Left: avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.45rem" }}>
          <span style={{ fontSize: "1.05rem" }}>{profile.avatar}</span>
          <span style={{ fontSize: "0.88rem", fontFamily: T.headerFont, color: T.text, fontWeight: "bold", letterSpacing: "0.04em" }}>{profile.name}'s Lists</span>
        </div>

        {/* Right: binder tabs + utility buttons */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", paddingBottom: "0.45rem", marginRight: "0.5rem" }}>
            <button onClick={() => setShowManual(true)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5, color: T.textMuted, padding: "0.18rem 0.42rem", fontSize: "0.62rem", fontFamily: T.font, cursor: "pointer" }}>?</button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowSwitch(s => !s)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5, padding: "0.18rem 0.55rem", fontSize: "0.62rem", fontFamily: T.font, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.22rem" }}>
                <span>⇄</span><span>Switch</span>
              </button>
              {showSwitch && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 0.4rem)", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.5rem", zIndex: 100, minWidth: 160, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                  {profiles.map(p => (
                    <button key={p.id} onClick={() => { setActiveProfile(p.id); setShowSwitch(false); setMainTab("watch"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: p.id === activeProfile ? T.sectionBg : "transparent", border: "none", borderRadius: 6, padding: "0.42rem 0.6rem", cursor: "pointer", color: T.text, fontSize: "0.82rem", fontFamily: T.font, marginBottom: "0.12rem" }}>
                      <span>{p.avatar}</span><span>{p.name}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: `1px solid ${T.borderLight}`, marginTop: "0.3rem", paddingTop: "0.3rem" }}>
                    <button onClick={() => { setActiveProfile(null); setShowSwitch(false); }} style={{ width: "100%", background: "transparent", border: "none", borderRadius: 6, padding: "0.38rem 0.6rem", cursor: "pointer", color: T.textMuted, fontSize: "0.73rem", fontFamily: T.font, textAlign: "left" }}>👥 Manage profiles</button>
                    <button onClick={() => { handleLogout(); setShowSwitch(false); }} style={{ width: "100%", background: "transparent", border: "none", borderRadius: 6, padding: "0.38rem 0.6rem", cursor: "pointer", color: T.textMuted, fontSize: "0.73rem", fontFamily: T.font, textAlign: "left" }}>🚪 Log out</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {mainTabs.map(t => {
            const active = mainTab === t.key;
            return (
              <button key={t.key} onClick={() => setMainTab(t.key)} title={t.label}
                style={{
                  height: 52,
                  width: 46,
                  marginBottom: active ? -1 : -1,
                  background: active ? T.bg : T.sectionBg,
                  border: `1px solid ${T.border}`,
                  borderBottom: active ? `1px solid ${T.bg}` : `1px solid ${T.border}`,
                  borderRadius: "6px 6px 0 0",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  marginLeft: 2,
                  transition: "all 0.13s",
                  position: "relative",
                  zIndex: active ? 5 : 2,
                  paddingTop: active ? 0 : 3,
                  boxShadow: active ? "0 -2px 6px rgba(0,0,0,0.08)" : "none",
                }}>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>{t.emoji}</span>
                <span style={{
                  fontSize: "0.44rem",
                  fontFamily: T.font,
                  letterSpacing: "0.05em",
                  color: active ? T.accent : T.textMuted,
                  textTransform: "uppercase",
                  fontWeight: active ? "bold" : "normal",
                }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1rem 4rem 1rem" }}>
        {mainTab === "watch" && <ListPage key={`w-${profile.id}`} userId={profile.id} listType="watch" sections={WATCH_SECTIONS} theme={T} profileName={profile.name} />}
        {mainTab === "read"  && <ListPage key={`r-${profile.id}`} userId={profile.id} listType="read"  sections={READ_SECTIONS}  theme={T} profileName={profile.name} />}
      </div>

      {showSwitch && <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setShowSwitch(false)} />}
    </div>
  );
}
