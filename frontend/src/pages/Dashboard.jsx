import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MeetingCard from "../components/MeetingCard";
import { meetingsService } from "../services/meetingsService";
import "./Dashboard.css";

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    meetingsService
      .getAll()
      .then(setMeetings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this meeting?")) return;
    try {
      await meetingsService.remove(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  if (loading) return <div className="page-status">Loading meetings…</div>;
  if (error) return <div className="page-status error">Error: {error}</div>;

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h1>Meetings</h1>
        <Link to="/new" className="btn btn-primary">
          + New Meeting
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="empty-state">
          <p>No meetings yet.</p>
          <Link to="/new" className="btn btn-primary">
            Create your first meeting
          </Link>
        </div>
      ) : (
        <div className="meetings-grid">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </main>
  );
}
