import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
// Ensure lucide-react is installed in your package.json
import { 
  Plus, Search, Film, Book, Tv, Trash2, Edit2, 
  Settings, LogOut, CheckCircle, Clock, Star 
} from 'lucide-react';

// --- THEMES ---
const THEMES = {
  muppets: {
    name: 'The Muppet Show',
    primary: '#e61919',
    secondary: '#50c878',
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#ffd700',
    font: "'Courier New', Courier, monospace"
  },
  hitchhiker: {
    name: "Hitchhiker's Guide",
    primary: '#4287f5',
    secondary: '#ffcc00',
    background: '#0a0b1e',
    text: '#e0e0e0',
    accent: '#00ff41',
    font: "'Lucida Console', Monaco, monospace"
  },
  gilmore: {
    name: 'Gilmore Girls',
    primary: '#8b4513',
    secondary: '#f5f5dc',
    background: '#fffaf0',
    text: '#2f4f4f',
    accent: '#4682b4',
    font: "'Georgia', serif"
  },
  toyStory: {
    name: 'Toy Story',
    primary: '#ffcc00',
    secondary: '#0066cc',
    background: '#ffffff',
    text: '#333333',
    accent: '#ff3300',
    font: "'Comic Sans MS', 'Comic Sans', cursive"
  }
};

export default function App() {
  const [currentTheme, setCurrentTheme] = useState(THEMES.muppets);
  const [items, setItems] = useState([]);
  const [view, setView] = useState('watch');
  const [showSwitch, setShowSwitch] = useState(false);
  const [newItem, setNewItem] = useState('');

  const styles = {
    app: {
      backgroundColor: currentTheme.background,
      color: currentTheme.text,
      fontFamily: currentTheme.font,
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    },
    input: {
      padding: '10px',
      fontSize: '16px',
      width: '100%',
      maxWidth: '300px',
      marginBottom: '10px'
    },
    button: {
      padding: '10px 20px',
      cursor: 'pointer',
      backgroundColor: currentTheme.primary,
      color: 'white',
      border: 'none',
      borderRadius: '4px'
    }
  };

  const handleAddItem = async () => {
    if (!newItem) return;
    // Database logic here
    setItems([...items, { id: Date.now(), title: newItem, type: view }]);
    setNewItem('');
  };

  return (
    <div style={styles.app}>
      <h1>{view === 'watch' ? 'My Watch List' : 'My Read List'}</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          style={styles.input}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add something to your list..."
        />
        <br />
        <button style={styles.button} onClick={handleAddItem}>Add</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button style={styles.button} onClick={() => setView('watch')}>Watch</button>
        <button style={styles.button} onClick={() => setView('read')}>Read</button>
      </div>

      <footer style={{ marginTop: '50px' }}>
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => setShowSwitch(s => !s)} 
            style={{ ...styles.button, background: currentTheme.accent }}
          >
            Switch Theme
          </button>
          
          {showSwitch && (
            <div style={{ marginTop: '10px' }}>
              {Object.keys(THEMES).map(key => (
                <button 
                  key={key} 
                  onClick={() => {
                    setCurrentTheme(THEMES[key]);
                    setShowSwitch(false);
                  }}
                  style={{ margin: '5px', padding: '5px' }}
                >
                  {THEMES[key].name}
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
} // Final closing brace to fix the build error
