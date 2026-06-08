import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getProjects,
  getSubProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectProgress,
} from "../api/projects";
import { getCategories } from "../api/categories";
import PageHeader from "../components/PageHeader";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import { getGoals } from "../api/goals";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
const STATUS = ["ACTIVE", "PAUSED", "DONE"];

function ProjectForm({
  initial,
  categories,
  projects,
  goals,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      description: "",
      color: "#6366f1",
      status: "ACTIVE",
      dueDate: "",
      categoryId: "",
      parentProjectId: "",
      linkedGoalId: "",
    },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const rootProjects = projects.filter(
    (p) => !p.parentProjectId && p.id !== initial?.id,
  );

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{initial ? "Edit Project" : "New Project"}</h2>
        <div className="form-group">
          <label>Name *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Project name"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Optional description"
          />
        </div>
        <div className="form-group">
          <label>Parent Project (optional)</label>
          <select
            value={form.parentProjectId}
            onChange={(e) => set("parentProjectId", e.target.value)}
          >
            <option value="">-- No Parent (Root Project) --</option>
            {rootProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            <option value="">-- No Category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Link to Goal (optional)</label>
          <select
            value={form.linkedGoalId}
            onChange={(e) => set("linkedGoalId", e.target.value)}
          >
            <option value="">-- No Goal --</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} ({g.progress || 0}%)
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => {
                set("dueDate", e.target.value);
                e.target.blur();
              }}
              disabled={form.noDate}
              style={{ flex: 1, opacity: form.noDate ? 0.4 : 1 }}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                width: "auto",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.noDate || false}
                style={{ width: "auto" }}
                onChange={(e) => {
                  set("noDate", e.target.checked);
                  if (e.target.checked) set("dueDate", "");
                }}
              />
              No date
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
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
          <button className="btn-primary" onClick={() => onSave(form)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function SubProjectCard({
  sub,
  progress,
  navigate,
  onEdit,
  onDelete,
  onAddSubTask,
}) {
  return (
    <div
      className="sub-project-card"
      style={{ borderLeft: `3px solid ${sub.color || "#6366f1"}` }}
    >
      <div className="sub-project-header">
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}
        >
          <div
            className="sub-project-color-dot"
            style={{ background: sub.color || "#6366f1" }}
          />
          <span className="sub-project-name">{sub.name}</span>
          <span className={`badge badge-${sub.status?.toLowerCase()}`}>
            {sub.status}
          </span>
        </div>
        <div className="card-actions">
          <button
            className="btn-icon"
            title="Add Task"
            onClick={() => onAddSubTask(sub)}
          >
            ➕
          </button>
          <button className="btn-icon" onClick={() => onEdit(sub)}>
            ✏️
          </button>
          <button className="btn-icon" onClick={() => onDelete(sub.id)}>
            🗑️
          </button>
          <button
            className="btn-link"
            style={{ fontSize: "11px" }}
            onClick={() => navigate(`/tasks?projectId=${sub.id}`)}
          >
            Tasks →
          </button>
        </div>
      </div>
      {sub.description && (
        <p
          style={{ fontSize: "12px", color: "#888", margin: "4px 0 6px 24px" }}
        >
          {sub.description}
        </p>
      )}
      <div style={{ margin: "6px 0 4px 0" }}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress || 0}%`,
              background: sub.color || "#6366f1",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#888",
          marginTop: "2px",
        }}
      >
        <span>
          {sub.dueDate
            ? `📅 ${new Date(sub.dueDate).toLocaleDateString()}`
            : "No due date"}
        </span>
        <span>{progress || 0}% complete</span>
      </div>
    </div>
  );
}

function ProjectCard({
  p,
  cat,
  progress,
  subProjects,
  subProgress,
  navigate,
  highlightId,
  highlightColor,
  onEdit,
  onDelete,
  onAddSub,
  onEditSub,
  onDeleteSub,
  onAddSubTask,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`project-card ${highlightId === p.id ? "task-row-highlight" : ""}`}
      ref={
        highlightId === p.id
          ? (el) => el?.scrollIntoView({ behavior: "smooth", block: "center" })
          : null
      }
      style={
        highlightId === p.id
          ? {
              "--highlight-color": `#${highlightColor}`,
              "--highlight-bg": `#${highlightColor}11`,
              "--highlight-shadow": `rgba(${parseInt(highlightColor.slice(0, 2), 16)},${parseInt(highlightColor.slice(2, 4), 16)},${parseInt(highlightColor.slice(4, 6), 16)},0.2)`,
            }
          : {}
      }
    >
      <div className="project-card-top">
        <div
          className="project-color-bar"
          style={{ background: p.color || "#6366f1" }}
        />
        <div className="project-card-body">
          <div className="project-card-header">
            <h3
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/tasks?projectId=${p.id}`)}
            >
              {p.name}
            </h3>
            <span className={`badge badge-${p.status?.toLowerCase()}`}>
              {p.status}
            </span>
          </div>
          {cat && (
            <div className="project-category-tag" style={{ color: cat.color }}>
              {cat.icon} {cat.name}
            </div>
          )}
          {p.linkedGoalId && (
            <div
              style={{
                fontSize: "11px",
                color: "#8b5cf6",
                marginBottom: "4px",
              }}
            >
              🎯 Linked to goal
            </div>
          )}
          <p className="project-desc">{p.description}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress || 0}%`,
                background: p.color || "#6366f1",
              }}
            />
          </div>
          <div className="project-card-footer">
            <span>{progress || 0}% complete</span>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              {subProjects.length > 0 && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? "▲" : "▼"} {subProjects.length} Sub-project
                  {subProjects.length > 1 ? "s" : ""}
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSub(p);
                }}
              >
                + Sub-project
              </button>
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(p);
                }}
              >
                ✏️
              </button>
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(p.id);
                }}
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Sub-projects */}
          {expanded && subProjects.length > 0 && (
            <div className="sub-projects-container">
              <div className="sub-projects-label">Sub-projects</div>
              {subProjects.map((sub) => (
                <SubProjectCard
                  key={sub.id}
                  sub={sub}
                  progress={subProgress[sub.id]}
                  navigate={navigate}
                  onEdit={onEditSub}
                  onDelete={onDeleteSub}
                  onAddSubTask={onAddSubTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progress, setProgress] = useState({});
  const [subProjectsMap, setSubProjectsMap] = useState({});
  const [filterCategory, setFilterCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [parentForNew, setParentForNew] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightColor = searchParams.get("hcolor") || "ef4444";
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const catId = searchParams.get("categoryId");
    if (catId) setFilterCategory(catId);
  }, [searchParams]);

  const load = async () => {
    const [projRes, catRes, goalRes] = await Promise.all([
      getProjects(),
      getCategories(),
      getGoals(),
    ]);
    setProjects(projRes.data);
    setCategories(catRes.data);
    setGoals(goalRes.data);
    setProjects(projRes.data);
    setCategories(catRes.data);

    const progressMap = {};
    const subMap = {};

    for (const p of projRes.data) {
      const pr = await getProjectProgress(p.id);
      progressMap[p.id] = pr.data.progress;
      if (!p.parentProjectId) {
        const subs = await getSubProjects(p.id);
        subMap[p.id] = subs.data;
      }
    }
    setProgress(progressMap);
    setSubProjectsMap(subMap);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };
      if (editing) await updateProject(editing.id, payload);
      else await createProject(payload);
      setShowForm(false);
      setEditing(null);
      setParentForNew(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving project");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Delete this project? Sub-projects will also be deleted.")
    ) {
      await deleteProject(id);
      load();
    }
  };

  const handleExportCSV = () => {
    const data = filtered.map((p) => ({
      Name: p.name,
      Status: p.status,
      Category: getCategoryById(p.categoryId)?.name || "None",
      Progress: `${progress[p.id] || 0}%`,
      DueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "None",
      Description: p.description || "",
    }));
    exportToCSV(data, "projects");
  };

  const handleExportPDF = () => {
    const columns = ["Name", "Status", "Category", "Progress", "Due Date"];
    const rows = filtered.map((p) => [
      p.name,
      p.status,
      getCategoryById(p.categoryId)?.name || "None",
      `${progress[p.id] || 0}%`,
      p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "None",
    ]);
    exportToPDF("Projects Report", columns, rows, "projects");
  };

  const getCategoryById = (id) => categories.find((c) => c.id === id);
  const rootProjects = projects.filter((p) => !p.parentProjectId);
  const filtered = filterCategory
    ? rootProjects.filter((p) => p.categoryId === filterCategory)
    : rootProjects;

  const openAddSub = (parentProject) => {
    setParentForNew(parentProject);
    setEditing(null);
    setShowForm(true);
  };

  const openAddSubTask = (subProject) => {
    navigate(`/tasks?projectId=${subProject.id}&newTask=true`);
  };

  const getInitialForForm = () => {
    if (editing) return editing;
    if (parentForNew)
      return {
        name: "",
        description: "",
        color: parentForNew.color || "#6366f1",
        status: "ACTIVE",
        dueDate: "",
        categoryId: parentForNew.categoryId || "",
        parentProjectId: parentForNew.id,
      };
    return null;
  };

  return (
    <div>
      <PageHeader
        icon="📁"
        title="Projects"
        description="Manage your projects and track progress"
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "8px 12px" }}
              onClick={handleExportCSV}
            >
              ⬇️ CSV
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "8px 12px" }}
              onClick={handleExportPDF}
            >
              ⬇️ PDF
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setParentForNew(null);
                setShowForm(true);
              }}
            >
              + New Project
            </button>
          </div>
        }
      />

      <div className="filter-bar">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="cards-grid">
        {filtered.map((p) => {
          const cat = getCategoryById(p.categoryId);
          const subs = subProjectsMap[p.id] || [];
          return (
            <ProjectCard
              key={p.id}
              p={p}
              cat={cat}
              progress={progress[p.id]}
              subProjects={subs}
              subProgress={progress}
              categories={categories}
              navigate={navigate}
              highlightId={highlightId}
              highlightColor={highlightColor}
              onEdit={(proj) => {
                setEditing(proj);
                setParentForNew(null);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onAddSub={openAddSub}
              onEditSub={(proj) => {
                setEditing(proj);
                setParentForNew(null);
                setShowForm(true);
              }}
              onDeleteSub={handleDelete}
              onAddSubTask={openAddSubTask}
            />
          );
        })}
        {filtered.length === 0 && (
          <p className="empty-state">No projects found.</p>
        )}
      </div>

      {showForm && (
        <ProjectForm
          initial={getInitialForForm()}
          categories={categories}
          projects={projects}
          goals={goals}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
            setParentForNew(null);
          }}
        />
      )}
    </div>
  );
}
