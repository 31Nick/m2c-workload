import express from 'express';
import cors from 'cors';
import metricsRouter from './routes/metrics';
import { setupAggregationJobs } from './aggregation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/metrics', metricsRouter);

if (require.main === module) {
  setupAggregationJobs();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
