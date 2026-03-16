import { Link } from "react-router-dom";
import "./MeetingCard.css";

export default function MeetingCard({ meeting, onDelete }) {
  const itemCount = meeting.action_items?.length ?? 0;
  const doneCount = meeting.action_items?.filter((i) => i.status === "done").length ?? 0;
  const date = new Date(meeting.created_at).toLocaleDateString();

  return (
    <div className="meeting-card">
      <div className="meeting-card-header">
        <Link to={`/meetings/${meeting.id}`} className="meeting-card-title">
          {meeting.title}
        </Link>
        <span className="meeting-card-date">{date}</span>
      </div>
      <div className="meeting-card-meta">
        {meeting.participants?.length > 0 && (
          <span>👥 {meeting.participants.join(", ")}</span>
        )}
        <span>
          ✅ {doneCount}/{itemCount} action items done
        </span>
      </div>
      <div className="meeting-card-actions">
        <Link to={`/meetings/${meeting.id}`} className="btn btn-secondary btn-sm">
          View
        </Link>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete && onDelete(meeting.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
