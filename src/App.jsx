import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// GOOGLE FONTS LOADER
// ─────────────────────────────────────────────
const FONT_URLS = {
  beautyandthebeast: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital@0;1&display=swap",
  toystory:          "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700&display=swap",
  gilmore:           "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital@0;1&display=swap",
  muppets:           "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap",
  agatha:            "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap",
};
function loadFont(themeKey) {
  if (typeof document === "undefined") return;
  const id = "font-" + themeKey;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id; link.rel = "stylesheet"; link.href = FONT_URLS[themeKey];
  document.head.appendChild(link);
}

const THEMES = {
  beautyandthebeast: {
    name: "Beauty and the Beast", emoji: "🌹",
    bg: "#FAF3E0", bgCard: "#FFF9EE", bgHeader: "#1A2560", bgInput: "#FFF9EE",
    border: "#C9A84C", borderLight: "#E8D48A",
    text: "#1A2560", textMid: "#3D4F8A", textMuted: "#8A7A3A", textFaint: "#C9A84C",
    accent: "#B8902A", danger: "#8B1A1A",
    pillOn: "#1A2560", pillOnText: "#FAF3E0", pillOff: "#EDE4C0", pillOffText: "#3D4F8A",
    sectionBg: "#EDE4C0", sectionBorder: "#C9A84C",
    font: "'EB Garamond', Georgia, serif",
    headerFont: "'Cormorant Garamond', 'Palatino Linotype', serif",
  },
  toystory: {
    name: "Toy Story", emoji: "🚀",
    bg: "#D6EEFF", bgCard: "#FFFFFF", bgHeader: "#7B3210", bgInput: "#EEF8FF",
    border: "#1A5276", borderLight: "#A9CCE3",
    text: "#1A2F5A", textMid: "#1A5276", textMuted: "#2E86C1", textFaint: "#85C1E9",
    accent: "#C0392B", danger: "#7B241C",
    pillOn: "#C0392B", pillOnText: "#fff", pillOff: "#D6EAF8", pillOffText: "#1A5276",
    sectionBg: "#FFF9D6", sectionBorder: "#1A5276",
    font: "'Nunito', 'Trebuchet MS', sans-serif",
    headerFont: "'Fredoka One', 'Trebuchet MS', sans-serif",
  },
  gilmore: {
    name: "Gilmore Girls", emoji: "☕",
    bg: "#EEF4FB", bgCard: "#FFFFFF", bgHeader: "#0E2750", bgInput: "#F5F9FF",
    border: "#8CAFD4", borderLight: "#C2D8EE",
    text: "#0E2750", textMid: "#2A5080", textMuted: "#5A8AB0", textFaint: "#A0C0DA",
    accent: "#0E2750", danger: "#8B2020",
    pillOn: "#0E2750", pillOnText: "#EEF4FB", pillOff: "#D8E8F5", pillOffText: "#2A5080",
    sectionBg: "#D8E8F5", sectionBorder: "#8CAFD4",
    font: "'Lora', Georgia, serif",
    headerFont: "'Playfair Display', Georgia, serif",
  },
  muppets: {
    name: "The Muppet Show", emoji: "🎭",
    bg: "#FFFBF0", bgCard: "#FFFFFF", bgHeader: "#2C7A30", bgInput: "#FFFBF0",
    border: "#B82020", borderLight: "#EFA0A0",
    text: "#1A0A00", textMid: "#4A1010", textMuted: "#B82020", textFaint: "#EFA0A0",
    accent: "#B82020", danger: "#7B0000",
    pillOn: "#2C7A30", pillOnText: "#FFFBF0", pillOff: "#FFFBF0", pillOffText: "#2C7A30",
    sectionBg: "#E8F5E9", sectionBorder: "#2C7A30",
    font: "'Merriweather', Georgia, serif",
    headerFont: "'Alfa Slab One', Georgia, serif",
  },
  agatha: {
    name: "Agatha All Along", emoji: "🔮",
    bg: "#F0EDF8", bgCard: "#FAF8FF", bgHeader: "#2A1248", bgInput: "#EDE8F8",
    border: "#6B42B0", borderLight: "#C0A8E8",
    text: "#1A0A2E", textMid: "#3B1F6E", textMuted: "#7E57C2", textFaint: "#C5B3E6",
    accent: "#4A7A4E", danger: "#8B1A1A",
    pillOn: "#2A1248", pillOnText: "#F0EDF8", pillOff: "#DDD8F0", pillOffText: "#3B1F6E",
    sectionBg: "#DDD8F0", sectionBorder: "#6B42B0",
    font: "'Crimson Text', Georgia, serif",
    headerFont: "'Cinzel', 'Palatino Linotype', serif",
  },
};

