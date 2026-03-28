import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { 
  Plus, Search, Film, Book, Tv, Trash2, Edit2, 
  Settings, LogOut, CheckCircle, Clock, Star 
} from 'lucide-react';

// --- CONSTANTS & THEMES ---
const THEMES = {
  muppets: {
    name: 'The Muppet Show',
    primary: '#e61919', // Kermit/Curtain Red
    secondary: '#50c878', // Kermit Green
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#ffd700', // Gold sparkles
    font: "'Courier New', Courier, monospace"
  },
  hitchhiker: {
    name: "Hitchhiker's Guide",
    primary: '#4287f5', // Deep Space Blue
    secondary: '#ffcc00', // Warning Yellow (Don't Panic!)
    background: '#0a0b1e',
    text: '#e0e0e0',
    accent: '#00ff41', // Matrix Green
    font: "'Lucida Console', Monaco, monospace"
  },
  gilmore: {
    name: 'Gilmore Girls',
    primary: '#8b4513', // Coffee Brown
    secondary: '#f5f5dc', // Beige/Paper
    background: '#fffaf0',
    text: '#2f4f4f',
    accent: '#4682b4', // Dragonfly Blue
    font: "'Georgia', serif"
  },
  toyStory: {
    name: 'Toy Story',
    primary: '#ffcc00', // Buzz/Woody Yellow
    secondary: '#0066cc', // Sky Blue
    background: '#ffffff',
    text: '#333333',
    accent: '#ff3300', // Red Rocket
    font: "'Comic Sans MS', 'Comic Sans', cursive"
  }
};

const TAXONOMIES = {
  watch: {
    categories: ['Movies', 'TV Shows', 'Mini-series', 'Documentaries', 'Anime'],
    genres: ['Sci-Fi', 'Fantasy', 'Horror', 'Comedy', 'Drama', 'Action', 'Musical']
  },
  read: {
    categories: ['Fiction', 'Non-fiction', 'Poetry', 'Graphic Novel', 'Short Story'],
    genres: ['History', 'Biography', 'Mystery', 'Philosophy', 'Science', 'Fantasy']
  }
};

// --- DATABASE HELPERS ---
const dbGetProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data;
};

const dbAddItem = async (item) => {
  const { data, error } = await supabase.from('list_items').insert([item]);
  if (error) throw error;
  return data;
};

// --- MAIN COMPONENT ---
export default function App() {
  const [currentTheme, setCurrentTheme] = useState(THEMES.muppets);
  const [items, setItems] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [view, setView] = useState('watch'); // 'watch' or 'read'
  const [newItem, setNewItem] = useState({ title: '', category: '', genre: '' });

  useEffect(() => {
    const fetchData = async () => {
      const p = await dbGetProfiles();
      setProfiles(p);
    };
    fetchData();
  }, []);

  const styles = {
    app: {
      backgroundColor: currentTheme.background,
      color: currentTheme.text,
      fontFamily: currentTheme.font,
      minHeight: '100vh',
      padding: '20px'
    },
    header: {
      borderBottom: `2px solid ${currentTheme.primary}`,
      paddingBottom: '10px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between'
    },
    input: {
      padding: '10px',
      borderRadius: '4px',
      border: `1px solid ${currentTheme.secondary}`,
      marginRight: '10px'
    },
    button: {
      backgroundColor: currentTheme.primary,
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>{currentTheme.name} List</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.button} onClick={() => setView('watch')}><Film size={18} /> Watch</button>
          <button style={styles.button} onClick={() => setView('read')}><Book size={18} /> Read</button>
        </div>
      </header>

      <main>
        <div style={{ marginBottom: '20px' }}>
          <input 
            style={styles.input}
            placeholder={`Add to ${view} list...`}
            value={newItem.title}
            onChange={(e) => setNewItem({...newItem, title: e.target.value})}
          />
          <button style={styles.button} onClick={() => dbAddItem({...newItem, type: view})}>
            <Plus size={18} /> Add
          </button>
        </div>

        <div className="list-container">
          {items.filter(i => i.type === view).map(item => (
            <div key={item.id} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
              {item.title}
            </div>
          ))}
        </div>
      </main>

      <footer style={{ marginTop: '40px', textAlign: 'center' }}>
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => {
              const keys = Object.keys(THEMES);
              const nextIndex = (keys.indexOf(Object.keys(THEMES).find(key => THEMES[key] === currentTheme)) + 1) % keys.length;
              setCurrentTheme(THEMES[keys[nextIndex]]);
            }}
            style={{ ...styles.button, background: currentTheme.accent }}
          >
            Switch Theme
          </button>
        </div>
      </footer>
    </div>
  );
}
