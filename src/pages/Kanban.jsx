import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getTasks, updateTask } from "../api/tasks";
import { getProjects } from "../api/projects";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";

const COLUMNS = [
  { id: "TODO", label: "To Do", color: "#6366f1", bg: "#e0e7ff" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#f59e0b", bg: "#fef3c7" },
  { id: "DONE", label: "Done", color: "#10b981", bg: "#d1fae5" },
];

const priorityColor = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444" };

function TaskCard({ task, getProjectName, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
    >
      <div className="kanban-card-title">{task.title}</div>
      {task.description && (
        <div className="kanban-card-desc">{task.description}</div>
      )}
      <div className="kanban-card-meta">
        {task.projectId && (
          <span className="kanban-card-project">
            📁 {getProjectName(task.projectId)}
          </span>
        )}
        {task.dueDate && (
          <span className="kanban-card-date">
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="kanban-card-footer">
        <span
          className="badge"
          style={{
            background: priorityColor[task.priority],
            color: "#fff",
            fontSize: "10px",
          }}
        >
          {task.priority}
        </span>
        {task.tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="task-tag" style={{ fontSize: "10px" }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, getProjectName, activeId }) {
  return (
    <div className="kanban-column">
      <div
        className="kanban-column-header"
        style={{ borderTop: `3px solid ${column.color}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: column.color, fontWeight: 700 }}>
            {column.label}
          </span>
          <span
            className="kanban-count"
            style={{ background: column.bg, color: column.color }}
          >
            {tasks.length}
          </span>
        </div>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-cards-list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              getProjectName={getProjectName}
              isDragging={activeId === task.id}
            />
          ))}
          {tasks.length === 0 && (
            <div className="kanban-empty">Drop tasks here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Kanban() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [filterProject, setFilterProject] = useState("");
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [taskRes, projRes] = await Promise.all([getTasks(), getProjects()]);
    setTasks(taskRes.data);
    setProjects(projRes.data);
  };

  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || "";

  const getTasksByStatus = (status) => {
    return tasks.filter((t) => {
      if (t.status !== status) return false;
      if (filterProject && t.projectId !== filterProject) return false;
      return true;
    });
  };

  const findTaskStatus = (taskId) => tasks.find((t) => t.id === taskId)?.status;

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    let newStatus = null;
    if (COLUMNS.find((c) => c.id === over.id)) {
      newStatus = over.id;
    } else {
      newStatus = findTaskStatus(over.id);
    }

    if (newStatus && newStatus !== activeTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTask.id ? { ...t, status: newStatus } : t,
        ),
      );
      await updateTask(activeTask.id, { ...activeTask, status: newStatus });
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <div>
      <PageHeader
        icon="🗂️"
        title="Kanban Board"
        description="Drag and drop tasks across columns"
        action={
          <button className="btn-secondary" onClick={() => navigate("/tasks")}>
            ☰ List View
          </button>
        }
      />

      <div className="filter-bar" style={{ marginBottom: "20px" }}>
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
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={getTasksByStatus(col.id)}
              getProjectName={getProjectName}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="kanban-card kanban-card-dragging">
              <div className="kanban-card-title">{activeTask.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
