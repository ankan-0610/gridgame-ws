import WebSocket from 'ws';
import { Server } from 'http';

interface PlayerMessage {
    type: string;
    payload: any;
}

interface HistoryItem {
  timestamp: string;
  row: number;
  col: number;
  character: string;
}

interface GridBlock {
    character: string;
    isStriped: boolean;
}


const GRID_SIZE = 10; // Define the grid size
// In-memory data (replace with database for persistence)

// Initialize the grid with empty strings
export let grid: GridBlock[][] = Array(GRID_SIZE).fill(null).map(() => {
    return Array(GRID_SIZE).fill({ character: '', isStriped: false });
});

export let history: HistoryItem[] = [];

export const resetGrid = () => { 
    grid = Array(GRID_SIZE).fill(null).map(() => { 
        return Array(GRID_SIZE).fill({ character: '', isStriped: false });
    });

    history = [];
}

const activeConnections = new Set<WebSocket>();

export const setupWebSocket = (server: Server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws: WebSocket) => {
        const clientId = crypto.randomUUID().slice(0, 8);
        (ws as any).clientId = clientId; 
        activeConnections.add(ws);

        // Send the `clientId` to the newly connected client
        ws.send(JSON.stringify({ type: 'assign_client_id', payload: clientId }));

        // Broadcast the current player count
        broadcast({ type: 'player_count', payload: activeConnections.size });

        ws.on('message', (message: string) => {
            try {
                const parsed: PlayerMessage = JSON.parse(message);

                if (parsed.type === 'grid_update') {

                    const { row, col, character } = parsed.payload;
                    console.log(parsed)
                    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
                    newGrid[row][col].character = character;
                    newGrid[row][col].isStriped = true;
                    grid = newGrid;
                    
                    // Add to history
                    history.push({timestamp: new Date().toISOString(), row, col, character});

                    // Broadcast the grid update to all clients
                    broadcast({ type: 'grid_update', payload: { ...parsed.payload , clientId} });
                }
            } catch (err) {
                console.error('Invalid message received:', message);
            }
        });

        ws.on('close', () => {
            activeConnections.delete(ws);
            broadcast({ type: 'player_count', payload: activeConnections.size });
        });
    });
};

const broadcast = (data: PlayerMessage) => {
    const message = JSON.stringify(data);
    for (const client of activeConnections) {
        client.send(message);
    }
};