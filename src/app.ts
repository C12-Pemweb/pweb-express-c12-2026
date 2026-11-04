import express from 'express';
import healthRouter from './routes/health.route.js';
import playerRouter from './routes/player.route.js';
import heroRouter from './routes/hero.route.js';
import skinRouter from './routes/skin.route.js';
import logger from './middleware/logger.js';
import notFound from './middleware/not-found.js';
import errorHandler from './middleware/error-handler.js';

const app = express();

app.use(logger);
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/players', playerRouter);
app.use('/api/heroes', heroRouter);
app.use('/api/skins', skinRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
