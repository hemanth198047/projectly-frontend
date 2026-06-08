import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../api/dashboard";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "../components/PageHeader";

import client from "../api/client";

const priorityColor = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444" };
const statusColor = {
  TODO: "#6366f1",
  IN_PROGRESS: "#f59e0b",
  DONE: "#10b981",
};

function TaskPill({ task }) {
  return (
    <div className="task-pill">
      <div
        className="task-status-dot"
        style={{ background: statusColor[task.status] }}
      />
      <span className="task-pill-title">{task.title}</span>
      <span
        className="badge"
        style={{ background: priorityColor[task.priority], color: "#fff" }}
      >
        {task.priority}
      </span>
      {task.dueDate && (
        <span className="task-pill-date">
          📅 {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

function TaskStatusCard({ title, color, bg, tasks }) {
  const [open, setOpen] = useState(true);
  if (!tasks || tasks.length === 0) return null;
  return (
    <div
      className="task-status-card"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div
        className="task-status-card-header"
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: "pointer" }}
      >
        <span style={{ color, fontWeight: 600, fontSize: "12px" }}>
          {title}
        </span>
        <span className="task-status-badge" style={{ background: bg, color }}>
          {tasks.length}
        </span>
        <span style={{ color: "#aaa", fontSize: "11px", marginLeft: "auto" }}>
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open && (
        <div className="task-status-card-body">
          {tasks.map((t) => (
            <TaskPill key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, allTasks, navigate }) {
  const [open, setOpen] = useState(false);
  const [subsOpen, setSubsOpen] = useState(false);

  const projectTasks = allTasks.filter((t) => t.projectId === project.id);
  const todoTasks = projectTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = projectTasks.filter(
    (t) => t.status === "IN_PROGRESS",
  );
  const doneTasks = projectTasks.filter((t) => t.status === "DONE");

  const subProjects = project.subProjects || [];

  return (
    <div
      className="nested-project-card"
      style={{ borderLeft: `4px solid ${project.color || "#6366f1"}` }}
    >
      {/* Project Header */}
      <div className="nested-project-header" onClick={() => setOpen((o) => !o)}>
        <div className="nested-project-title">
          <span style={{ fontWeight: 700, fontSize: "13px" }}>
            {project.name}
          </span>
          {project.categoryName && (
            <span
              className="project-cat-tag"
              style={{ color: project.categoryColor }}
            >
              {project.categoryIcon} {project.categoryName}
            </span>
          )}
          {project.description && (
            <span style={{ fontSize: "11px", color: "#888" }}>
              {project.description}
            </span>
          )}
        </div>
        <div className="nested-project-meta">
          <span className={`badge badge-${project.status?.toLowerCase()}`}>
            {project.status}
          </span>
          <span style={{ color: "#aaa", fontSize: "11px" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Project Stats Row */}
      <div className="project-details-row">
        <div className="project-detail-item">
          <span className="project-detail-label">Due</span>
          <span className="project-detail-value">
            {project.dueDate
              ? new Date(project.dueDate).toLocaleDateString()
              : "—"}
          </span>
        </div>
        <div className="project-detail-item">
          <span className="project-detail-label">Tasks</span>
          <span className="project-detail-value">{projectTasks.length}</span>
        </div>
        <div className="project-detail-item">
          <span className="project-detail-label">Done</span>
          <span className="project-detail-value" style={{ color: "#10b981" }}>
            {doneTasks.length}
          </span>
        </div>
        <div className="project-detail-item">
          <span className="project-detail-label">Progress</span>
          <span
            className="project-detail-value"
            style={{ color: project.color || "#6366f1", fontWeight: 700 }}
          >
            {project.progress}%
          </span>
        </div>
        {subProjects.length > 0 && (
          <div className="project-detail-item">
            <span className="project-detail-label">Sub-projects</span>
            <span className="project-detail-value" style={{ color: "#8b5cf6" }}>
              {subProjects.length}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar" style={{ margin: "0 0 8px 0" }}>
        <div
          className="progress-fill"
          style={{
            width: `${project.progress}%`,
            background: project.color || "#6366f1",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: open ? "8px" : "0",
        }}
      >
        {subProjects.length > 0 && (
          <button
            className="btn-link"
            style={{ fontSize: "11px", color: "#8b5cf6" }}
            onClick={(e) => {
              e.stopPropagation();
              setSubsOpen((s) => !s);
            }}
          >
            {subsOpen ? "▲" : "▼"} {subProjects.length} Sub-project
            {subProjects.length > 1 ? "s" : ""}
          </button>
        )}
        <button
          className="btn-link"
          style={{ fontSize: "11px", marginLeft: "auto" }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tasks?projectId=${project.id}`);
          }}
        >
          View Tasks →
        </button>
      </div>

      {/* Sub-projects */}
      {subsOpen && subProjects.length > 0 && (
        <div
          style={{
            margin: "8px 0",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "4px",
            }}
          >
            Sub-projects
          </div>
          {subProjects.map((sub) => {
            const subTasks = allTasks.filter((t) => t.projectId === sub.id);
            const subDone = subTasks.filter((t) => t.status === "DONE").length;
            const subProgress =
              subTasks.length > 0
                ? Math.round((subDone / subTasks.length) * 100)
                : 0;
            return (
              <div
                key={sub.id}
                className="dashboard-sub-project"
                style={{ borderLeft: `3px solid ${sub.color || "#8b5cf6"}` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: sub.color || "#8b5cf6",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>
                      {sub.name}
                    </span>
                    <span
                      className={`badge badge-${sub.status?.toLowerCase()}`}
                      style={{ fontSize: "10px" }}
                    >
                      {sub.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: sub.color || "#8b5cf6",
                        fontWeight: 700,
                      }}
                    >
                      {subProgress}%
                    </span>
                    <button
                      className="btn-link"
                      style={{ fontSize: "10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks?projectId=${sub.id}`);
                      }}
                    >
                      Tasks →
                    </button>
                  </div>
                </div>
                <div className="progress-bar" style={{ height: "4px" }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${subProgress}%`,
                      background: sub.color || "#8b5cf6",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#aaa",
                    marginTop: "3px",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <span>{subTasks.length} tasks</span>
                  <span>{subDone} done</span>
                  {sub.dueDate && (
                    <span>📅 {new Date(sub.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task breakdown */}
      {open && (
        <div className="nested-task-groups">
          <TaskStatusCard
            title="Todo"
            color="#6366f1"
            bg="#e0e7ff"
            tasks={todoTasks}
          />
          <TaskStatusCard
            title="In Progress"
            color="#f59e0b"
            bg="#fef3c7"
            tasks={inProgressTasks}
          />
          <TaskStatusCard
            title="Completed"
            color="#10b981"
            bg="#d1fae5"
            tasks={doneTasks}
          />
          {projectTasks.length === 0 && (
            <p
              className="empty-state"
              style={{ fontSize: "12px", padding: "8px 0" }}
            >
              No tasks.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
function GoalCard({ goal }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="nested-project-card"
      style={{ borderLeft: "4px solid #8b5cf6" }}
    >
      <div className="nested-project-header" onClick={() => setOpen((o) => !o)}>
        <div className="nested-project-title">
          <span style={{ fontWeight: 700, fontSize: "13px" }}>
            {goal.title}
          </span>
          {goal.description && (
            <span style={{ fontSize: "11px", color: "#888" }}>
              {goal.description}
            </span>
          )}
        </div>
        <div className="nested-project-meta">
          <span className={`badge badge-${goal.status?.toLowerCase()}`}>
            {goal.status}
          </span>
          <span style={{ color: "#aaa", fontSize: "11px" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>
      <div className="project-details-row">
        <div className="project-detail-item">
          <span className="project-detail-label">Target</span>
          <span className="project-detail-value">
            {goal.targetDate
              ? new Date(goal.targetDate).toLocaleDateString()
              : "—"}
          </span>
        </div>
        <div className="project-detail-item">
          <span className="project-detail-label">Progress</span>
          <span
            className="project-detail-value"
            style={{ color: "#8b5cf6", fontWeight: 700 }}
          >
            {goal.progress || 0}%
          </span>
        </div>
        <div className="project-detail-item">
          <span className="project-detail-label">Remaining</span>
          <span className="project-detail-value" style={{ color: "#ef4444" }}>
            {100 - (goal.progress || 0)}%
          </span>
        </div>
      </div>
      {open && (
        <div className="progress-bar" style={{ marginTop: "8px" }}>
          <div
            className="progress-fill"
            style={{
              width: `${goal.progress || 0}%`,
              background: goal.progress === 100 ? "#10b981" : "#8b5cf6",
            }}
          />
        </div>
      )}
    </div>
  );
}

function CompletionBreakdown({ summary, navigate }) {
  const categoryStats = Object.values(summary.categoryStats || {});
  const overall =
    summary.totalTasks > 0
      ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
      : 0;
  return (
    <div className="completion-breakdown-panel">
      <div className="completion-overall">
        <div className="completion-row-header">
          <span style={{ fontWeight: 700 }}>Overall</span>
          <span
            style={{
              fontWeight: 700,
              color:
                overall >= 75
                  ? "#10b981"
                  : overall >= 40
                    ? "#f59e0b"
                    : "#ef4444",
            }}
          >
            {overall}%
          </span>
        </div>
        <div className="completion-bar-track">
          <div
            className="completion-bar-fill"
            style={{
              width: `${overall}%`,
              background:
                overall >= 75
                  ? "#10b981"
                  : overall >= 40
                    ? "#f59e0b"
                    : "#ef4444",
            }}
          />
        </div>
        <div className="completion-sub-row">
          <span>✅ {summary.doneTasks} done</span>
          <span>⚡ {summary.inProgressTasks} in progress</span>
          <span>🔵 {summary.todoTasks} todo</span>
          <span>📋 {summary.totalTasks} total</span>
        </div>
      </div>
      {categoryStats.length > 0 && (
        <div className="completion-section">
          <div className="completion-section-title">By Category</div>
          {categoryStats.map((cat) => (
            <div className="completion-category-block" key={cat.categoryId}>
              <div className="completion-row-header">
                <span style={{ color: cat.categoryColor, fontWeight: 600 }}>
                  {cat.categoryIcon} {cat.categoryName}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      cat.completionRate >= 75
                        ? "#10b981"
                        : cat.completionRate >= 40
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                >
                  {cat.completionRate}%
                </span>
              </div>
              <div className="completion-bar-track">
                <div
                  className="completion-bar-fill"
                  style={{
                    width: `${cat.completionRate}%`,
                    background: cat.categoryColor || "#6366f1",
                  }}
                />
              </div>
              <div className="completion-sub-row">
                <span>📁 {cat.totalProjects} projects</span>
                <span>
                  ✅ {cat.doneTasks} / {cat.totalTasks} tasks
                </span>
              </div>
              {summary.projectsWithProgress
                ?.filter((p) => p.categoryName === cat.categoryName)
                .map((p) => (
                  <div
                    className="completion-project-block"
                    key={p.id}
                    onClick={() => navigate(`/tasks?projectId=${p.id}`)}
                    style={{ borderLeft: `3px solid ${p.color || "#6366f1"}` }}
                  >
                    <div className="completion-row-header">
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: p.color || "#6366f1",
                        }}
                      >
                        {p.progress}%
                      </span>
                    </div>
                    <div
                      className="completion-bar-track"
                      style={{ height: "4px" }}
                    >
                      <div
                        className="completion-bar-fill"
                        style={{
                          width: `${p.progress}%`,
                          background: p.color || "#6366f1",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
      {summary.projectsWithProgress?.filter((p) => !p.categoryName).length >
        0 && (
        <div className="completion-section">
          <div className="completion-section-title">Uncategorized</div>
          {summary.projectsWithProgress
            .filter((p) => !p.categoryName)
            .map((p) => (
              <div
                className="completion-project-block"
                key={p.id}
                onClick={() => navigate(`/tasks?projectId=${p.id}`)}
                style={{ borderLeft: `3px solid ${p.color || "#6366f1"}` }}
              >
                <div className="completion-row-header">
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: p.color || "#6366f1",
                    }}
                  >
                    {p.progress}%
                  </span>
                </div>
                <div className="completion-bar-track" style={{ height: "4px" }}>
                  <div
                    className="completion-bar-fill"
                    style={{
                      width: `${p.progress}%`,
                      background: p.color || "#6366f1",
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function ChartsPanel({ summary, navigate, activeChart, setActiveChart }) {
  const taskStatusData = [
    { name: "Todo", value: summary.todoTasks || 0, color: "#6366f1" },
    {
      name: "In Progress",
      value: summary.inProgressTasks || 0,
      color: "#f59e0b",
    },
    { name: "Done", value: summary.doneTasks || 0, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const projectData = (summary.projectsWithProgress || []).map((p) => ({
    id: p.id,
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    progress: p.progress,
    color: p.color || "#6366f1",
  }));

  const goalData = (summary.activeGoalList || []).map((g) => ({
    id: g.id,
    name: g.title.length > 14 ? g.title.slice(0, 14) + "…" : g.title,
    progress: g.progress || 0,
  }));

  const categoryData = Object.values(summary.categoryStats || {}).map((c) => ({
    id: c.categoryId,
    name: c.categoryName,
    rate: c.completionRate,
    color: c.categoryColor || "#6366f1",
  }));

  const handlePieClick = (entry, i) => {
    const allStatuses = taskStatusData.map((d) => {
      if (d.name === "Todo") return "TODO";
      if (d.name === "In Progress") return "IN_PROGRESS";
      return "DONE";
    });
    const status = allStatuses[i];
    if (status) navigate(`/tasks?status=${status}`);
  };

  const chartTabs = [
    { key: "tasks", label: "✅ Tasks" },
    { key: "projects", label: "📁 Projects" },
    { key: "goals", label: "🎯 Goals" },
    { key: "categories", label: "🏷️ Categories" },
  ];

  return (
    <div className="dashboard-left-panel" style={{ height: "100%" }}>
      <div className="tab-bar">
        {chartTabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeChart === t.key ? "tab-active" : ""}`}
            onClick={() => setActiveChart(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* Task Status */}
        {activeChart === "tasks" && (
          <div>
            <div className="chart-card-title" style={{ marginBottom: "12px" }}>
              Task Status Distribution
            </div>
            {taskStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={false}
                      stroke="none"
                    >
                      {taskStatusData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          stroke="none"
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} tasks`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                  }}
                >
                  {taskStatusData.map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => handlePieClick(entry, i)}
                      style={{
                        background: entry.color + "22",
                        color: entry.color,
                        border: `1px solid ${entry.color}`,
                        borderRadius: "20px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {entry.name}: {entry.value}
                    </button>
                  ))}
                </div>
                <div
                  className="chart-summary-grid"
                  style={{ marginTop: "20px" }}
                >
                  <div
                    className="chart-summary-item"
                    style={{
                      borderLeft: "3px solid #6366f1",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/tasks?status=TODO")}
                  >
                    <span
                      className="chart-summary-value"
                      style={{ color: "#6366f1" }}
                    >
                      {summary.todoTasks}
                    </span>
                    <span className="chart-summary-label">Todo ↗</span>
                  </div>
                  <div
                    className="chart-summary-item"
                    style={{
                      borderLeft: "3px solid #f59e0b",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/tasks?status=IN_PROGRESS")}
                  >
                    <span
                      className="chart-summary-value"
                      style={{ color: "#f59e0b" }}
                    >
                      {summary.inProgressTasks}
                    </span>
                    <span className="chart-summary-label">In Progress ↗</span>
                  </div>
                  <div
                    className="chart-summary-item"
                    style={{
                      borderLeft: "3px solid #10b981",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/tasks?status=DONE")}
                  >
                    <span
                      className="chart-summary-value"
                      style={{ color: "#10b981" }}
                    >
                      {summary.doneTasks}
                    </span>
                    <span className="chart-summary-label">Completed ↗</span>
                  </div>
                  <div
                    className="chart-summary-item"
                    style={{ borderLeft: "3px solid #ec4899" }}
                  >
                    <span
                      className="chart-summary-value"
                      style={{ color: "#ec4899" }}
                    >
                      {summary.totalTasks > 0
                        ? Math.round(
                            (summary.doneTasks / summary.totalTasks) * 100,
                          )
                        : 0}
                      %
                    </span>
                    <span className="chart-summary-label">Completion Rate</span>
                  </div>
                  <div
                    className="chart-summary-item"
                    style={{
                      borderLeft: "3px solid #ef4444",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/tasks?filter=overdue")}
                  >
                    <span
                      className="chart-summary-value"
                      style={{ color: "#ef4444" }}
                    >
                      {summary.overdueTasks?.length || 0}
                    </span>
                    <span className="chart-summary-label">Overdue ↗</span>
                  </div>
                  <div
                    className="chart-summary-item"
                    style={{
                      borderLeft: "3px solid #d97706",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/tasks?filter=today")}
                  >
                    <span
                      className="chart-summary-value"
                      style={{ color: "#d97706" }}
                    >
                      {summary.todayTasks?.length || 0}
                    </span>
                    <span className="chart-summary-label">Due Today ↗</span>
                  </div>
                </div>
              </>
            ) : (
              <p
                className="empty-state"
                style={{ textAlign: "center", padding: "60px 0" }}
              >
                No tasks yet.
              </p>
            )}
          </div>
        )}

        {/* Project Progress */}
        {activeChart === "projects" && (
          <div>
            <div className="chart-card-title" style={{ marginBottom: "12px" }}>
              Project Progress
            </div>
            {projectData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, projectData.length * 44)}
              >
                <BarChart
                  data={projectData}
                  layout="vertical"
                  margin={{ left: 8, right: 32 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip formatter={(v) => [`${v}%`, "Progress"]} />
                  <Bar
                    dataKey="progress"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(entry) =>
                      navigate(`/tasks?projectId=${entry.id}`)
                    }
                  >
                    {projectData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p
                className="empty-state"
                style={{ textAlign: "center", padding: "60px 0" }}
              >
                No projects yet.
              </p>
            )}
            <div className="chart-summary-grid" style={{ marginTop: "16px" }}>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #6366f1", cursor: "pointer" }}
                onClick={() => navigate("/projects")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#6366f1" }}
                >
                  {summary.totalProjects}
                </span>
                <span className="chart-summary-label">Total ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #10b981", cursor: "pointer" }}
                onClick={() => navigate("/projects")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#10b981" }}
                >
                  {summary.activeProjects}
                </span>
                <span className="chart-summary-label">Active ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #f59e0b", cursor: "pointer" }}
                onClick={() => navigate("/projects")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#f59e0b" }}
                >
                  {summary.projectsWithProgress?.filter(
                    (p) => p.status === "PAUSED",
                  ).length || 0}
                </span>
                <span className="chart-summary-label">Paused ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #888", cursor: "pointer" }}
                onClick={() => navigate("/projects")}
              >
                <span className="chart-summary-value" style={{ color: "#888" }}>
                  {summary.projectsWithProgress?.filter(
                    (p) => p.status === "DONE",
                  ).length || 0}
                </span>
                <span className="chart-summary-label">Done ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #ef4444", cursor: "pointer" }}
                onClick={() => navigate("/tasks?filter=overdue")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#ef4444" }}
                >
                  {summary.overdueProjects?.length || 0}
                </span>
                <span className="chart-summary-label">Overdue ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #ec4899" }}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#ec4899" }}
                >
                  {summary.totalTasks > 0
                    ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
                    : 0}
                  %
                </span>
                <span className="chart-summary-label">Task Rate</span>
              </div>
            </div>
          </div>
        )}

        {/* Goal Progress */}
        {activeChart === "goals" && (
          <div>
            <div className="chart-card-title" style={{ marginBottom: "12px" }}>
              Goal Progress
            </div>
            {goalData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, goalData.length * 44)}
              >
                <BarChart
                  data={goalData}
                  layout="vertical"
                  margin={{ left: 8, right: 32 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip formatter={(v) => [`${v}%`, "Progress"]} />
                  <Bar
                    dataKey="progress"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(entry) =>
                      navigate(`/goals?highlight=${entry.id}&hcolor=8b5cf6`)
                    }
                  >
                    {goalData.map((_, i) => (
                      <Cell key={i} fill="#8b5cf6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p
                className="empty-state"
                style={{ textAlign: "center", padding: "60px 0" }}
              >
                No active goals.
              </p>
            )}
            <div className="chart-summary-grid" style={{ marginTop: "16px" }}>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #8b5cf6", cursor: "pointer" }}
                onClick={() => navigate("/goals")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#8b5cf6" }}
                >
                  {summary.totalGoals}
                </span>
                <span className="chart-summary-label">Total ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #10b981", cursor: "pointer" }}
                onClick={() => navigate("/goals")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#10b981" }}
                >
                  {summary.achievedGoals}
                </span>
                <span className="chart-summary-label">Achieved ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #6366f1", cursor: "pointer" }}
                onClick={() => navigate("/goals")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#6366f1" }}
                >
                  {summary.activeGoals}
                </span>
                <span className="chart-summary-label">Active ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #ef4444", cursor: "pointer" }}
                onClick={() => navigate("/goals?filter=overdue")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#ef4444" }}
                >
                  {summary.overdueGoals?.length || 0}
                </span>
                <span className="chart-summary-label">Overdue ↗</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Completion */}
        {activeChart === "categories" && (
          <div>
            <div className="chart-card-title" style={{ marginBottom: "12px" }}>
              Category Completion
            </div>
            {categoryData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, categoryData.length * 44)}
              >
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ left: 8, right: 32 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip formatter={(v) => [`${v}%`, "Completion"]} />
                  <Bar
                    dataKey="rate"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(entry) =>
                      navigate(`/projects?categoryId=${entry.id}`)
                    }
                  >
                    {categoryData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                        style={{ outline: "none" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p
                className="empty-state"
                style={{ textAlign: "center", padding: "60px 0" }}
              >
                No categories yet.
              </p>
            )}
            <div className="chart-summary-grid" style={{ marginTop: "16px" }}>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #6366f1", cursor: "pointer" }}
                onClick={() => navigate("/categories")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#6366f1" }}
                >
                  {Object.values(summary.categoryStats || {}).length}
                </span>
                <span className="chart-summary-label">Categories ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #10b981", cursor: "pointer" }}
                onClick={() => navigate("/projects")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#10b981" }}
                >
                  {summary.totalProjects}
                </span>
                <span className="chart-summary-label">Projects ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #f59e0b", cursor: "pointer" }}
                onClick={() => navigate("/tasks")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#f59e0b" }}
                >
                  {summary.totalTasks}
                </span>
                <span className="chart-summary-label">Tasks ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #8b5cf6", cursor: "pointer" }}
                onClick={() => navigate("/goals")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#8b5cf6" }}
                >
                  {summary.totalGoals}
                </span>
                <span className="chart-summary-label">Goals ↗</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #ec4899" }}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#ec4899" }}
                >
                  {summary.totalTasks > 0
                    ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
                    : 0}
                  %
                </span>
                <span className="chart-summary-label">Overall Rate</span>
              </div>
              <div
                className="chart-summary-item"
                style={{ borderLeft: "3px solid #ef4444", cursor: "pointer" }}
                onClick={() => navigate("/tasks?filter=overdue")}
              >
                <span
                  className="chart-summary-value"
                  style={{ color: "#ef4444" }}
                >
                  {(summary.overdueTasks?.length || 0) +
                    (summary.overdueProjects?.length || 0) +
                    (summary.overdueGoals?.length || 0)}
                </span>
                <span className="chart-summary-label">Overdue ↗</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverdueModal({ summary, onClose, navigate }) {
  const overdueTaskCount = summary.overdueTasks?.length || 0;
  const overdueProjectCount = summary.overdueProjects?.length || 0;
  const overdueGoalCount = summary.overdueGoals?.length || 0;
  const goTo = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "#ef4444" }}>⚠️ Overdue Items</h2>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="overdue-section">
          <div
            className="overdue-section-header"
            style={{ background: "#fff5f5", color: "#ef4444" }}
          >
            ✅ Overdue Tasks
            <span
              className="task-status-badge"
              style={{ background: "#fecaca", color: "#ef4444" }}
            >
              {overdueTaskCount}
            </span>
          </div>
          {overdueTaskCount > 0 ? (
            <div className="overdue-section-body">
              {summary.overdueTasks.map((t) => (
                <div
                  className="overdue-item overdue-item-clickable"
                  key={t.id}
                  onClick={() => goTo(`/tasks?highlight=${t.id}&hcolor=ef4444`)}
                >
                  <div
                    className="task-status-dot"
                    style={{ background: "#ef4444" }}
                  />
                  <div className="task-info">
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      {t.projectName && (
                        <span className="task-project">📁 {t.projectName}</span>
                      )}
                      {t.dueDate && (
                        <span style={{ color: "#ef4444" }}>
                          📅 {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: priorityColor[t.priority],
                      color: "#fff",
                    }}
                  >
                    {t.priority}
                  </span>
                  <span className="overdue-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="overdue-empty">No overdue tasks.</p>
          )}
        </div>
        <div className="overdue-section">
          <div
            className="overdue-section-header"
            style={{ background: "#fff7ed", color: "#f59e0b" }}
          >
            📁 Overdue Projects
            <span
              className="task-status-badge"
              style={{ background: "#fed7aa", color: "#f59e0b" }}
            >
              {overdueProjectCount}
            </span>
          </div>
          {overdueProjectCount > 0 ? (
            <div className="overdue-section-body">
              {summary.overdueProjects.map((p) => (
                <div
                  className="overdue-item overdue-item-clickable"
                  key={p.id}
                  onClick={() =>
                    goTo(`/projects?highlight=${p.id}&hcolor=ef4444`)
                  }
                >
                  <div
                    className="task-status-dot"
                    style={{ background: p.color || "#f59e0b" }}
                  />
                  <div className="task-info">
                    <div className="task-title">{p.name}</div>
                    <div className="task-meta">
                      {p.dueDate && (
                        <span style={{ color: "#ef4444" }}>
                          📅 {new Date(p.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span
                        className={`badge badge-${p.status?.toLowerCase()}`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <span className="overdue-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="overdue-empty">No overdue projects.</p>
          )}
        </div>
        <div className="overdue-section">
          <div
            className="overdue-section-header"
            style={{ background: "#faf5ff", color: "#8b5cf6" }}
          >
            🎯 Overdue Goals
            <span
              className="task-status-badge"
              style={{ background: "#e9d5ff", color: "#8b5cf6" }}
            >
              {overdueGoalCount}
            </span>
          </div>
          {overdueGoalCount > 0 ? (
            <div className="overdue-section-body">
              {summary.overdueGoals.map((g) => (
                <div
                  className="overdue-item overdue-item-clickable"
                  key={g.id}
                  onClick={() => goTo(`/goals?highlight=${g.id}&hcolor=ef4444`)}
                >
                  <div
                    className="task-status-dot"
                    style={{ background: "#8b5cf6" }}
                  />
                  <div className="task-info">
                    <div className="task-title">{g.title}</div>
                    <div className="task-meta">
                      {g.targetDate && (
                        <span style={{ color: "#ef4444" }}>
                          🎯 {new Date(g.targetDate).toLocaleDateString()}
                        </span>
                      )}
                      <span>{g.progress || 0}% complete</span>
                    </div>
                  </div>
                  <span className="overdue-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="overdue-empty">No overdue goals.</p>
          )}
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DueTodayModal({ summary, onClose, navigate }) {
  const goTo = (path) => {
    navigate(path);
    onClose();
  };
  const todayTasks = summary.todayTasks || [];
  const todayProjects =
    summary.projectsWithProgress?.filter((p) => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate).toDateString() === new Date().toDateString();
    }) || [];
  const todayGoals =
    summary.activeGoalList?.filter((g) => {
      if (!g.targetDate) return false;
      return (
        new Date(g.targetDate).toDateString() === new Date().toDateString()
      );
    }) || [];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "#d97706" }}>📅 Due Today</h2>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="overdue-section">
          <div
            className="overdue-section-header"
            style={{ background: "#fffbeb", color: "#d97706" }}
          >
            ✅ Tasks Due Today
            <span
              className="task-status-badge"
              style={{ background: "#fde68a", color: "#d97706" }}
            >
              {todayTasks.length}
            </span>
          </div>
          {todayTasks.length > 0 ? (
            <div className="overdue-section-body">
              {todayTasks.map((t) => (
                <div
                  className="overdue-item overdue-item-clickable"
                  key={t.id}
                  onClick={() => goTo(`/tasks?highlight=${t.id}&hcolor=d97706`)}
                >
                  <div
                    className="task-status-dot"
                    style={{ background: statusColor[t.status] }}
                  />
                  <div className="task-info">
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      {t.projectName && (
                        <span className="task-project">📁 {t.projectName}</span>
                      )}
                      {t.dueDate && (
                        <span style={{ color: "#d97706" }}>
                          📅 {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: priorityColor[t.priority],
                      color: "#fff",
                    }}
                  >
                    {t.priority}
                  </span>
                  <span className="overdue-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="overdue-empty">No tasks due today.</p>
          )}
        </div>
        <div className="overdue-section">
          <div
            className="overdue-section-header"
            style={{ background: "#fff7ed", color: "#f59e0b" }}
          >
            📁 Projects Due Today
            <span
              className="task-status-badge"
              style={{ background: "#fed7aa", color: "#f59e0b" }}
            >
              {todayProjects.length}
            </span>
          </div>
          {todayProjects.length > 0 ? (
            <div className="overdue-section-body">
              {todayProjects.map((p) => (
                <div
                  className="overdue-item overdue-item-clickable"
                  key={p.id}
                  onClick={() =>
                    goTo(`/projects?highlight=${p.id}&hcolor=d97706`)
                  }
                >
                  <div
                    className="task-status-dot"
                    style={{ background: p.color || "#f59e0b" }}
                  />
                  <div className="task-info">
                    <div className="task-title">{p.name}</div>
                    <div className="task-meta">
                      <span style={{ color: "#d97706" }}>
                        📅 {new Date(p.dueDate).toLocaleDateString()}
                      </span>
                      <span>{p.progress}% complete</span>
                    </div>
                  </div>
                  <span className="overdue-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="overdue-empty">No projects due today.</p>
          )}
        </div>
        <div className="overdue-section">
          <div
            className="overdue-section-header"
            style={{ background: "#faf5ff", color: "#8b5cf6" }}
          >
            🎯 Goals Due Today
            <span
              className="task-status-badge"
              style={{ background: "#e9d5ff", color: "#8b5cf6" }}
            >
              {todayGoals.length}
            </span>
          </div>
          {todayGoals.length > 0 ? (
            <div className="overdue-section-body">
              {todayGoals.map((g) => (
                <div
                  className="overdue-item overdue-item-clickable"
                  key={g.id}
                  onClick={() => goTo(`/goals?highlight=${g.id}&hcolor=d97706`)}
                >
                  <div
                    className="task-status-dot"
                    style={{ background: "#8b5cf6" }}
                  />
                  <div className="task-info">
                    <div className="task-title">{g.title}</div>
                    <div className="task-meta">
                      <span style={{ color: "#d97706" }}>
                        🎯 {new Date(g.targetDate).toLocaleDateString()}
                      </span>
                      <span>{g.progress || 0}% complete</span>
                    </div>
                  </div>
                  <span className="overdue-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="overdue-empty">No goals due today.</p>
          )}
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const [activeChart, setActiveChart] = useState("tasks");
  const [showOverdue, setShowOverdue] = useState(false);
  const [showDueToday, setShowDueToday] = useState(false);
  const navigate = useNavigate();

  const handleSendReminder = async () => {
    try {
      await client.post("/reminders/send-now");
      alert("Reminder email sent successfully!");
    } catch (e) {
      alert("Failed to send reminder. Check email configuration.");
    }
  };

  useEffect(() => {
    getDashboardSummary()
      .then((res) => {
        setSummary(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state">Loading dashboard...</div>;
  if (!summary)
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #eee",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#ef4444", marginBottom: "8px" }}>
            ⚠️ Could not connect to backend.
          </p>
          <p style={{ color: "#888", fontSize: "13px" }}>
            Make sure Spring Boot is running.
          </p>
        </div>
      </div>
    );

  const completionRate =
    summary.totalTasks > 0
      ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
      : 0;

  const allTasks = [
    ...(summary.todoTaskList || []),
    ...(summary.inProgressTaskList || []),
    ...(summary.doneTaskList || []),
  ];

  const totalOverdue =
    (summary.overdueTasks?.length || 0) +
    (summary.overdueProjects?.length || 0) +
    (summary.overdueGoals?.length || 0);

  return (
    <div className="dashboard-root">
      <PageHeader
        icon="📊"
        title="Dashboard"
        description={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      <div className="quick-stats-bar">
        <div className="quick-stat" onClick={() => navigate("/projects")}>
          📁 {summary.totalProjects} Projects
        </div>
        <div className="quick-stat" onClick={() => navigate("/tasks")}>
          ✅ {summary.totalTasks} Tasks
        </div>
        <div className="quick-stat" onClick={() => navigate("/goals")}>
          🎯 {summary.totalGoals} Goals
        </div>
        <div
          className="quick-stat"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveChart("categories")}
        >
          📊 {completionRate}% Complete
        </div>
        <div
          className="quick-stat"
          style={{
            cursor: "pointer",
            background: "#fff7ed",
            borderColor: "#fed7aa",
            color: "#d97706",
          }}
          onClick={handleSendReminder}
        >
          📧 Send Reminder
        </div>
        {totalOverdue > 0 && (
          <div
            className="quick-stat overdue-stat"
            onClick={() => setShowOverdue(true)}
          >
            ⚠️ {totalOverdue} Overdue
          </div>
        )}
        {summary.todayTasks?.length > 0 && (
          <div
            className="quick-stat today-stat"
            onClick={() => setShowDueToday(true)}
          >
            📅 {summary.todayTasks.length} Due Today
          </div>
        )}
      </div>

      <div className="dashboard-two-panel">
        <div className="dashboard-left-panel">
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === "projects" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              📁 Projects ({summary.totalProjects})
            </button>
            <button
              className={`tab-btn ${activeTab === "goals" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("goals")}
            >
              🎯 Goals ({summary.totalGoals})
            </button>
            <button
              className={`tab-btn ${activeTab === "completion" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("completion")}
            >
              📊 Completion
            </button>
          </div>
          <div className="tab-content">
            {activeTab === "projects" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "12px",
                  }}
                >
                  <button
                    className="btn-link"
                    onClick={() => navigate("/projects")}
                  >
                    View All Projects →
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {summary.projectsWithProgress?.length > 0 ? (
                    summary.projectsWithProgress.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        allTasks={allTasks}
                        navigate={navigate}
                      />
                    ))
                  ) : (
                    <p className="empty-state">No projects yet.</p>
                  )}
                </div>
              </div>
            )}
            {activeTab === "goals" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "12px",
                  }}
                >
                  <button
                    className="btn-link"
                    onClick={() => navigate("/goals")}
                  >
                    View All Goals →
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {summary.activeGoalList?.length > 0 ? (
                    summary.activeGoalList.map((g) => (
                      <GoalCard key={g.id} goal={g} />
                    ))
                  ) : (
                    <p className="empty-state">No active goals.</p>
                  )}
                </div>
              </div>
            )}
            {activeTab === "completion" && (
              <CompletionBreakdown summary={summary} navigate={navigate} />
            )}
          </div>
        </div>

        <div className="dashboard-right-panel" style={{ minHeight: 0 }}>
          <ChartsPanel
            summary={summary}
            navigate={navigate}
            setShowOverdue={setShowOverdue}
            setShowDueToday={setShowDueToday}
            activeChart={activeChart}
            setActiveChart={setActiveChart}
          />
        </div>
      </div>

      {showOverdue && (
        <OverdueModal
          summary={summary}
          onClose={() => setShowOverdue(false)}
          navigate={navigate}
        />
      )}
      {showDueToday && (
        <DueTodayModal
          summary={summary}
          onClose={() => setShowDueToday(false)}
          navigate={navigate}
        />
      )}
    </div>
  );
}
