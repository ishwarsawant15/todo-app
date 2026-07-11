import React, { useState } from "react";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function TodoForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError("Give the task a title first.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onCreate({
        title: trimmed,
        priority,
        due_date: dueDate || null,
      });
      setTitle("");
      setPriority("medium");
      setDueDate("");
    } catch (err) {
      setFormError("Couldn't add that entry. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="todo-form-input"
        placeholder="Write a new entry…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Task title"
      />
      <div className="todo-form-row">
        <select
          className="todo-form-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Priority"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} priority
            </option>
          ))}
        </select>
        <input
          type="date"
          className="todo-form-date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Due date"
        />
        <button type="submit" className="todo-form-submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add entry"}
        </button>
      </div>
      {formError && <p className="state-message error small">{formError}</p>}
    </form>
  );
}
