import "./ActionItemCard.css";

const PRIORITY_CLASSES = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
};

export default function ActionItemCard({ item, onStatusChange }) {
  const handleStatusChange = (e) => {
    if (onStatusChange) onStatusChange(item.id, { status: e.target.value });
  };

  return (
    <div className={`action-card ${item.status === "done" ? "done" : ""}`}>
      <div className="action-card-header">
        <span className={`badge priority ${PRIORITY_CLASSES[item.priority] || ""}`}>
          {item.priority}
        </span>
        <span className={`badge status status-${item.status}`}>
          {STATUS_LABELS[item.status] || item.status}
        </span>
      </div>
      <p className="action-card-title">{item.title}</p>
      {item.assignee && (
        <p className="action-card-assignee">👤 {item.assignee}</p>
      )}
      {onStatusChange && (
        <select
          className="action-card-select"
          value={item.status}
          onChange={handleStatusChange}
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      )}
    </div>
  );
}
