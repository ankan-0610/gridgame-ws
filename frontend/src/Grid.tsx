import React, { useState, useEffect, useCallback } from 'react';
import './styles/Grid.css';
import { GridBlock } from './App.tsx';

interface GridProps {
  ws: WebSocket | null;
  clientId: string | null;
  grid: GridBlock[][];
  setGrid: React.Dispatch<React.SetStateAction<GridBlock[][]>>;
};

interface GridUpdate {
  row: number;
  col: number;
  character: string;
  clientId: string;
}

const RESTRICTION_TIME = 60000; // 60 seconds

const Grid: React.FC<GridProps> = ({ ws, clientId, grid, setGrid }) => {
  const [isRestricted, setIsRestricted] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!ws) {
      console.error("WebSocket is not initialized.");
      return;
    } 

    const handleMessage = (message: MessageEvent) => {
      const data = JSON.parse(message.data);
      if (data.type === 'grid_update') {
        const update = data.payload as GridUpdate;
        console.log("updatecId: ", update.clientId);
        console.log("clientId: ", clientId);

        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => [...row]);
          newGrid[update.row][update.col].character = (update.clientId === clientId)?update.character:'';
          newGrid[update.row][update.col].isStriped = (update.clientId !== clientId);
          return newGrid;
        });
        // if (update.clientId === clientId) {
        //   setGrid(prevGrid => {
        //     const newGrid = prevGrid.map(row => [...row]);
        //     newGrid[update.row][update.col].character = update.character;
        //     newGrid[update.row][update.col].isStriped = false;
        //     return newGrid;
        //   });
        // }
        // else {
        //   setGrid(prevGrid => {
        //     const newGrid = prevGrid.map(row => [...row]);
        //     newGrid[update.row][update.col].character = '';
        //     newGrid[update.row][update.col].isStriped = true;
        //     return newGrid;
        //   });
        // }
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, clientId, setGrid]);

  const handleCellUpdate = useCallback((row: number, col: number, value: string, clientId: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || isRestricted || !clientId) return;
    
    const updatedValue = value.trim().charAt(0);
    if (!updatedValue) return;

    ws.send(JSON.stringify({
      type: 'grid_update',
      payload: { row, col, character: updatedValue, clientId }
    }));

    // Set global restriction
    setIsRestricted(true);
    setRemainingTime(RESTRICTION_TIME / 1000);
    
    // Schedule restriction removal
    const interval = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(interval);
          setIsRestricted(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, [ws, isRestricted]);

  const handleKeyDown = (row: number, col: number) => (e: React.KeyboardEvent<HTMLInputElement>) => { 
    if(e.key === 'Backspace') {
      setGrid(prevGrid => { 
        const newGrid = prevGrid.map(row => [...row]);
        newGrid[row][col].character = '';
        return newGrid;
      });
    }
  }

  return (
    <div className='grid-container mx-auto' style={{ maxWidth: '100%' }}>
      <div className="grid grid-cols-10 gap-4 p-2">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <input
              key={`${rowIndex}-${colIndex}`}
              value={cell.character}
              onKeyDown={handleKeyDown(rowIndex, colIndex)}
              onChange={(e) => clientId && handleCellUpdate(rowIndex, colIndex, e.target.value, clientId)}
              disabled={isRestricted || cell.isStriped}
              className={`border text-center w-10 h-10 ${
                cell.isStriped ? 'striped' : 'bg-white'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 input-character`}
              maxLength={1}
            />
          ))
        )}
      </div>
      {isRestricted && (
        <div className="text-center bg-red-500 text-white p-2 rounded-md">
          Restriction active. Time remaining: {remainingTime} seconds
        </div>
      )}
    </div>
  );
};

export default Grid;