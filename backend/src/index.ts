import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import gridRoutes from './gridRoutes';
import { setupWebSocket } from './ws';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Routes
app.use('/api', gridRoutes);

// WebSocket
setupWebSocket(server);

// Start server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});