/**
 * Notes/Notepad Widget - Similar to Google Keep
 */

import React, { useState, useEffect } from 'react';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

interface NotesWidgetProps {
  onNotesChange?: (notes: Note[]) => void;
}

const NOTE_COLORS = [
  { name: 'Default', value: '#ffffff' },
  { name: 'Red', value: '#f28b82' },
  { name: 'Orange', value: '#fbbc04' },
  { name: 'Yellow', value: '#fff475' },
  { name: 'Green', value: '#ccff90' },
  { name: 'Teal', value: '#a7ffeb' },
  { name: 'Blue', value: '#cbf0f8' },
  { name: 'Purple', value: '#d7aefb' },
  { name: 'Pink', value: '#fdcfe8' }
];

const NotesWidget: React.FC<NotesWidgetProps> = ({ onNotesChange }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    chrome.storage.local.get(['notes'], (result) => {
      if (result.notes) {
        setNotes(result.notes);
      }
    });
  };

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    chrome.storage.local.set({ notes: updatedNotes });
    if (onNotesChange) {
      onNotesChange(updatedNotes);
    }
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      color: '#ffffff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false
    };
    setEditingNote(newNote);
  };

  const saveNote = (note: Note) => {
    const existing = notes.find((n) => n.id === note.id);
    let updated: Note[];

    if (existing) {
      updated = notes.map((n) => (n.id === note.id ? { ...note, updatedAt: Date.now() } : n));
    } else {
      updated = [note, ...notes];
    }

    saveNotes(updated);
    setEditingNote(null);
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter((note) => note.id !== id));
  };

  const togglePin = (id: string) => {
    const updated = notes.map((note) =>
      note.id === id ? { ...note, pinned: !note.pinned } : note
    );
    saveNotes(updated);
  };

  // Color is changed directly in the NoteEditor component
  // const changeColor = (id: string, color: string) => {
  //   const updated = notes.map((note) =>
  //     note.id === id ? { ...note, color, updatedAt: Date.now() } : note
  //   );
  //   saveNotes(updated);
  // };

  const getFilteredNotes = (): Note[] => {
    let filtered = notes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by updated date
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  };

  const NoteCard: React.FC<{ note: Note }> = ({ note }) => (
    <div
      style={{
        background: note.color,
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={() => setEditingNote(note)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
    >
      {note.pinned && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '16px' }}>
          📌
        </div>
      )}

      {note.title && (
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#202124' }}>
          {note.title}
        </h4>
      )}

      <div
        style={{
          fontSize: '13px',
          color: '#5f6368',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: 1
        }}
      >
        {note.content.substring(0, 200)}
        {note.content.length > 200 && '...'}
      </div>
    </div>
  );

  const NoteEditor: React.FC<{ note: Note }> = ({ note }) => {
    const [localNote, setLocalNote] = useState(note);

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setEditingNote(null)}
      >
        <div
          style={{
            background: localNote.color,
            borderRadius: '12px',
            padding: '20px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Title"
            value={localNote.title}
            onChange={(e) => setLocalNote({ ...localNote, title: e.target.value })}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              outline: 'none',
              color: '#202124'
            }}
            autoFocus
          />

          <textarea
            placeholder="Take a note..."
            value={localNote.content}
            onChange={(e) => setLocalNote({ ...localNote, content: e.target.value })}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              flex: 1,
              resize: 'none',
              outline: 'none',
              color: '#5f6368',
              minHeight: '200px'
            }}
          />

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {NOTE_COLORS.map((c) => (
              <div
                key={c.value}
                onClick={() => setLocalNote({ ...localNote, color: c.value })}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: c.value,
                  border: localNote.color === c.value ? '3px solid #1a73e8' : '2px solid #dadce0',
                  cursor: 'pointer'
                }}
                title={c.name}
              />
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <button
              onClick={() => togglePin(localNote.id)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#5f6368',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {localNote.pinned ? '📌 Unpin' : '📌 Pin'}
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  deleteNote(localNote.id);
                  setEditingNote(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#ea4335',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Delete
              </button>
              <button
                onClick={() => saveNote(localNote)}
                style={{
                  padding: '8px 16px',
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#2c3e50', flex: 1 }}>
          Notes ({notes.length})
        </h3>

        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '2px solid #ecf0f1',
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none',
            width: '200px'
          }}
        />

        <button
          onClick={createNote}
          style={{
            padding: '10px 20px',
            background: '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          + New Note
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          alignContent: 'start'
        }}
      >
        {getFilteredNotes().length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px 0', color: '#95a5a6', fontSize: '14px' }}>
            {searchQuery ? 'No notes found' : 'No notes yet. Click "New Note" to create one!'}
          </div>
        ) : (
          getFilteredNotes().map((note) => <NoteCard key={note.id} note={note} />)
        )}
      </div>

      {editingNote && <NoteEditor note={editingNote} />}
    </div>
  );
};

export default NotesWidget;
