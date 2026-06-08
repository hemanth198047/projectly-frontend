import { useState, useEffect } from "react";
import {
  getGoals,
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  addSubGoal,
  updateSubGoal,
  deleteSubGoal,
  addStep,
  toggleStep,
  deleteStep,
} from "../api/goals";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";

const STATUSES = ["ACTIVE", "ACHIEVED"];

function GoalForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { title: "", description: "", status: "ACTIVE", targetDate: "" },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{initial ? "Edit Goal" : "New Goal"}</h2>
        <div className="form-group">
          <label>Title *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Goal title"
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
          <label>Target Date</label>
          <input
            type="datetime-local"
            value={form.targetDate}
            onChange={(e) => {
              set("targetDate", e.target.value);
              e.target.blur();
            }}
            disabled={form.noDate}
            style={{ flex: 1, opacity: form.noDate ? 0.4 : 1 }}
          />
        </div>
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

function ProgressModal({ goal, onSave, onCancel }) {
  const [progress, setProgress] = useState(goal.progress || 0);
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Update Progress</h2>
        <p style={{ marginBottom: "16px", color: "#888" }}>{goal.title}</p>
        <div className="form-group">
          <label>Progress: {progress}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            style={{ padding: "0", border: "none" }}
          />
        </div>
        <div className="progress-bar" style={{ marginBottom: "16px" }}>
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, background: "#6366f1" }}
          />
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => onSave(progress)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function SubGoalForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { title: "", description: "", status: "ACTIVE" },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{initial ? "Edit Sub-Goal" : "New Sub-Goal"}</h2>
        <div className="form-group">
          <label>Title *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Sub-goal title"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="Optional description"
          />
        </div>
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

function StepItem({ step, onToggle, onDelete }) {
  return (
    <div className="step-item">
      <div className="step-checkbox-area" onClick={onToggle}>
        <div className={`step-checkbox ${step.completed ? "checked" : ""}`}>
          {step.completed && <span>✓</span>}
        </div>
        <span className={`step-title ${step.completed ? "step-done" : ""}`}>
          {step.title}
        </span>
      </div>
      <button
        className="btn-icon"
        style={{ fontSize: "12px" }}
        onClick={onDelete}
      >
        🗑️
      </button>
    </div>
  );
}

function AddStepInline({ onAdd }) {
  const [title, setTitle] = useState("");
  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
    }
  };
  return (
    <div className="step-add-row">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a step..."
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        style={{ fontSize: "12px", padding: "6px 10px" }}
      />
      <button
        className="btn-primary"
        style={{ fontSize: "12px", padding: "6px 12px", whiteSpace: "nowrap" }}
        onClick={handleAdd}
      >
        + Add
      </button>
    </div>
  );
}