// ─────────────────────────────────────────────
// TAXONOMIES
// ─────────────────────────────────────────────
const WATCH_SECTIONS = {
  Movies: {
    icon: "🎬",
    genres: ["Horror","Comedy","Rom-Com","Action","Drama","Sci-Fi","Thriller","Fantasy","Family","Animation","Documentary","Other"],
  },
  Shows: {
    icon: "📺",
    genres: ["Horror","Comedy","Drama","Sci-Fi","Thriller","Fantasy","Action","Reality","Anime","Family","Documentary","Other"],
  },
  "Mini-series": {
    icon: "🎞️",
    genres: ["Horror","Comedy","Drama","Thriller","Documentary","True Crime","Other"],
  },
  Documentaries: {
    icon: "🎙️",
    genres: ["True Crime","Nature","History","Social","Music","Sports","Other"],
  },
  Anime: {
    icon: "✨",
    genres: ["Action","Fantasy","Sci-Fi","Romance","Horror","Comedy","Slice of Life","Other"],
  },
};

const READ_SECTIONS = {
  Fiction: {
    icon: "📖",
    genres: ["Romance","Mystery","Horror","Thriller","Sci-Fi","Fantasy","Historical","Literary","Other"],
  },
  "Non-fiction": {
    icon: "📰",
    genres: ["True Crime","History","Biography","Self-Help","Science","Social","Essays","Other"],
  },
  "Short Stories / Novella": {
    icon: "📜",
    genres: ["Horror","Fantasy","Sci-Fi","Literary","Other"],
  },
  Poetry: {
    icon: "🌸",
    genres: ["Classic","Contemporary","Spoken Word","Other"],
  },
  "Graphic Novel": {
    icon: "🎨",
    genres: ["Superhero","Horror","Fantasy","Sci-Fi","Literary","Other"],
  },
  Reference: {
    icon: "📚",
    genres: ["Craft","Language","Science","Other"],
  },
  Cooking: {
    icon: "🍳",
    genres: ["Baking","Savoury","Preservation","Foraging","Other"],
  },
};

const AVATAR_EMOJIS = ["🦊","🐺","🌙","🌿","🐙","🦋","🔮","🌊","🎭","🚀","☕","🎸"];
const RATING_LABELS = ["", "Hated it", "Didn't like it", "It was okay", "Liked it", "Loved it"];
const RATING_EMOJIS = ["", "😤", "😕", "😐", "🙂", "😍"];

// ─────────────────────────────────────────────
// SUPABASE DATA LAYER
// ─────────────────────────────────────────────
async function dbGetUsers() {
  const { data } = await supabase.from("users").select("*").order("created_at");
  return data || [];
}

async function dbSaveUser(user) {
  await supabase.from("users").upsert({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    theme: user.theme,
  });
}

async function dbDeleteUser(id) {
  await supabase.from("users").delete().eq("id", id);
}

async function dbGetItems(userId, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  const { data } = await supabase.from(table).select("*").eq("user_id", userId).order("added", { ascending: false });
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    section: row.section,
    genre: row.genre,
    notes: row.notes,
    status: row.status,
    added: row.added,
    desc: row.description,
    rating: row.rating,
    _listType: listType,
  }));
}

async function dbAddItem(userId, item, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).insert({
    id: item.id,
    user_id: userId,
    title: item.title,
    section: item.section,
    genre: item.genre,
    notes: item.notes || "",
    status: item.status,
    added: item.added,
    description: item.desc || "",
    rating: item.rating || 0,
    list_type: listType,
  });
}

async function dbUpdateItem(userId, item, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).update({
    status: item.status,
    rating: item.rating,
    description: item.desc || "",
    notes: item.notes || "",
  }).eq("id", item.id).eq("user_id", userId);
}

async function dbDeleteItem(userId, itemId, listType) {
  const table = listType === "watch" ? "watch_items" : "read_items";
  await supabase.from(table).delete().eq("id", itemId).eq("user_id", userId);
}

// ─────────────────────────────────────────────
// ANTHROPIC API CALLS (via proxy in prod)
// ─────────────────────────────────────────────
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

