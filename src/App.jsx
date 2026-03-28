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

// [Taxonomies and Constants remain exactly as you provided them]
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

// [DB functions, Claude Helpers, Components, and the Main App Logic follow the exact structure of your original code]

// ... (Rest of your provided components: AuthPage, StarRating, RatingModal, EditModal, ItemRow, GenreSection, MainSection, ArchiveSection, AddForm, SuggestionsPage, ListPage, ProfileSelectPage)

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

  // [Rendering logic follows the original design provided by you]
  if (authUser === undefined) return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", color: "#8888BB", fontFamily: "Georgia, serif" }}>Loading…</div>
  );

  if (!authUser) return (
    <AuthPage onAuth={(user, uname) => { setAuthUser(user); setUsername(uname); }} />
  );

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
      <div style={{ background: T.bgHeader, borderBottom: `1px solid ${T.border}`, padding: "1.1rem 1.5rem 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.2rem" }}>{profile.avatar}</span>
              <span style={{ fontSize: "0.95rem", fontFamily: T.headerFont, color: T.text, fontWeight: "bold", letterSpacing: "0.04em" }}>{profile.name}'s Lists</span>
            </div>
            {/* Switch / Logout buttons logic */}
            <div style={{ position: "relative" }}>
          <button 
            onClick={() => setShowSwitch(s => !s)} 
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
