import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 게시판 목록
router.get('/', async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      orderBy: {
        order: 'asc'
      },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 게시판 정보
router.get('/:id', async (req, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


