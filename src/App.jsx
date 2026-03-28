import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─────────────────────────────────────────────
// THEMES & TAXONOMIES (Keeping your logic)
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
// DATA & CLAUDE HELPERS (Same as your logic)
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

async function callClaude(prompt, maxTokens = 100) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
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
// UI COMPONENTS
// ─────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState("login");
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
      const { data: existing } = await supabase.from("accounts").select("id").eq("username", username.trim().toLowerCase()).maybeSingle();
      if (existing) { setError("That username is already taken."); setLoading(false); return; }

      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }

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
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={inp} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inp} />
        {error && <div style={{ color: "#FF8888", fontSize: "0.8rem", textAlign: "center" }}>{error}</div>}
        <button onClick={handle} style={{ background: "#5A3EA6", color: "#fff", padding: "0.75rem", borderRadius: 8, border: "none", cursor: "pointer" }}>{loading ? "…" : mode === "login" ? "Log In" : "Create"}</button>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "transparent", border: "none", color: "#8888BB", textDecoration: "underline", cursor: "pointer" }}>{mode === "login" ? "Switch to Signup" : "Switch to Login"}</button>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, theme: T }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: n <= (hovered || value) ? T.accent : T.borderLight }}>★</button>
      ))}
    </div>
  );
}

function RatingModal({ item, onRate, onClose, theme: T }) {
  const [rating, setRating] = useState(item.rating || 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1.6rem", width: 360 }}>
        <div style={{ color: T.text, marginBottom: "1rem" }}>Rate: {item.title}</div>
        <StarRating value={rating} onChange={setRating} theme={T} />
        <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", color: T.textMuted, border: `1px solid ${T.border}`, padding: "0.5rem" }}>Cancel</button>
          <button onClick={() => { onRate(rating); onClose(); }} style={{ flex: 1, background: T.accent, color: "#fff", border: "none", padding: "0.5rem" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ item, sections, onSave, onClose, theme: T }) {
  const sectionKeys = Object.keys(sections);
  const [section, setSection] = useState(item.section || sectionKeys[0]);
  const [selectedGenres, setSelectedGenres] = useState(item.genres || []);
  const [notes, setNotes] = useState(item.notes || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1.5rem", width: 400 }}>
        <h3 style={{ color: T.text }}>Edit Entry</h3>
        <select value={section} onChange={e => setSection(e.target.value)} style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}>
          {sectionKeys.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", padding: "0.5rem", minHeight: "80px" }} />
        <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` }}>Cancel</button>
          <button onClick={() => onSave({ section, notes, genres: selectedGenres })} style={{ flex: 1, background: T.accent, color: "#fff" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, onCycle, onRemove, onRateRequest, onEdit, onDescUpdate, theme: T, isArchive }) {
  const [expanded, setExpanded] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);

  const handleExpand = async () => {
    setExpanded(!expanded);
    if (!item.desc && !expanded) {
      setLoadingDesc(true);
      const res = await callClaude(`One sentence summary of ${item.title}`);
      onDescUpdate(item.id, res);
      setLoadingDesc(false);
    }
  };

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.5rem", marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={() => onCycle(item.id)} style={{ cursor: "pointer" }}>{item.status === 'watched' || item.status === 'read' ? '✓' : '○'}</button>
        <div onClick={handleExpand} style={{ flex: 1, color: T.text, cursor: "pointer" }}>{item.title}</div>
        <button onClick={() => onEdit(item)}>✎</button>
        <button onClick={() => onRemove(item.id)}>×</button>
      </div>
      {expanded && <div style={{ color: T.textMid, fontSize: "0.8rem", marginTop: "5px" }}>{loadingDesc ? "..." : item.desc}</div>}
    </div>
  );
}

function ListPage({ userId, listType, sections, theme: T }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [ratingItem, setRatingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    dbGetItems(userId, listType).then(res => { setItems(res); setLoading(false); });
  }, [userId, listType]);

  const onCycle = async (id) => {
    const item = items.find(i => i.id === id);
    const nextStatus = item.status.startsWith('un') ? (listType === 'watch' ? 'watching' : 'reading') : (listType === 'watch' ? 'watched' : 'read');
    const updated = { ...item, status: nextStatus };
    setItems(items.map(i => i.id === id ? updated : i));
    await dbUpdateItem(userId, updated, listType);
  };

  const onDescUpdate = async (id, desc) => {
    const item = items.find(i => i.id === id);
    const updated = { ...item, desc };
    setItems(items.map(i => i.id === id ? updated : i));
    await dbUpdateItem(userId, updated, listType);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "10px", marginBottom: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "8px" }}>+ Add Item</button>
      {items.map(item => (
        <ItemRow key={item.id} item={item} onCycle={onCycle} onRemove={() => {}} onEdit={setEditingItem} onDescUpdate={onDescUpdate} theme={T} />
      ))}
      {ratingItem && <RatingModal item={ratingItem} onRate={() => {}} onClose={() => setRatingItem(null)} theme={T} />}
      {editingItem && <EditModal item={editingItem} sections={sections} onSave={() => setEditingItem(null)} onClose={() => setEditingItem(null)} theme={T} />}
    </div>
  );
}

function SuggestionsPage({ userId, theme: T }) {
  return <div style={{ color: T.text }}>Suggestions coming soon!</div>;
}

function ProfileSelectPage({ profiles, onSelect, onAdd, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1 style={{ color: "#fff" }}>Who's Lists?</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        {profiles.map(p => (
          <div key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: "pointer", textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: "3rem" }}>{p.avatar}</div>
            <div>{p.name}</div>
          </div>
        ))}
        <button onClick={() => onAdd(prompt("Name?"))} style={{ padding: "10px" }}>+</button>
      </div>
      <button onClick={onLogout} style={{ marginTop: "20px", color: "#888" }}>Logout</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP COMPONENT
// ─────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [mainTab, setMainTab] = useState("watch");
  const [showSwitch, setShowSwitch] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setAuthUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authUser) dbGetProfiles(authUser.id).then(setProfiles);
  }, [authUser]);

  if (authUser === undefined) return <div>Loading Auth...</div>;
  if (!authUser) return <AuthPage onAuth={(user) => setAuthUser(user)} />;

  if (!activeProfile) {
    return (
      <ProfileSelectPage 
        profiles={profiles} 
        onSelect={setActiveProfile} 
        onLogout={() => supabase.auth.signOut()}
        onAdd={async (name) => {
          const newP = { id: Date.now().toString(), name, avatar: "🦊", theme: "gilmore" };
          await dbSaveProfile(newP, authUser.id);
          setProfiles([...profiles, newP]);
        }}
      />
    );
  }

  const profile = profiles.find(p => p.id === activeProfile);
  const T = THEMES[profile.theme || "gilmore"];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font }}>
      <header style={{ background: T.bgHeader, padding: "1rem", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{profile.avatar} {profile.name}'s Lists</h2>
          <button onClick={() => setActiveProfile(null)}>Switch</button>
        </div>
        <nav style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
          <button onClick={() => setMainTab("watch")} style={{ color: mainTab === "watch" ? T.accent : T.textMuted }}>Watch</button>
          <button onClick={() => setMainTab("read")} style={{ color: mainTab === "read" ? T.accent : T.textMuted }}>Read</button>
          <button onClick={() => setMainTab("suggest")} style={{ color: mainTab === "suggest" ? T.accent : T.textMuted }}>For You</button>
        </nav>
      </header>

      <main style={{ padding: "1rem", maxWidth: "700px", margin: "0 auto" }}>
        {mainTab === "watch" && <ListPage userId={profile.id} listType="watch" sections={WATCH_SECTIONS} theme={T} />}
        {mainTab === "read" && <ListPage userId={profile.id} listType="read" sections={READ_SECTIONS} theme={T} />}
        {mainTab === "suggest" && <SuggestionsPage userId={profile.id} theme={T} />}
      </main>
    </div>
  );
}
