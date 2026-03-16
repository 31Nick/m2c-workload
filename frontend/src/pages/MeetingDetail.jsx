import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ActionItemCard from "../components/ActionItemCard";
import { meetingsService } from "../services/meetingsService";
import "./MeetingDetail.css";

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    meetingsService
      .getById(id)
      .then(setMeeting)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (itemId, updates) => {
    try {
      const updated = await meetingsService.updateActionItem(
        id,
        itemId,
        updates,
      );
      setMeeting((prev) => ({
        ...prev,
        action_items: prev.action_items.map((item) =>
          item.id === itemId ? updated : item,
        ),
      }));
    } catch (e) {
      alert(`Failed to update: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this meeting?")) return;
    try {
      await meetingsService.remove(id);
      navigate("/");
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  if (loading) return <div className="page-status">Loading…</div>;
  if (error) return <div className="page-status error">Error: {error}</div>;
  if (!meeting) return null;

  const done = meeting.action_items.filter((i) => i.status === "done").length;
  const total = meeting.action_items.length;

  return (
    <main className="meeting-detail">
      <div className="detail-header">
        <div>
          <Link to="/" className="back-link">
            ← Meetings
          </Link>
          <h1>{meeting.title}</h1>
          <p className="detail-meta">
            {new Date(meeting.created_at).toLocaleString()}
            {meeting.participants?.length > 0 &&
              ` · ${meeting.participants.join(", ")}`}
          </p>
        </div>
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </div>

      <section className="section">
        <h2>Action Items ({done}/{total} done)</h2>
        {total === 0 ? (
          <p className="no-items">
            No action items were extracted from this transcript.
          </p>
        ) : (
          <div className="items-grid">
            {meeting.action_items.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Transcript</h2>
        <pre className="transcript">{meeting.transcript}</pre>
      </section>
    </main>
  );
}
