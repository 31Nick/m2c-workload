import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingsService } from "../services/meetingsService";
import "./NewMeeting.css";

export default function NewMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [participants, setParticipants] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const meeting = await meetingsService.create({
        title,
        transcript,
        participants: participants
          ? participants.split(",").map((p) => p.trim()).filter(Boolean)
          : [],
      });
      navigate(`/meetings/${meeting.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="new-meeting">
      <h1>New Meeting</h1>
      <p className="subtitle">
        Paste your meeting transcript below. m2c will automatically extract
        action items.
      </p>

      {error && <div className="form-error">{error}</div>}

      <form className="meeting-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Meeting Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sprint Planning — Week 12"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="participants">Participants (comma-separated)</label>
          <input
            id="participants"
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="e.g. Alice, Bob, Charlie"
          />
        </div>

        <div className="form-group">
          <label htmlFor="transcript">Meeting Transcript *</label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={12}
            placeholder={`Paste your meeting notes here.\n\nLines containing action keywords like "Action:", "Todo:", "Please", "Follow up" will be extracted as action items.`}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Processing…" : "Extract Action Items"}
          </button>
        </div>
      </form>
    </main>
  );
}
