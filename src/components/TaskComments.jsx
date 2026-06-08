import { useState, useRef, useEffect } from "react";
import { addComment, deleteComment } from "../api/tasks";

export default function TaskComments({ task, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("Me");
  const ref = useRef(null);

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

  const handleAdd = async () => {
    if (!text.trim()) return;
    await addComment(task.id, { text: text.trim(), author });
    setText("");
    onRefresh();
  };

  const handleDelete = async (commentId) => {
    if (window.confirm("Delete this comment?")) {
      await deleteComment(task.id, commentId);
      onRefresh();
    }
  };

  const count = task.comments?.length || 0;

  return (
    <div className="task-comments-wrapper" ref={ref}>
      <button
        className="task-comments-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        💬 Comments {count > 0 ? `(${count})` : ""} {open ? "▲" : "▼"}
      </button>

      {open && (
        <div
          className="task-comments-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="task-comments-header">Comments & Notes</div>

          {count > 0 ? (
            <div className="task-comments-list">
              {task.comments.map((c) => (
                <div key={c.id} className="task-comment-item">
                  <div className="task-comment-body">
                    <div className="task-comment-author">{c.author}</div>
                    <div className="task-comment-text">{c.text}</div>
                    <div className="task-comment-date">
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    style={{ fontSize: "12px", alignSelf: "flex-start" }}
                    onClick={() => handleDelete(c.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: "#aaa", padding: "8px 0" }}>
              No comments yet.
            </p>
          )}

          <div className="task-comment-add">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              style={{
                fontSize: "12px",
                padding: "6px 10px",
                marginBottom: "6px",
              }}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment or note..."
              rows={2}
              style={{
                fontSize: "12px",
                padding: "6px 10px",
                marginBottom: "6px",
              }}
              onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleAdd()}
            />
            <button
              className="btn-primary"
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                alignSelf: "flex-end",
              }}
              onClick={handleAdd}
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
