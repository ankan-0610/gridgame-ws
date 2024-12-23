import express, { Request, Response } from 'express';
import {grid, history, resetGrid} from './ws';

const router = express.Router();

// Get the grid state
router.get('/grid', async (_req: Request, res: Response) => {
    try {
        res.json({ grid:grid, history:history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch grid state' });
    }
});

// reset the grid and history
router.get('/reset', async (_req: Request, res: Response) => {
    try {
        resetGrid();
        res.json({ grid:grid, history:history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset grid state' });
    }
});

export default router;
