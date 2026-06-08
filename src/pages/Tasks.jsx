import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import { getProjects } from "../api/projects";
import PageHeader from "../components/PageHeader";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import TaskComments from "../components/TaskComments";
import TimeTracker from "../components/TimeTracker";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

function TaskForm({ initial, projects, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      title: "",
      description: "",
      projectId: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      tags: "",
      recurrence: "NONE",
    },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{initial ? "Edit Task" : "New Task"}</h2>
        <div className="form-group">
          <label>Title *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Task title"
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
          <label>Project</label>
          <select
            value={form.projectId}
            onChange={(e) => set("projectId", e.target.value)}
          >
            <option value="">-- No Project --</option>
            {projects
              .filter((p) => !p.parentProjectId)
              .map((p) => (
                <optgroup key={p.id} label={p.name}>
                  <option value={p.id}>{p.name}</option>
                  {projects
                    .filter((sp) => sp.parentProjectId === p.id)
                    .map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        ↳ {sp.name}
                      </option>
                    ))}
                </optgroup>
              ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => {
              set("dueDate", e.target.value);
              e.target.blur();
            }}
          />
        </div>
        <div className="form-group">
          <label>Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="e.g. urgent, frontend, bug"
          />
        </div>
        <div className="form-group">
          <label>Recurrence</label>
          <select
            value={form.recurrence}
            onChange={(e) => set("recurrence", e.target.value)}
          >
            <option value="NONE">No Recurrence</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => form.title.trim() && onSave(form)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function groupByTag(tasks) {
  const map = {};
  tasks.forEach((t) => {
    const tags = t.tags?.length > 0 ? t.tags : ["No Tag"];
    tags.forEach((tag) => {
      if (!map[tag]) map[tag] = [];
      map[tag].push(t);
    });
  });
  return Object.entries(map).map(([tag, tasks]) => ({ tag, tasks }));
}

function StatusDropdown({ task, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const statusColor = {
    TODO: "#6366f1",
    IN_PROGRESS: "#f59e0b",
    DONE: "#10b981",
  };
  const statuses = ["TODO", "IN_PROGRESS", "DONE"];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div
        className="status-quick-btn"
        style={{
          background: statusColor[task.status] + "22",
          color: statusColor[task.status],
          border: `1px solid ${statusColor[task.status]}`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {task.status.replace("_", " ")}
        <span style={{ fontSize: "10px", marginLeft: "4px" }}>▼</span>
      </div>
      {open && (
        <div className="status-dropdown">
          {statuses.map((s) => (
            <div
              key={s}
              className={`status-dropdown-item ${task.status === s ? "active" : ""}`}
              style={{ color: statusColor[s] }}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(task, s);
                setOpen(false);
              }}
            >
              <div
                className="task-status-dot"
                style={{ background: statusColor[s] }}
              />
              {s.replace("_", " ")}
              {task.status === s && (
                <span style={{ marginLeft: "auto" }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightColor = searchParams.get("hcolor") || "ef4444";
  const newTaskParam = searchParams.get("newTask");

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "",
  );
  const [filterPriority, setFilterPriority] = useState("");
  const [filterProject, setFilterProject] = useState(
    searchParams.get("projectId") || "",
  );
  const [filterSpecial, setFilterSpecial] = useState(
    searchParams.get("filter") || "",
  );
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(newTaskParam === "true");
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  const load = async () => {
    const [taskRes, projRes] = await Promise.all([getTasks(), getProjects()]);
    setTasks(taskRes.data);
    setProjects(projRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    const payload = {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    if (editing) await updateTask(editing.id, payload);
    else await createTask(payload);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this task?")) {
      await deleteTask(id);
      load();
    }
  };

  const handleStatusUpdate = async (task, newStatus) => {
    await updateTask(task.id, { ...task, status: newStatus });
    load();
  };

  const handleExportCSV = () => {
    const data = filtered.map((t) => ({
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      Project: getProjectName(t.projectId) || "None",
      DueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "None",
      Tags: t.tags?.join(", ") || "",
    }));
    exportToCSV(data, "tasks");
  };

  const handleExportPDF = () => {
    const columns = ["Title", "Status", "Priority", "Project", "Due Date"];
    const rows = filtered.map((t) => [
      t.title,
      t.status,
      t.priority,
      getProjectName(t.projectId) || "None",
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "None",
    ]);
    exportToPDF("Tasks Report", columns, rows, "tasks");
  };

  const getProjectName = (id) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return "";
    if (proj.parentProjectId) {
      const parent = projects.find((p) => p.id === proj.parentProjectId);
      return parent ? `${parent.name} › ${proj.name}` : proj.name;
    }
    return proj.name;
  };

  const now = new Date();
  const getProjectAndSubIds = (projectId) => {
    if (!projectId) return [];
    const subIds = projects
      .filter((p) => p.parentProjectId === projectId)
      .map((p) => p.id);
    return [projectId, ...subIds];
  };

  const filtered = tasks.filter((t) => {
    if (filterSpecial === "overdue") {
      return t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE";
    }
    if (filterSpecial === "today") {
      return (
        t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString()
      );
    }
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterProject) {
      const validIds = getProjectAndSubIds(filterProject);
      if (!validIds.includes(t.projectId)) return false;
    }
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const priorityColor = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444" };
  const statusColor = {
    TODO: "#6366f1",
    IN_PROGRESS: "#f59e0b",
    DONE: "#10b981",
  };

  return (
    <div>
      <PageHeader
        icon="✅"
        title="Tasks"
        description="Track and manage all your tasks"
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
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + New Task
            </button>
          </div>
        }
      />

      <div className="filter-bar">
        <input
          style={{ width: "200px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search tasks..."
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects
            .filter((p) => !p.parentProjectId)
            .map((p) => (
              <optgroup key={p.id} label={p.name}>
                <option value={p.id}>{p.name}</option>
                {projects
                  .filter((sp) => sp.parentProjectId === p.id)
                  .map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      ↳ {sp.name}
                    </option>
                  ))}
              </optgroup>
            ))}
        </select>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              padding: "8px 14px",
              fontSize: "12px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
              background: filterSpecial === "overdue" ? "#ef4444" : "#fff5f5",
              color: filterSpecial === "overdue" ? "#fff" : "#ef4444",
              border: "1px solid #ef4444",
            }}
            onClick={() =>
              setFilterSpecial(filterSpecial === "overdue" ? "" : "overdue")
            }
          >
            ⚠️ Overdue
          </button>
          <button
            style={{
              padding: "8px 14px",
              fontSize: "12px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
              background: filterSpecial === "today" ? "#d97706" : "#fffbeb",
              color: filterSpecial === "today" ? "#fff" : "#d97706",
              border: "1px solid #d97706",
            }}
            onClick={() =>
              setFilterSpecial(filterSpecial === "today" ? "" : "today")
            }
          >
            📅 Due Today
          </button>
          <button
            className={viewMode === "list" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "8px 14px", fontSize: "12px" }}
            onClick={() => setViewMode("list")}
          >
            ☰ List
          </button>
          <button
            className={viewMode === "grouped" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "8px 14px", fontSize: "12px" }}
            onClick={() => setViewMode("grouped")}
          >
            🏷️ By Tag
          </button>
        </div>
      </div>

      {filterSpecial && (
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              background: filterSpecial === "overdue" ? "#fff5f5" : "#fffbeb",
              color: filterSpecial === "overdue" ? "#ef4444" : "#d97706",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              border: `1px solid ${filterSpecial === "overdue" ? "#fecaca" : "#fde68a"}`,
            }}
          >
            {filterSpecial === "overdue"
              ? "⚠️ Showing Overdue Tasks"
              : "📅 Showing Due Today Tasks"}
          </span>
          <button
            className="btn-link"
            style={{ fontSize: "12px" }}
            onClick={() => setFilterSpecial("")}
          >
            Clear Filter ✕
          </button>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="task-list">
          {filtered.map((t) => (
            <div
              className={`task-row ${highlightId === t.id ? "task-row-highlight" : ""}`}
              key={t.id}
              ref={
                highlightId === t.id
                  ? (el) =>
                      el?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
                  : null
              }
              style={
                highlightId === t.id
                  ? {
                      "--highlight-color": `#${highlightColor}`,
                      "--highlight-bg": `#${highlightColor}11`,
                      "--highlight-shadow": `rgba(${parseInt(highlightColor.slice(0, 2), 16)},${parseInt(highlightColor.slice(2, 4), 16)},${parseInt(highlightColor.slice(4, 6), 16)},0.2)`,
                    }
                  : {}
              }
            >
              <div
                className="task-status-dot"
                style={{ background: statusColor[t.status] }}
              />
              <div className="task-info">
                <div className="task-title">
                  {t.title}
                  <button
                    className="btn-icon"
                    style={{ fontSize: "14px", marginLeft: "6px" }}
                    onClick={() => {
                      setEditing({
                        ...t,
                        dueDate: t.dueDate ? t.dueDate.slice(0, 16) : "",
                        tags: t.tags?.join(", ") || "",
                      });
                      setShowForm(true);
                    }}
                  >
                    ✏️
                  </button>
                  <StatusDropdown task={t} onUpdate={handleStatusUpdate} />
                  <TaskComments task={t} onRefresh={load} />
                  <TimeTracker task={t} onRefresh={load} />
                </div>
                <div className="task-meta">
                  {getProjectName(t.projectId) && (
                    <span className="task-project">
                      📁 {getProjectName(t.projectId)}
                    </span>
                  )}
                  {t.dueDate && (
                    <span>📅 {new Date(t.dueDate).toLocaleDateString()}</span>
                  )}
                  {t.recurrence && t.recurrence !== "NONE" && (
                    <span className="task-recurrence-badge">
                      🔁 {t.recurrence}
                    </span>
                  )}
                  {t.tags?.map((tag) => (
                    <span key={tag} className="task-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="task-badges">
                <span
                  className="badge"
                  style={{
                    background: priorityColor[t.priority],
                    color: "#fff",
                  }}
                >
                  {t.priority}
                </span>
              </div>
              <div className="card-actions">
                <button className="btn-icon" onClick={() => handleDelete(t.id)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="empty-state">No tasks found.</p>
          )}
        </div>
      ) : (
        <div>
          {groupByTag(filtered).map(({ tag, tasks }) => (
            <div className="tag-group" key={tag}>
              <div className="tag-group-header">
                <span
                  className="task-tag"
                  style={{ fontSize: "13px", padding: "4px 12px" }}
                >
                  🏷️ {tag}
                </span>
                <span style={{ fontSize: "12px", color: "#888" }}>
                  {tasks.length} task{tasks.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="task-list">
                {tasks.map((t) => (
                  <div
                    className={`task-row ${highlightId === t.id ? "task-row-highlight" : ""}`}
                    key={t.id}
                    ref={
                      highlightId === t.id
                        ? (el) =>
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            })
                        : null
                    }
                    style={
                      highlightId === t.id
                        ? {
                            "--highlight-color": `#${highlightColor}`,
                            "--highlight-bg": `#${highlightColor}11`,
                            "--highlight-shadow": `rgba(${parseInt(highlightColor.slice(0, 2), 16)},${parseInt(highlightColor.slice(2, 4), 16)},${parseInt(highlightColor.slice(4, 6), 16)},0.2)`,
                          }
                        : {}
                    }
                  >
                    <div
                      className="task-status-dot"
                      style={{ background: statusColor[t.status] }}
                    />
                    <div className="task-info">
                      <div className="task-title">
                        {t.title}
                        <button
                          className="btn-icon"
                          style={{ fontSize: "14px", marginLeft: "6px" }}
                          onClick={() => {
                            setEditing({
                              ...t,
                              dueDate: t.dueDate ? t.dueDate.slice(0, 16) : "",
                              tags: t.tags?.join(", ") || "",
                            });
                            setShowForm(true);
                          }}
                        >
                          ✏️
                        </button>
                        <StatusDropdown
                          task={t}
                          onUpdate={handleStatusUpdate}
                        />
                        <TaskComments task={t} onRefresh={load} />
                        <TimeTracker task={t} onRefresh={load} />
                      </div>
                      <div className="task-meta">
                        {getProjectName(t.projectId) && (
                          <span className="task-project">
                            📁 {getProjectName(t.projectId)}
                          </span>
                        )}
                        {t.dueDate && (
                          <span>
                            📅 {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {t.recurrence && t.recurrence !== "NONE" && (
                          <span className="task-recurrence-badge">
                            🔁 {t.recurrence}
                          </span>
                        )}
                        {t.tags?.map((tag) => (
                          <span key={tag} className="task-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="task-badges">
                      <span
                        className="badge"
                        style={{
                          background: priorityColor[t.priority],
                          color: "#fff",
                        }}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(t.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="empty-state">No tasks found.</p>
          )}
        </div>
      )}

      {showForm && (
        <TaskForm
          initial={editing}
          projects={projects}
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