function SubGoalCard({ goalId, subGoal, onEdit, onDelete, onRefresh }) {
  const [expanded, setExpanded] = useState(false);

  const handleToggleStep = async (stepId) => {
    await toggleStep(goalId, subGoal.id, stepId);
    onRefresh();
  };

  const handleDeleteStep = async (stepId) => {
    if (window.confirm("Delete this step?")) {
      await deleteStep(goalId, subGoal.id, stepId);
      onRefresh();
    }
  };

  const handleAddStep = async (title) => {
    await addStep(goalId, subGoal.id, { title });
    onRefresh();
  };

  const progress =
    subGoal.steps?.length > 0
      ? Math.round(
          (subGoal.steps.filter((s) => s.completed).length /
            subGoal.steps.length) *
            100,
        )
      : 0;

  const doneCount = subGoal.steps?.filter((s) => s.completed).length || 0;
  const totalCount = subGoal.steps?.length || 0;

  return (
    <div className="subgoal-card">
      <div className="subgoal-header" onClick={() => setExpanded((e) => !e)}>
        <div className="subgoal-title-row">
          <div
            className={`subgoal-status-dot ${subGoal.status?.toLowerCase()}`}
          />
          <span className="subgoal-title">{subGoal.title}</span>
          <span className={`badge badge-${subGoal.status?.toLowerCase()}`}>
            {subGoal.status}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#888" }}>
            {doneCount}/{totalCount} steps
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: progress === 100 ? "#10b981" : "#6366f1",
            }}
          >
            {progress}%
          </span>
          <button
            className="btn-icon"
            style={{ fontSize: "13px" }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(subGoal);
            }}
          >
            ✏️
          </button>
          <button
            className="btn-icon"
            style={{ fontSize: "13px" }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(subGoal.id);
            }}
          >
            🗑️
          </button>
          <span style={{ color: "#aaa", fontSize: "11px" }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {subGoal.description && (
        <p
          style={{ fontSize: "12px", color: "#888", margin: "4px 0 6px 20px" }}
        >
          {subGoal.description}
        </p>
      )}

      <div className="progress-bar" style={{ margin: "6px 0" }}>
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            background: progress === 100 ? "#10b981" : "#6366f1",
          }}
        />
      </div>

      {expanded && (
        <div className="steps-container">
          <div className="steps-label">Steps</div>
          {subGoal.steps?.length > 0 ? (
            subGoal.steps.map((step) => (
              <StepItem
                key={step.id}
                step={step}
                onToggle={() => handleToggleStep(step.id)}
                onDelete={() => handleDeleteStep(step.id)}
              />
            ))
          ) : (
            <p style={{ fontSize: "12px", color: "#aaa", padding: "6px 0" }}>
              No steps yet.
            </p>
          )}
          <AddStepInline onAdd={handleAddStep} />
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, onUpdateProgress, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showSubGoalForm, setShowSubGoalForm] = useState(false);
  const [editingSubGoal, setEditingSubGoal] = useState(null);

  const handleAddSubGoal = async (form) => {
    await addSubGoal(goal.id, form);
    setShowSubGoalForm(false);
    onRefresh();
  };

  const handleEditSubGoal = async (form) => {
    await updateSubGoal(goal.id, editingSubGoal.id, form);
    setEditingSubGoal(null);
    onRefresh();
  };

  const handleDeleteSubGoal = async (subGoalId) => {
    if (window.confirm("Delete this sub-goal and all its steps?")) {
      await deleteSubGoal(goal.id, subGoalId);
      onRefresh();
    }
  };

  const subGoals = goal.subGoals || [];
  const totalSteps = subGoals.reduce(
    (acc, sg) => acc + (sg.steps?.length || 0),
    0,
  );
  const doneSteps = subGoals.reduce(
    (acc, sg) => acc + (sg.steps?.filter((s) => s.completed).length || 0),
    0,
  );

  return (
    <div className="goal-card">
      <div className="goal-card-header">
        <h3>{goal.title}</h3>
        <span className={`badge badge-${goal.status?.toLowerCase()}`}>
          {goal.status}
        </span>
      </div>

      <p className="project-desc">{goal.description}</p>

      {goal.targetDate && (
        <div className="goal-date">
          🎯 Target: {new Date(goal.targetDate).toLocaleDateString()}
        </div>
      )}

      {/* Overall Progress */}
      <div className="goal-progress-label">
        <span>Overall Progress</span>
        <span>{goal.progress || 0}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${goal.progress || 0}%`,
            background: goal.progress === 100 ? "#10b981" : "#6366f1",
          }}
        />
      </div>

      {/* Sub-goals summary */}
      {subGoals.length > 0 && (
        <div className="goal-stats-row">
          <span>
            📋 {subGoals.length} sub-goal{subGoals.length > 1 ? "s" : ""}
          </span>
          <span>
            🪜 {doneSteps}/{totalSteps} steps done
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="goal-card-footer">
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 10px" }}
            onClick={onUpdateProgress}
          >
            Update Progress
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 10px" }}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "▲" : "▼"}{" "}
            {subGoals.length > 0 ? `${subGoals.length} Sub-Goals` : "Sub-Goals"}
          </button>
        </div>
        <div className="card-actions">
          <button className="btn-icon" onClick={() => onEdit(goal)}>
            ✏️
          </button>
          <button className="btn-icon" onClick={() => onDelete(goal.id)}>
            🗑️
          </button>
        </div>
      </div>

      {/* Sub-goals section */}
      {expanded && (
        <div className="subgoals-container">
          <div className="subgoals-header">
            <span className="subgoals-label">Sub-Goals</span>
            <button
              className="btn-primary"
              style={{ fontSize: "11px", padding: "5px 10px" }}
              onClick={() => setShowSubGoalForm(true)}
            >
              + Add Sub-Goal
            </button>
          </div>

          {subGoals.length > 0 ? (
            subGoals.map((sg) => (
              <SubGoalCard
                key={sg.id}
                goalId={goal.id}
                subGoal={sg}
                onEdit={(s) => setEditingSubGoal(s)}
                onDelete={handleDeleteSubGoal}
                onRefresh={onRefresh}
              />
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p
                style={{
                  color: "#aaa",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                No sub-goals yet.
              </p>
              <button
                className="btn-primary"
                style={{ fontSize: "12px" }}
                onClick={() => setShowSubGoalForm(true)}
              >
                + Add First Sub-Goal
              </button>
            </div>
          )}
        </div>
      )}

      {showSubGoalForm && (
        <SubGoalForm
          onSave={handleAddSubGoal}
          onCancel={() => setShowSubGoalForm(false)}
        />
      )}
      {editingSubGoal && (
        <SubGoalForm
          initial={editingSubGoal}
          onSave={handleEditSubGoal}
          onCancel={() => setEditingSubGoal(null)}
        />
      )}
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showProgress, setShowProgress] = useState(null);
  const [editing, setEditing] = useState(null);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightColor = searchParams.get("hcolor") || "ef4444";
  const filterSpecial = searchParams.get("filter") || "";

  const load = async () => {
    const res = await getGoals();
    setGoals(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    const payload = {
      ...form,
      targetDate: form.targetDate
        ? new Date(form.targetDate).toISOString()
        : null,
    };
    if (editing) await updateGoal(editing.id, payload);
    else await createGoal(payload);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleProgress = async (progress) => {
    await updateGoalProgress(showProgress.id, progress);
    setShowProgress(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this goal?")) {
      await deleteGoal(id);
      load();
    }
  };

  const handleExportCSV = () => {
    const data = filtered.map((g) => ({
      Title: g.title,
      Status: g.status,
      Progress: `${g.progress || 0}%`,
      TargetDate: g.targetDate
        ? new Date(g.targetDate).toLocaleDateString()
        : "None",
      SubGoals: g.subGoals?.length || 0,
      Description: g.description || "",
    }));
    exportToCSV(data, "goals");
  };

  const handleExportPDF = () => {
    const columns = ["Title", "Status", "Progress", "Target Date", "Sub-Goals"];
    const rows = filtered.map((g) => [
      g.title,
      g.status,
      `${g.progress || 0}%`,
      g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "None",
      g.subGoals?.length || 0,
    ]);
    exportToPDF("Goals Report", columns, rows, "goals");
  };

  const filtered = goals.filter((g) => {
    if (filterSpecial === "overdue") {
      return (
        g.targetDate &&
        new Date(g.targetDate) < new Date() &&
        g.status !== "ACHIEVED"
      );
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        icon="🎯"
        title="Goals"
        description="Set goals, create sub-goals, and track steps to achieve them"
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
              + New Goal
            </button>
          </div>
        }
      />
      {filterSpecial === "overdue" && (
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
              background: "#fff5f5",
              color: "#ef4444",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              border: "1px solid #fecaca",
            }}
          >
            ⚠️ Showing Overdue Goals
          </span>
        </div>
      )}

      <div className="cards-grid">
        {filtered.map((g) => (
          <div
            key={g.id}
            className={highlightId === g.id ? "task-row-highlight" : ""}
            ref={
              highlightId === g.id
                ? (el) =>
                    el?.scrollIntoView({ behavior: "smooth", block: "center" })
                : null
            }
            style={
              highlightId === g.id
                ? {
                    "--highlight-color": `#${highlightColor}`,
                    "--highlight-bg": `#${highlightColor}11`,
                    "--highlight-shadow": `rgba(${parseInt(highlightColor.slice(0, 2), 16)},${parseInt(highlightColor.slice(2, 4), 16)},${parseInt(highlightColor.slice(4, 6), 16)},0.2)`,
                  }
                : {}
            }
          >
            <GoalCard
              goal={g}
              onEdit={(goal) => {
                setEditing({
                  ...goal,
                  targetDate: goal.targetDate
                    ? goal.targetDate.slice(0, 16)
                    : "",
                });
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onUpdateProgress={() => setShowProgress(g)}
              onRefresh={load}
            />
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="empty-state">No goals yet. Set your first goal!</p>
        )}
      </div>

      {showForm && (
        <GoalForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {showProgress && (
        <ProgressModal
          goal={showProgress}
          onSave={handleProgress}
          onCancel={() => setShowProgress(null)}
        />
      )}
    </div>
  );
}
