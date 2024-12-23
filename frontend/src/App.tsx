import React, { useRef, useEffect, useState } from 'react';
import Grid from './Grid.tsx';
import PlayerCount from './PlayerCount.tsx';
import History from './History.tsx';
import './styles/App.css';

interface HistoryItem {
  timestamp: string;
  row: number;
  col: number;
  character: string;
  clientId: string;
}

export interface GridBlock {
  character: string;
  isStriped: boolean;
}

const GRID_SIZE = 10;

function App() {
  const ws = useRef<WebSocket | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [grid, setGrid] = useState<GridBlock[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill({character:'', isStriped: false})
    )
  );

  const resetGrid = () => { 
    fetch('http://localhost:8080/api/reset')
      .then((res) => res.json())
      .then((data) => {
        setGrid(data.grid);
        setHistory(data.history);
      })
      .catch((err) => console.error('Error resetting grid:', err));
  }

  useEffect(() => {
    fetch('http://localhost:8080/api/grid')
      .then((res) => res.json())
      .then((data) => {
        setGrid(data.grid);
        setHistory(data.history);
        console.log("data: ",data)
      })
      .catch((err) => console.error('Error fetching initial state:', err));

    ws.current = new WebSocket('ws://localhost:8080');
    ws.current.onopen = () => console.log('Connected to WebSocket');

    ws.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case 'assign_client_id':
          setClientId(data.payload);
          break;
        case 'player_count':
          setPlayerCount(data.payload);
          break;
        case 'grid_update':
          setHistory(prevHistory => {
            const newHistory = [...prevHistory];
            newHistory.push({
              timestamp: new Date().toLocaleTimeString(),
              ...data.payload
            });
            console.log("payload: ",data.payload)
            return newHistory;
          });
          break;
        default:
          console.log(data);
          break;
      }
    };

    ws.current.onerror = (err) => console.error('WebSocket error:', err);

    ws.current.onclose = () => console.log('WebSocket connection closed');

    return () => {
      console.log('Closing WebSocket connection');
      ws.current?.close();
    };
  }, []);

  return (
    <div className="container">
    <h1 className="text-xl font-bold mb-4">Multiplayer Grid</h1>
    <div className="player-count-reset-container flex justify-between items-center mb-4">
      <div className="player-count">
        <PlayerCount count={playerCount} />
      </div>
      <button className="reset-button" onClick={resetGrid}>Reset Grid</button>
    </div>
    <div className="grid-container">
        <Grid ws={ws.current} clientId={clientId} grid={grid} setGrid={setGrid} />
    </div>
    <div className="history">
      <History history={history} />
    </div>
  </div>
  );
}

export default App;
