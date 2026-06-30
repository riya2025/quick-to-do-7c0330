import React, { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, useNavigate, useParams, Navigate } from 'react-router-dom';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function loadTasks() {
  try {
    const data = localStorage.getItem('quicktodo_tasks');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem('quicktodo_tasks', JSON.stringify(tasks));
  } catch {
    /* silently fail */
  }
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [filter, setFilter] = useState('all');
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter(t => !t.done);
      case 'done':
        return tasks.filter(t => t.done);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter(t => !t.done).length,
    done: tasks.filter(t => t.done).length,
  }), [tasks]);

  function addTask(e) {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;
    setTasks(prev => [...prev, { id: generateId(), title, done: false, createdAt: Date.now() }]);
    setInputValue('');
    inputRef.current?.focus();
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function clearDone() {
    setTasks(prev => prev.filter(t => !t.done));
  }

  return (
    <HashRouter>
      <div className="app">
        <header className="topbar">
          <div className="container wrap">
            <h1 className="hero">Quick To-Do</h1>
          </div>
        </header>
        <main className="container">
          <div className="card">
            <form className="row" onSubmit={addTask}>
              <input
                ref={inputRef}
                className="input"
                type="text"
                placeholder="What needs to be done?"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                aria-label="New task title"
              />
              <button className="btn btn-primary" type="submit">Add</button>
            </form>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <nav className="nav">
              <button
                className={`btn ${filter === 'all' ? 'primary' : ''}`}
                onClick={() => setFilter('all')}
              >
                All <span className="badge">{counts.all}</span>
              </button>
              <button
                className={`btn ${filter === 'active' ? 'primary' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active <span className="badge">{counts.active}</span>
              </button>
              <button
                className={`btn ${filter === 'done' ? 'primary' : ''}`}
                onClick={() => setFilter('done')}
              >
                Done <span className="badge">{counts.done}</span>
              </button>
            </nav>
            {counts.done > 0 && (
              <button className="btn" onClick={clearDone}>Clear Done</button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="box center muted">
              <p>{filter === 'all' ? 'No tasks yet. Add one above!' : `No ${filter} tasks.`}</p>
            </div>
          ) : (
            <ul className="list">
              {filteredTasks.map(task => (
                <li key={task.id} className={`list-item rec ${task.done ? 'done' : ''}`}>
                  <label className="field row" style={{ flex: 1, cursor: 'pointer', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className={`task-title ${task.done ? 'muted' : ''}`} style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                      {task.title}
                    </span>
                  </label>
                  <button className="btn btn-delete" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </HashRouter>
  );
}