import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 퀘스트 목록
router.get('/', async (req, res) => {
  try {
    const quests = await prisma.quest.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(quests);
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 사용자의 퀘스트 목록
router.get('/my-quests', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const userQuests = await prisma.userQuest.findMany({
      where: { userId },
      include: {
        quest: true
      },
      orderBy: {
        acceptedAt: 'desc'
      }
    });

    res.json(userQuests);
  } catch (error) {
    console.error('Error fetching user quests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 퀘스트 수락
router.post('/:id/accept', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const questId = req.params.id;

    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest || !quest.isActive) {
      return res.status(400).json({ error: 'Quest not available' });
    }

      const userQuest = await prisma.userQuest.create({
        data: {
          userId,
          questId,
          status: 'IN_PROGRESS'
        },
      include: {
        quest: true
      }
    });

    res.status(201).json(userQuest);
  } catch (error) {
    console.error('Error accepting quest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 퀘스트 완료
router.post('/:id/complete', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const questId = req.params.id;

    const userQuest = await prisma.userQuest.findUnique({
      where: {
        userId_questId: {
          userId,
          questId
        }
      },
      include: {
        quest: true
      }
    });

    if (!userQuest || userQuest.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Quest cannot be completed' });
    }

    // 보상 지급 (TODO: 실제 구현)
    const rewards = userQuest.quest.rewards ? JSON.parse(userQuest.quest.rewards) : null;

    const updated = await prisma.userQuest.update({
      where: { id: userQuest.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        quest: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 퀘스트 생성
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, questType, dayOfWeek, rewards, requirements, isActive } = req.body;

    if (!title || !description || !questType) {
      return res.status(400).json({ error: 'Title, description, and questType are required' });
    }

    if (questType === 'weekday' && (dayOfWeek === undefined || dayOfWeek === null)) {
      return res.status(400).json({ error: 'dayOfWeek is required for weekday quests' });
    }

    const quest = await prisma.quest.create({
      data: {
        title,
        description,
        type: type || 'sub',
        questType,
        dayOfWeek: questType === 'weekday' ? dayOfWeek : null,
        rewards: rewards ? JSON.stringify(rewards) : null,
        requirements: requirements ? JSON.stringify(requirements) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(quest);
  } catch (error) {
    console.error('Error creating quest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 퀘스트 수정
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const questId = req.params.id;
    const { title, description, type, questType, dayOfWeek, rewards, requirements, isActive } = req.body;

    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (questType !== undefined) {
      updateData.questType = questType;
      if (questType === 'weekday') {
        if (dayOfWeek === undefined || dayOfWeek === null) {
          return res.status(400).json({ error: 'dayOfWeek is required for weekday quests' });
        }
        updateData.dayOfWeek = dayOfWeek;
      } else {
        updateData.dayOfWeek = null;
      }
    } else if (dayOfWeek !== undefined) {
      updateData.dayOfWeek = dayOfWeek;
    }
    if (rewards !== undefined) updateData.rewards = rewards ? JSON.stringify(rewards) : null;
    if (requirements !== undefined) updateData.requirements = requirements ? JSON.stringify(requirements) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.quest.update({
      where: { id: questId },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating quest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 퀘스트 삭제
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const questId = req.params.id;

    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    await prisma.quest.delete({
      where: { id: questId }
    });

    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    console.error('Error deleting quest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 모든 퀘스트 조회 (비활성 포함)
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const quests = await prisma.quest.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(quests);
  } catch (error) {
    console.error('Error fetching all quests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

