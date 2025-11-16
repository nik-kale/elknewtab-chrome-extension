/**
 * Todo List Widget
 */

import React, { useState, useEffect } from 'react';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

interface TodoWidgetProps {
  onTodosChange?: (todos: TodoItem[]) => void;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ onTodosChange }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = () => {
    chrome.storage.local.get(['todos'], (result) => {
      if (result.todos) {
        setTodos(result.todos);
      }
    });
  };

  const saveTodos = (updatedTodos: TodoItem[]) => {
    setTodos(updatedTodos);
    chrome.storage.local.set({ todos: updatedTodos });
    if (onTodosChange) {
      onTodosChange(updatedTodos);
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      priority: 'medium',
      createdAt: Date.now()
    };

    saveTodos([todo, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(updated);
  };

  const deleteTodo = (id: string) => {
    saveTodos(todos.filter((todo) => todo.id !== id));
  };

  const setPriority = (id: string, priority: 'low' | 'medium' | 'high') => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, priority } : todo
    );
    saveTodos(updated);
  };

  const clearCompleted = () => {
    saveTodos(todos.filter((todo) => !todo.completed));
  };

  const getFilteredTodos = (): TodoItem[] => {
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        minWidth: '320px',
        maxWidth: '400px',
        maxHeight: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#2c3e50' }}>
        Tasks ({activeCount})
      </h3>

      {/* Add todo input */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '2px solid #ecf0f1',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={addTodo}
          style={{
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          + Add
        </button>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all', 'active', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            style={{
              padding: '6px 12px',
              background: filter === f ? '#3498db' : '#ecf0f1',
              color: filter === f ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              textTransform: 'capitalize',
              fontWeight: 500
            }}
          >
            {f}
          </button>
        ))}
        {todos.some((t) => t.completed) && (
          <button
            onClick={clearCompleted}
            style={{
              padding: '6px 12px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: 'auto',
              fontWeight: 500
            }}
          >
            Clear Done
          </button>
        )}
      </div>

      {/* Todo list */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
        {getFilteredTodos().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#95a5a6', fontSize: '14px' }}>
            {filter === 'completed' ? 'No completed tasks' : 'No tasks yet'}
          </div>
        ) : (
          getFilteredTodos().map((todo) => (
            <div
              key={todo.id}
              style={{
                padding: '12px',
                background: todo.completed ? '#f8f9fa' : 'white',
                border: '1px solid #ecf0f1',
                borderRadius: '8px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '14px',
                    color: todo.completed ? '#95a5a6' : '#2c3e50',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    wordBreak: 'break-word'
                  }}
                >
                  {todo.text}
                </div>
              </div>
              <select
                value={todo.priority}
                onChange={(e) => setPriority(todo.id, e.target.value as any)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ecf0f1',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: getPriorityColor(todo.priority),
                  fontWeight: 600
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Med</option>
                <option value="high">High</option>
              </select>
              <button
                onClick={() => deleteTodo(todo.id)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#e74c3c',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {todos.length > 0 && (
        <div style={{ fontSize: '11px', color: '#7f8c8d', textAlign: 'center' }}>
          {activeCount} active • {todos.filter((t) => t.completed).length} completed
        </div>
      )}
    </div>
  );
};

export default TodoWidget;
