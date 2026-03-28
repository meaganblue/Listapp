import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function App() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  // Load the list from Supabase when the app starts
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users') // Your table name
      .select('*')
      .order('added', { ascending: false }); // Uses the 'added' column we created

    if (error) {
      console.error('Error fetching data:', error.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Save to Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ content: inputValue }])
      .select();

    if (error) {
      alert('Error saving to database: ' + error.message);
    } else if (data) {
      // Add the new item to the top of the list in the UI
      setItems([data[0], ...items]);
      setInputValue('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1>My List</h1>
      
      <form onSubmit={addItem} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add something to your list..."
          style={{ padding: '10px', width: '70%', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px' }}>Add</button>
      </form>

      {loading ? (
        <p>Loading your list...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li key={item.id} style={{ 
              padding: '10px', 
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              {item.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
