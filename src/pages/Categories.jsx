import { useState, useEffect } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categories";
import PageHeader from "../components/PageHeader";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];
const ICONS = [
  "📁",
  "💼",
  "🏠",
  "🎯",
  "💡",
  "🛠️",
  "📚",
  "❤️",
  "🌟",
  "🎨",
  "🏋️",
  "🌱",
];

function CategoryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: "", color: "#6366f1", icon: "📁" },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{initial ? "Edit Category" : "New Category"}</h2>
        <div className="form-group">
          <label>Name *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Work, Personal, Business"
          />
        </div>
        <div className="form-group">
          <label>Icon</label>
          <div className="color-picker">
            {ICONS.map((ic) => (
              <div
                key={ic}
                className={`icon-dot ${form.icon === ic ? "selected" : ""}`}
                onClick={() => set("icon", ic)}
              >
                {ic}
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {COLORS.map((c) => (
              <div
                key={c}
                className={`color-dot ${form.color === c ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => set("color", c)}
              />
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => form.name.trim() && onSave(form)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await getCategories();
    setCategories(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    if (editing) await updateCategory(editing.id, form);
    else await createCategory(form);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this category?")) {
      await deleteCategory(id);
      load();
    }
  };

  return (
    <div>
      <PageHeader
        icon="🏷️"
        title="Project Categories"
        description="Organize projects into categories"
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Category
          </button>
        }
      />

      <div className="cards-grid">
        {categories.map((c) => (
          <div
            className="category-card"
            key={c.id}
            style={{ borderLeft: `4px solid ${c.color || "#6366f1"}` }}
          >
            <div className="category-icon">{c.icon || "📁"}</div>
            <div className="category-info">
              <h3>{c.name}</h3>
            </div>
            <div className="card-actions">
              <button
                className="btn-icon"
                onClick={() => {
                  setEditing(c);
                  setShowForm(true);
                }}
              >
                ✏️
              </button>
              <button className="btn-icon" onClick={() => handleDelete(c.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="empty-state">
            No categories yet. Create your first one!
          </p>
        )}
      </div>

      {showForm && (
        <CategoryForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