async function fetchDescription(title, listType) {
  const typeHint = listType === "watch" ? "film, TV show, or documentary" : "book, novel, or written work";
  try {
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
        max_tokens: 80,
        messages: [{ role: "user", content: `One sentence description (max 20 words) of the ${typeHint} "${title}". Return only the sentence, no quotes.` }],
      }),
    });
    const data = await resp.json();
    return data?.content?.[0]?.text?.trim() || "";
  } catch {
    return "";
  }
}

async function generateSuggestions(watchItems, readItems) {
  const rated = [...watchItems, ...readItems].filter(i => i.rating >= 4);
  if (rated.length === 0) return "Rate some items 4–5 ★ to unlock suggestions!";
  const liked = rated.map(i => `"${i.title}"`).slice(0, 10).join(", ");
  try {
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
        max_tokens: 600,
        messages: [{ role: "user", content: `User loved: ${liked}. Suggest 5 films/shows AND 3 books they'd enjoy. For each: title + one sentence why. Be specific.` }],
      }),
    });
    const data = await resp.json();
    return data?.content?.[0]?.text?.trim() || "Could not generate suggestions.";
  } catch {
    return "Could not reach suggestions service.";
  }
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
            transform: n <= (hovered || value) ? "scale(1.2)" : "scale(1)",
            transition: "all 0.1s" }}
          title={RATING_LABELS[n]}
        >★</button>
      ))}
      {(hovered || value) > 0 && (
        <span style={{ fontSize: "0.75rem", color: T.textMuted, marginLeft: "0.4rem" }}>
          {RATING_EMOJIS[hovered || value]} {RATING_LABELS[hovered || value]}
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
// ITEM ROW
// ─────────────────────────────────────────────
function ItemRow({ item, onCycle, onRemove, onRateRequest, onDescUpdate, theme: T, isArchive }) {
  const [expanded, setExpanded] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [desc, setDesc] = useState(item.desc || "");

  const handleExpand = async () => {
    setExpanded(e => !e);
    if (!desc && !expanded) {
      setLoadingDesc(true);
      const d = await fetchDescription(item.title, item._listType || "watch");
      setDesc(d);
      onDescUpdate(item.id, d);
      setLoadingDesc(false);
    }
  };

  const done = item.status === "watched" || item.status === "read";
  const wip  = item.status === "watching" || item.status === "reading";

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${done ? T.borderLight : T.border}`, borderRadius: 10, marginBottom: "0.5rem", overflow: "hidden", opacity: done ? 0.68 : 1, transition: "opacity 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.9rem 1rem" }}>
        <button onClick={() => !isArchive && onCycle(item.id)}
          style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: "none",
            cursor: isArchive ? "default" : "pointer",
            background: done ? T.accent : wip ? T.textMid : T.borderLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.5rem", color: "#fff", fontWeight: "bold", transition: "transform 0.15s" }}
          onMouseEnter={e => { if (!isArchive) e.currentTarget.style.transform = "scale(1.2)"; }}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >{done ? "✓" : wip ? "▶" : ""}</button>

        <button onClick={handleExpand} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <span style={{ fontSize: "0.88rem", color: done ? T.textMuted : T.text, textDecoration: done ? "line-through" : "none", fontFamily: T.font }}>
            {item.title}
          </span>
        </button>

        {done && item.rating > 0 && (
          <span style={{ fontSize: "0.7rem", color: T.accent, letterSpacing: 1, flexShrink: 0 }}>{"★".repeat(item.rating)}</span>
        )}
        {done && item.rating === 0 && (
          <button onClick={() => onRateRequest(item)} style={{ background: "transparent", border: `1px solid ${T.borderLight}`, borderRadius: 4, color: T.textMuted, padding: "0.13rem 0.45rem", fontSize: "0.65rem", fontFamily: T.font, cursor: "pointer", flexShrink: 0 }}>Rate</button>
        )}

        <button onClick={() => onRemove(item.id)}
          style={{ background: "transparent", border: "none", color: T.borderLight, cursor: "pointer", fontSize: "0.95rem", flexShrink: 0, lineHeight: 1, padding: "0 0.1rem", transition: "color 0.15s" }}
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
              {done || wip ? "↩ Move back" : "▶ Mark in progress"}
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
function GenreSection({ genre, items, onCycle, onRemove, onRateRequest, onDescUpdate, theme: T }) {
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
        <ItemRow key={item.id} item={item} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onDescUpdate={onDescUpdate} theme={T} isArchive={false} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN SECTION
// ─────────────────────────────────────────────
function MainSection({ sectionKey, sectionDef, items, onCycle, onRemove, onRateRequest, onDescUpdate, theme: T, search }) {
  const [open, setOpen] = useState(true);
  const todoStatus = items[0]?._listType === "read" ? "unread" : "unwatched";
  const filtered = items.filter(i => i.section === sectionKey && i.status === todoStatus && i.title.toLowerCase().includes(search.toLowerCase()));
  if (filtered.length === 0) return null;

  const byGenre = {};
  sectionDef.genres.forEach(g => { byGenre[g] = []; });
  filtered.forEach(i => { const g = i.genre || "Other"; if (!byGenre[g]) byGenre[g] = []; byGenre[g].push(i); });

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: T.sectionBg, border: `1px solid ${T.sectionBorder}`, borderRadius: 8, padding: "0.65rem 1rem", cursor: "pointer", marginBottom: open ? "0.5rem" : 0 }}>
        <span style={{ fontSize: "0.95rem" }}>{sectionDef.icon}</span>
        <span style={{ fontSize: "0.92rem", fontFamily: T.headerFont, color: T.text, fontWeight: "bold", letterSpacing: "0.02em" }}>{sectionKey}</span>
        <span style={{ fontSize: "0.7rem", color: T.textMuted }}>({filtered.length})</span>
        <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: T.textMuted }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: "0.4rem" }}>
          {sectionDef.genres.map(g => (
            <GenreSection key={g} genre={g} items={byGenre[g] || []} onCycle={onCycle} onRemove={onRemove} onRateRequest={onRateRequest} onDescUpdate={onDescUpdate} theme={T} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ARCHIVE SECTION
// ─────────────────────────────────────────────
function ArchiveSection({ items, onRateRequest, onRemove, onDescUpdate, theme: T, title, emptyMsg }) {
  if (items.length === 0) return <div style={{ color: T.textFaint, fontSize: "0.85rem", padding: "2.5rem 0", textAlign: "center" }}>{emptyMsg}</div>;
  return (
    <div>
      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: T.textMuted, marginBottom: "0.75rem" }}>{title} — {items.length}</div>
      {items.map(item => (
        <ItemRow key={item.id} item={item} onCycle={() => {}} onRemove={onRemove} onRateRequest={onRateRequest} onDescUpdate={onDescUpdate} theme={T} isArchive={true} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ADD FORM
// ─────────────────────────────────────────────
function AddForm({ sections, onAdd, onClose, theme: T }) {
  const sectionKeys = Object.keys(sections);
  const [title, setTitle]     = useState("");
  const [section, setSection] = useState(sectionKeys[0]);
  const [genre, setGenre]     = useState(sections[sectionKeys[0]].genres[0]);
  const [notes, setNotes]     = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const s = (extra) => ({ fontFamily: T.font, outline: "none", color: T.text, ...extra });

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
      <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && title.trim()) onAdd({ title, section, genre, notes }); if (e.key === "Escape") onClose(); }}
        placeholder="Title…"
        style={s({ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.35rem 0", fontSize: "1rem", marginBottom: "0.75rem", boxSizing: "border-box" })}
      />
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <select value={section} onChange={e => { setSection(e.target.value); setGenre(sections[e.target.value].genres[0]); }}
          style={s({ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 4, padding: "0.28rem 0.5rem", fontSize: "0.8rem", cursor: "pointer" })}>
          {sectionKeys.map(k => <option key={k}>{k}</option>)}
        </select>
        <select value={genre} onChange={e => setGenre(e.target.value)}
          style={s({ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 4, padding: "0.28rem 0.5rem", fontSize: "0.8rem", cursor: "pointer" })}>
          {sections[section].genres.map(g => <option key={g}>{g}</option>)}
        </select>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
          style={s({ flex: 1, minWidth: 100, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, padding: "0.28rem 0.5rem", fontSize: "0.8rem" })}
        />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5, color: T.textMuted, padding: "0.3rem 0.85rem", fontSize: "0.8rem", fontFamily: T.font, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => title.trim() && onAdd({ title, section, genre, notes })}
          style={{ background: T.accent, border: "none", borderRadius: 5, color: "#fff", padding: "0.3rem 0.95rem", fontSize: "0.8rem", fontFamily: T.font, cursor: "pointer", fontWeight: "bold" }}>Add</button>
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
  const [loading, setLoading] = useState(false);
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
        {ratedCount === 0
          ? "Rate items 4–5 ★ after watching or reading to unlock personalised suggestions."
          : `Based on your ${ratedCount} highly-rated item${ratedCount !== 1 ? "s" : ""}.`}
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

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab]   = useState("list");
  const [search, setSearch]   = useState("");
  const [adding, setAdding]   = useState(false);
  const [ratingItem, setRatingItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    dbGetItems(userId, listType).then(data => { setItems(data); setLoading(false); });
  }, [userId, listType]);

  const cycleStatus = useCallback(async (id) => {
    const order = [todoStatus, wipStatus, doneStatus];
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        const next = order[(order.indexOf(item.status) + 1) % order.length];
        const newItem = { ...item, status: next };
        dbUpdateItem(userId, newItem, listType);
        return newItem;
      });
      return updated;
    });
  }, [userId, listType, todoStatus, wipStatus, doneStatus]);

  const removeItem = useCallback(async (id) => {
    await dbDeleteItem(userId, id, listType);
    setItems(prev => prev.filter(i => i.id !== id));
  }, [userId, listType]);

  const addItem = async ({ title, section, genre, notes }) => {
    const id = Date.now();
    const newItem = { id, title, section, genre, notes, status: todoStatus, added: id, desc: "", rating: 0, _listType: listType };
    await dbAddItem(userId, newItem, listType);
    setItems(prev => [newItem, ...prev]);
    setAdding(false);
    // fetch description in background
    fetchDescription(title, listType).then(d => {
      if (!d) return;
      setItems(prev => prev.map(i => i.id === id ? { ...i, desc: d } : i));
      dbUpdateItem(userId, { ...newItem, desc: d }, listType);
    });
  };

  const rateItem = useCallback(async (id, rating) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, rating };
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
      {/* Sub-tabs */}
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
            ? <AddForm sections={sections} onAdd={addItem} onClose={() => setAdding(false)} theme={T} />
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
            <MainSection key={key} sectionKey={key} sectionDef={def} items={items} onCycle={cycleStatus} onRemove={removeItem} onRateRequest={setRatingItem} onDescUpdate={updateDesc} theme={T} search={search} />
          ))}
        </>
      )}

      {subTab === "wip" && (
        <ArchiveSection items={wipItems} onRateRequest={setRatingItem} onRemove={removeItem} onDescUpdate={updateDesc} theme={T}
          title={listType === "watch" ? "Currently watching" : "Currently reading"} emptyMsg="Nothing in progress." />
      )}

      {subTab === "done" && (
        <ArchiveSection items={doneItems} onRateRequest={setRatingItem} onRemove={removeItem} onDescUpdate={updateDesc} theme={T}
          title={listType === "watch" ? "Finished" : "Finished reading"} emptyMsg="Nothing finished yet." />
      )}

      {ratingItem && (
        <RatingModal item={ratingItem} onRate={r => rateItem(ratingItem.id, r)} onClose={() => setRatingItem(null)} theme={T} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// USER SELECT PAGE
// ─────────────────────────────────────────────
function UserSelectPage({ users, onSelect, onAdd, onRemove, onThemeChange }) {
  const [newName, setNewName] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { if (addingUser) inputRef.current?.focus(); }, [addingUser]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Georgia, serif" }}>
      <div style={{ color: "#E0D4FF", fontSize: "2rem", marginBottom: "0.3rem", letterSpacing: "0.08em" }}>✦ Lists</div>
      <div style={{ color: "#8888BB", fontSize: "0.8rem", marginBottom: "3rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Who's watching?</div>

      <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2rem" }}>
        {users.map(u => {
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
                {users.length > 1 && (
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

        {users.length < 4 && !addingUser && (
          <button onClick={() => setAddingUser(true)} style={{ width: 130, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 14, padding: "1.5rem 1rem", cursor: "pointer", color: "#6666AA", fontSize: "0.82rem", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
          >
            <span style={{ fontSize: "2rem", opacity: 0.4 }}>+</span>
            <span>Add User</span>
          </button>
        )}

        {addingUser && (
          <div style={{ width: 150, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.7rem" }}>
            <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name…"
              onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onAdd(newName.trim()); setNewName(""); setAddingUser(false); } if (e.key === "Escape") setAddingUser(false); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#E0D4FF", padding: "0.4rem 0.5rem", fontSize: "0.85rem", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button onClick={() => setAddingUser(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, color: "#6666AA", padding: "0.25rem 0.6rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "Georgia, serif" }}>✕</button>
              <button onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); setAddingUser(false); } }}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, color: "#E0D4FF", padding: "0.25rem 0.7rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "Georgia, serif" }}>Add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [users, setUsers]           = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [mainTab, setMainTab]       = useState("watch");
  const [showSwitch, setShowSwitch] = useState(false);

  useEffect(() => {
    dbGetUsers().then(data => {
      setUsers(data.length > 0 ? data : []);
    });
  }, []);

  if (users === null) return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", color: "#8888BB", fontFamily: "Georgia, serif" }}>Loading…</div>
  );

  if (!activeUser || !users.find(u => u.id === activeUser)) {
    return (
      <UserSelectPage
        users={users}
        onSelect={id => { setActiveUser(id); setMainTab("watch"); }}
        onAdd={async (name) => {
          const used = users.map(u => u.avatar);
          const avatar = AVATAR_EMOJIS.find(e => !used.includes(e)) || "⭐";
          const themeKeys = Object.keys(THEMES);
          const theme = themeKeys[users.length % themeKeys.length];
          const id = `user-${Date.now()}`;
          const newUser = { id, name, avatar, theme };
          await dbSaveUser(newUser);
          setUsers(prev => [...prev, newUser]);
        }}
        onRemove={async (id) => {
          await dbDeleteUser(id);
          setUsers(prev => prev.filter(u => u.id !== id));
        }}
        onThemeChange={async (id, theme) => {
          setUsers(prev => prev.map(u => {
            if (u.id !== id) return u;
            const updated = { ...u, theme };
            dbSaveUser(updated);
            return updated;
          }));
        }}
      />
    );
  }

  const user = users.find(u => u.id === activeUser);
  const T = THEMES[user.theme || "gilmore"];

  const mainTabs = [
    { key: "watch", label: "🎬 Watch" },
    { key: "read",  label: "📚 Read" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.bgHeader, borderBottom: `1px solid ${T.border}`, padding: "1.1rem 1.5rem 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.2rem" }}>{user.avatar}</span>
              <span style={{ fontSize: "0.95rem", fontFamily: T.headerFont, color: T.text, fontWeight: "bold", letterSpacing: "0.04em" }}>{user.name}'s Lists</span>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowSwitch(s => !s)} style={{ background: "rgba(0,0,0,0.08)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "0.28rem 0.75rem", fontSize: "0.73rem", fontFamily: T.font, color: T.textMid, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>⇄</span><span>Switch</span>
              </button>
              {showSwitch && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 0.5rem)", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.5rem", zIndex: 100, minWidth: 155, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                  {users.map(u => (
                    <button key={u.id} onClick={() => { setActiveUser(u.id); setShowSwitch(false); setMainTab("watch"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", background: u.id === activeUser ? T.sectionBg : "transparent", border: "none", borderRadius: 6, padding: "0.42rem 0.6rem", cursor: "pointer", color: T.text, fontSize: "0.82rem", fontFamily: T.font, marginBottom: "0.12rem" }}>
                      <span>{u.avatar}</span><span>{u.name}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: `1px solid ${T.borderLight}`, marginTop: "0.3rem", paddingTop: "0.3rem" }}>
                    <button onClick={() => { setActiveUser(null); setShowSwitch(false); }}
                      style={{ width: "100%", background: "transparent", border: "none", borderRadius: 6, padding: "0.38rem 0.6rem", cursor: "pointer", color: T.textMuted, fontSize: "0.73rem", fontFamily: T.font, textAlign: "left" }}>
                      👥 Manage users
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

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.4rem 1.2rem 5rem" }}>
        {mainTab === "watch"   && <ListPage key={`w-${user.id}`} userId={user.id} listType="watch" sections={WATCH_SECTIONS} theme={T} />}
        {mainTab === "read"    && <ListPage key={`r-${user.id}`} userId={user.id} listType="read"  sections={READ_SECTIONS}  theme={T} />}
        {mainTab === "suggest" && <SuggestionsPage key={`s-${user.id}`} userId={user.id} theme={T} />}
      </div>

      {showSwitch && <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setShowSwitch(false)} />}
    </div>
  );
}
