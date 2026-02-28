import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 게시판의 게시글 목록
router.get('/board/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const posts = await prisma.post.findMany({
      where: { boardId },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        character: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    const total = await prisma.post.count({
      where: { boardId }
    });

    res.json({
      posts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 게시글
router.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        character: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        votes: true
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 게시글 생성
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { boardId, characterId, title, content, metadata, isPinned, isLocked } = req.body;

    const post = await prisma.post.create({
      data: {
        boardId,
        authorId: userId,
        characterId,
        title,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isPinned: isPinned || false,
        isLocked: isLocked || false
      },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        character: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 게시글 수정
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const postId = req.params.id;
    const { title, content, metadata, isPinned, isLocked } = req.body;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.authorId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        metadata: metadata !== undefined ? (metadata ? JSON.stringify(metadata) : null) : undefined,
        isPinned,
        isLocked
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 댓글 생성
router.post('/:id/comments', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const postId = req.params.id;
    const { content, parentId } = req.body;

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
        parentId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 투표 (인터렉티브 게시판용)
router.post('/:id/vote', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const postId = req.params.id;
    const { option } = req.body;

    const vote = await prisma.vote.upsert({
      where: {
        postId_userId: {
          postId,
          userId
        }
      },
      update: {
        option
      },
      create: {
        postId,
        userId,
        option
      }
    });

    res.json(vote);
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

