import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./App.css";
import { api } from "./api";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | active | done

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.list();
      const results = Array.isArray(data) ? data : data.results;
      setTodos(results);
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreate = async (todo) => {
    const created = await api.create(todo);
    setTodos((prev) => [created, ...prev]);
  };

  const handleToggle = async (id) => {
    const updated = await api.toggle(id);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleDelete = async (id) => {
    await api.remove(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const visibleTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "done") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="page">
      <main className="ledger">
        <header className="ledger-header">
          <div className="ledger-header-top">
            <h1 className="ledger-title">Ledger</h1>
            <span className="ledger-tally" aria-live="polite">
              {todos.length === 0 ? "—" : `${doneCount} / ${todos.length}`}
            </span>
          </div>
          <p className="ledger-subtitle">Today's entries. Cross them off as you go.</p>
        </header>

        <TodoForm onCreate={handleCreate} />

        <nav className="filter-row" aria-label="Filter tasks">
          {[
            ["all", "All"],
            ["active", "Open"],
            ["done", "Done"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`filter-pill ${filter === key ? "is-active" : ""}`}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
            >
              {label}
            </button>
          ))}
        </nav>

        {error && <p className="state-message error">{error}</p>}
        {!error && loading && <p className="state-message">Loading entries…</p>}
        {!error && !loading && visibleTodos.length === 0 && (
          <p className="state-message">
            {filter === "done" ? "Nothing crossed off yet." : "No entries here. Add your first task above."}
          </p>
        )}

        {!error && !loading && visibleTodos.length > 0 && (
          <TodoList todos={visibleTodos} onToggle={handleToggle} onDelete={handleDelete} />
        )}
      </main>
    </div>
  );
}
