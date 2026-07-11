import React from "react";

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TodoItem({ todo, onToggle, onDelete }) {
  const due = formatDate(todo.due_date);

  return (
    <li className={`todo-row priority-${todo.priority} ${todo.completed ? "is-done" : ""}`}>
      <button
        type="button"
        className="todo-checkbox"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={todo.completed ? `Mark "${todo.title}" as not done` : `Mark "${todo.title}" as done`}
        onClick={() => onToggle(todo.id)}
      >
        {todo.completed && (
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path d="M2 8.5 6 12l8-8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="todo-body">
        <span className="todo-title">{todo.title}</span>
        {due && <span className="todo-due">{due}</span>}
      </div>

      <button
        type="button"
        className="todo-delete"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
      >
        ×
      </button>
    </li>
  );
}
