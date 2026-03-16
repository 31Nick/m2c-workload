# m2c-workload — Meeting to Code

**m2c** converts meeting transcripts into structured action items and tasks.  
Paste a meeting transcript, and the app automatically extracts every action item so your team can track and update its status in real time.

---

## Architecture

| Layer     | Technology        | Port  |
|-----------|-------------------|-------|
| Frontend  | React + Vite      | 5173 (dev) / 80 (Docker) |
| Backend   | Python + FastAPI  | 8000  |

```
m2c-workload/
├── backend/          # FastAPI application
│   ├── main.py
│   ├── requirements.txt
│   ├── test_main.py
│   └── Dockerfile
├── frontend/         # React + Vite application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   └── services/     # API service layer
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Running Locally (without Docker)

### Prerequisites
- Python 3.12+
- Node.js 20+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is available at <http://localhost:8000>.  
Interactive API docs: <http://localhost:8000/docs>

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is available at <http://localhost:5173>.

---

## Running with Docker

```bash
docker compose up --build
```

- Frontend: <http://localhost>
- Backend API: <http://localhost:8000>

---

## Running Tests

### Backend

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

### Frontend (lint)

```bash
cd frontend
npm run lint
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `GET`  | `/api/health` | Detailed health status |
| `GET`  | `/api/meetings` | List all meetings |
| `POST` | `/api/meetings` | Create a meeting + extract action items |
| `GET`  | `/api/meetings/{id}` | Get a single meeting |
| `DELETE` | `/api/meetings/{id}` | Delete a meeting |
| `PATCH` | `/api/meetings/{id}/action-items/{item_id}` | Update an action item's status/assignee/priority |

Full interactive documentation is available at <http://localhost:8000/docs> when the backend is running.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |

---

## How Action Item Extraction Works

The backend scans each line of the transcript for action-oriented keywords:  
`action:`, `todo:`, `task:`, `follow up`, `action item`, `will do`, `should do`, `needs to`, `please`, `assign`.

Any matching line is turned into an action item with a default status of **open** and priority of **medium**.  
This can be replaced with an LLM call (e.g., OpenAI API) for more accurate extraction.
