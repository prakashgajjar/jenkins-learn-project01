import { useEffect, useMemo, useState } from "react";

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Something went wrong. Please try again.");
  }

  return response.status === 204 ? null : response.json();
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    request("/api/todos")
      .then(setTodos)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const remaining = todos.filter((todo) => !todo.completed).length;
  const visibleTodos = useMemo(
    () => todos.filter((todo) => {
      if (filter === "active") return !todo.completed;
      if (filter === "completed") return todo.completed;
      return true;
    }),
    [todos, filter],
  );

  async function addTodo(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || saving) return;

    setSaving(true);
    setError("");
    try {
      const todo = await request("/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: trimmedTitle }),
      });
      setTodos((current) => [todo, ...current]);
      setTitle("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateTodo(id, updates) {
    setError("");
    try {
      const updatedTodo = await request(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setTodos((current) => current.map((todo) => (todo._id === id ? updatedTodo : todo)));
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function deleteTodo(id) {
    setError("");
    try {
      await request(`/api/todos/${id}`, { method: "DELETE" });
      setTodos((current) => current.filter((todo) => todo._id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveEdit(id) {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setError("A task can't have an empty title.");
      return;
    }
    if (await updateTodo(id, { title: trimmedTitle })) {
      setEditingId(null);
      setEditTitle("");
    }
  }

  async function clearCompleted() {
    const completedTodos = todos.filter((todo) => todo.completed);
    const results = await Promise.all(completedTodos.map(async (todo) => {
      try {
        await request(`/api/todos/${todo._id}`, { method: "DELETE" });
        return todo._id;
      } catch (requestError) {
        setError(requestError.message);
        return null;
      }
    }));
    const deletedIds = new Set(results.filter(Boolean));
    setTodos((current) => current.filter((todo) => !deletedIds.has(todo._id)));
  }

  return (
    <main className="page-shell">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="page-header">
          <div className="date-label"><span className="sun-mark" /> YOUR SPACE, YOUR PACE</div>
          <h1 id="page-title">Daily tasks<span className="title-period">.</span></h1>
          <p className="subtitle">A little progress adds up to a lot.</p>
        </header>

        <form className="new-task-form" onSubmit={addTodo}>
          <label className="sr-only" htmlFor="new-task">Add a task</label>
          <input
            id="new-task"
            type="text"
            maxLength={200}
            placeholder="What needs doing?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button className="add-button" type="submit" disabled={!title.trim() || saving}>
            <span aria-hidden="true">+</span> Add task
          </button>
        </form>

        {error && (
          <div className="error-message" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
          </div>
        )}

        <div className="list-heading">
          <h2>YOUR LIST</h2>
          <span className="task-count">{remaining} LEFT</span>
        </div>

        <nav className="filters" aria-label="Filter tasks">
          {["all", "active", "completed"].map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "filter-button active" : "filter-button"}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <div className="todo-list" aria-live="polite">
          {loading ? (
            <p className="empty-state">Loading your tasks...</p>
          ) : visibleTodos.length ? (
            visibleTodos.map((todo) => (
              <article className={`todo-item${todo.completed ? " is-complete" : ""}`} key={todo._id}>
                <button
                  type="button"
                  className="check-button"
                  aria-label={todo.completed ? `Mark ${todo.title} as active` : `Complete ${todo.title}`}
                  aria-pressed={todo.completed}
                  onClick={() => updateTodo(todo._id, { completed: !todo.completed })}
                >
                  {todo.completed && <CheckIcon />}
                </button>
                {editingId === todo._id ? (
                  <form
                    className="edit-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEdit(todo._id);
                    }}
                  >
                    <input
                      aria-label="Edit task"
                      maxLength={200}
                      autoFocus
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button className="text-button save-button" type="submit">Save</button>
                  </form>
                ) : (
                  <>
                    <button
                      className="todo-title"
                      type="button"
                      onDoubleClick={() => {
                        setEditingId(todo._id);
                        setEditTitle(todo.title);
                      }}
                      title="Double-click to edit"
                    >
                      {todo.title}
                    </button>
                    <div className="item-actions">
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Edit ${todo.title}`}
                        onClick={() => {
                          setEditingId(todo._id);
                          setEditTitle(todo.title);
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m14 5 5 5M4 20l4.2-.9L19 8.3 15.7 5 4.9 15.8 4 20Z" />
                        </svg>
                      </button>
                      <button
                        className="icon-button delete-button"
                        type="button"
                        aria-label={`Delete ${todo.title}`}
                        onClick={() => deleteTodo(todo._id)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <span className="empty-sparkle" aria-hidden="true">✳</span>
              <p>{todos.length ? "Nothing in this view." : "Your list is a blank canvas."}</p>
              <span>{todos.length ? "Try another filter." : "Add a task to get started."}</span>
            </div>
          )}
        </div>

        {!loading && todos.length > 0 && (
          <footer className="list-footer">
            <span>{remaining === 1 ? "1 task" : `${remaining} tasks`} to go</span>
            <button
              className="text-button clear-button"
              type="button"
              disabled={!todos.some((todo) => todo.completed)}
              onClick={clearCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}
      </section>
      <p className="page-note">MADE FOR THE MOMENT YOU'RE IN</p>
    </main>
  );
}

export default App;

