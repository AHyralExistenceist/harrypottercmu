import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 이벤트 인물 목록 조회
router.get('/:mapId/event-characters', async (req, res) => {
  try {
    const { mapId } = req.params;
    const characters = await prisma.eventCharacter.findMany({
      where: { mapId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(characters);
  } catch (error) {
    console.error('Error fetching event characters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 이벤트 배경 목록 조회
router.get('/:mapId/event-backgrounds', async (req, res) => {
  try {
    const { mapId } = req.params;
    const backgrounds = await prisma.eventBackground.findMany({
      where: { mapId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(backgrounds);
  } catch (error) {
    console.error('Error fetching event backgrounds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 몬스터 목록 조회
router.get('/:mapId/monsters', async (req, res) => {
  try {
    const { mapId } = req.params;
    const monsters = await prisma.monster.findMany({
      where: { mapId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(monsters);
  } catch (error) {
    console.error('Error fetching monsters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 몬스터 ID로 직접 조회
router.get('/monster/:monsterId', async (req, res) => {
  try {
    const { monsterId } = req.params;
    const monster = await prisma.monster.findUnique({
      where: { id: monsterId }
    });
    if (!monster) {
      return res.status(404).json({ error: 'Monster not found' });
    }
    res.json(monster);
  } catch (error) {
    console.error('Error fetching monster:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 이벤트 인물 생성/수정 (배치)
router.post('/:mapId/event-characters', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { mapId } = req.params;
    const { characters } = req.body;

    if (!Array.isArray(characters)) {
      return res.status(400).json({ error: 'characters must be an array' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventCharacter.deleteMany({ where: { mapId } });
      
      if (characters.length > 0) {
        await tx.eventCharacter.createMany({
          data: characters.map((char: { id: string; name: string; portraitImage?: string }) => ({
            id: char.id,
            mapId,
            name: char.name,
            portraitImage: char.portraitImage || null
          }))
        });
      }
    });

    const savedCharacters = await prisma.eventCharacter.findMany({
      where: { mapId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(savedCharacters);
  } catch (error) {
    console.error('Error saving event characters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 이벤트 배경 생성/수정 (배치)
router.post('/:mapId/event-backgrounds', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { mapId } = req.params;
    const { backgrounds } = req.body;

    if (!Array.isArray(backgrounds)) {
      return res.status(400).json({ error: 'backgrounds must be an array' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventBackground.deleteMany({ where: { mapId } });
      
      if (backgrounds.length > 0) {
        await tx.eventBackground.createMany({
          data: backgrounds.map((bg: { id: string; name: string; imageUrl: string }) => ({
            id: bg.id,
            mapId,
            name: bg.name,
            imageUrl: bg.imageUrl
          }))
        });
      }
    });

    const savedBackgrounds = await prisma.eventBackground.findMany({
      where: { mapId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(savedBackgrounds);
  } catch (error) {
    console.error('Error saving event backgrounds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 몬스터 생성/수정 (배치)
router.post('/:mapId/monsters', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { mapId } = req.params;
    const { monsters } = req.body;

    if (!Array.isArray(monsters)) {
      return res.status(400).json({ error: 'monsters must be an array' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.monster.deleteMany({ where: { mapId } });
      
      if (monsters.length > 0) {
        await tx.monster.createMany({
          data: monsters.map((m: { 
            id: string; 
            name: string; 
            imageUrl?: string;
            usesAttack?: boolean;
            usesDefense?: boolean;
            usesAgility?: boolean;
            attackStat?: number;
            defenseStat?: number;
            agilityStat?: number;
          }) => ({
            id: m.id,
            mapId,
            name: m.name,
            imageUrl: m.imageUrl || null,
            usesAttack: m.usesAttack || false,
            usesDefense: m.usesDefense || false,
            usesAgility: m.usesAgility || false,
            attackStat: m.attackStat || null,
            defenseStat: m.defenseStat || null,
            agilityStat: m.agilityStat || null
          }))
        });
      }
    });

    const savedMonsters = await prisma.monster.findMany({
      where: { mapId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(savedMonsters);
  } catch (error) {
    console.error('Error saving monsters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 활성 지도 조회
router.get('/', async (req, res) => {
  try {
    const map = await prisma.map.findFirst({
      where: {
        isActive: true
      },
      include: {
        investigationPoints: {
          where: {
            isActive: true
          },
          include: {
            choices: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!map) {
      return res.status(404).json({ error: 'No active map found' });
    }

    res.json(map);
  } catch (error) {
    console.error('Error fetching map:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 사용자 조사 기록 조회
router.get('/investigations', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const investigations = await prisma.userInvestigation.findMany({
      where: {
        userId
      },
      include: {
        point: {
          include: {
            map: true
          }
        }
      }
    });

    res.json(investigations);
  } catch (error) {
    console.error('Error fetching investigations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 조사 지점 조사 (선택지 선택)
router.post('/investigate/:pointId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { pointId } = req.params;
    const { choiceId } = req.body;

    const point = await prisma.investigationPoint.findUnique({
      where: { id: pointId },
      include: {
        choices: true,
        map: true
      }
    });

    if (!point) {
      return res.status(404).json({ error: 'Investigation point not found' });
    }

    const existingInvestigation = await prisma.userInvestigation.findUnique({
      where: {
        userId_pointId: {
          userId,
          pointId
        }
      }
    });

    if (existingInvestigation) {
      return res.status(400).json({ error: 'Already investigated' });
    }

    const choice = choiceId ? point.choices.find(c => c.id === choiceId) : null;

    const investigation = await prisma.userInvestigation.create({
      data: {
        userId,
        pointId,
        choiceId: choiceId || null
      },
      include: {
        point: {
          include: {
            choices: true
          }
        }
      }
    });

    let rewards = null;
    if (point.rewards) {
      try {
        rewards = JSON.parse(point.rewards);
        const character = await prisma.character.findUnique({
          where: { userId }
        });

        if (character && rewards) {
          if (rewards.galleon) {
            await prisma.character.update({
              where: { id: character.id },
              data: {
                galleon: {
                  increment: rewards.galleon
                }
              }
            });
          }

          if (rewards.items && Array.isArray(rewards.items)) {
            for (const itemReward of rewards.items) {
              await prisma.userItem.upsert({
                where: {
                  userId_itemId: {
                    userId,
                    itemId: itemReward.itemId
                  }
                },
                update: {
                  quantity: {
                    increment: itemReward.quantity || 1
                  }
                },
                create: {
                  userId,
                  itemId: itemReward.itemId,
                  quantity: itemReward.quantity || 1
                }
              });
            }
          }
        }
      } catch (e) {
        console.error('Error parsing rewards:', e);
      }
    }

    res.json({
      investigation,
      rewards,
      response: choice ? choice.response : null
    });
  } catch (error) {
    console.error('Error investigating point:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 보상 지급
router.post('/reward', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { rewards } = req.body;

    if (!rewards) {
      return res.status(400).json({ error: 'Rewards are required' });
    }

    const character = await prisma.character.findUnique({
      where: { userId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (rewards.galleon && rewards.galleon > 0) {
      await prisma.character.update({
        where: { id: character.id },
        data: {
          galleon: {
            increment: rewards.galleon
          }
        }
      });
    }

    if (rewards.items && Array.isArray(rewards.items)) {
      for (const itemReward of rewards.items) {
        if (itemReward.itemId && itemReward.quantity > 0) {
          await prisma.userItem.upsert({
            where: {
              userId_itemId: {
                userId,
                itemId: itemReward.itemId
              }
            },
            update: {
              quantity: {
                increment: itemReward.quantity || 1
              }
            },
            create: {
              userId,
              itemId: itemReward.itemId,
              quantity: itemReward.quantity || 1
            }
          });
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 모든 지도 조회 (일반 사용자용 - 활성 지도만)
router.get('/list', async (req, res) => {
  try {
    const maps = await prisma.map.findMany({
      where: {
        isActive: true
      },
      include: {
        investigationPoints: {
          where: {
            isActive: true
          },
          include: {
            choices: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(maps);
  } catch (error) {
    console.error('Error fetching maps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 모든 지도 조회
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const maps = await prisma.map.findMany({
      include: {
        investigationPoints: {
          include: {
            choices: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(maps);
  } catch (error) {
    console.error('Error fetching maps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 지도 생성
router.post('/admin', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, imageUrl, isActive } = req.body;

    if (!name || !imageUrl) {
      return res.status(400).json({ error: 'Name and imageUrl are required' });
    }

    const map = await prisma.map.create({
      data: {
        name,
        description: description || null,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(map);
  } catch (error) {
    console.error('Error creating map:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 지도 수정
router.put('/admin/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, isActive } = req.body;

    const map = await prisma.map.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl && { imageUrl }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(map);
  } catch (error) {
    console.error('Error updating map:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 지도 삭제
router.delete('/admin/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.map.delete({
      where: { id }
    });

    res.json({ message: 'Map deleted successfully' });
  } catch (error) {
    console.error('Error deleting map:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 지도 고정 토글
router.patch('/admin/:id/pin', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const map = await prisma.map.findUnique({
      where: { id }
    });

    if (!map) {
      return res.status(404).json({ error: 'Map not found' });
    }

    if (!map.isPinned) {
      await prisma.map.updateMany({
        where: {
          isPinned: true
        },
        data: {
          isPinned: false
        }
      });
    }

    const updatedMap = await prisma.map.update({
      where: { id },
      data: {
        isPinned: !map.isPinned
      }
    });

    res.json(updatedMap);
  } catch (error) {
    console.error('Error toggling map pin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 조사 지점 생성
router.post('/admin/points', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { mapId, name, description, positionX, positionY, iconUrl, eventScript, rewards, isActive, order } = req.body;

    if (!mapId || !name || !description || positionX === undefined || positionY === undefined) {
      return res.status(400).json({ error: 'mapId, name, description, positionX, and positionY are required' });
    }

    const point = await prisma.investigationPoint.create({
      data: {
        mapId,
        name,
        description,
        positionX: parseFloat(positionX),
        positionY: parseFloat(positionY),
        iconUrl: iconUrl || null,
        eventScript: eventScript ? (typeof eventScript === 'string' ? eventScript : JSON.stringify(eventScript)) : null,
        rewards: rewards ? (typeof rewards === 'string' ? rewards : JSON.stringify(rewards)) : null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0
      }
    });

    res.status(201).json(point);
  } catch (error) {
    console.error('Error creating investigation point:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 조사 지점 수정
router.put('/admin/points/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, positionX, positionY, iconUrl, eventScript, rewards, isActive, order } = req.body;

    const point = await prisma.investigationPoint.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(positionX !== undefined && { positionX: parseFloat(positionX) }),
        ...(positionY !== undefined && { positionY: parseFloat(positionY) }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(eventScript !== undefined && { eventScript: eventScript === null || eventScript === '' ? null : (typeof eventScript === 'string' ? eventScript : JSON.stringify(eventScript)) }),
        ...(rewards !== undefined && { rewards: typeof rewards === 'string' ? rewards : JSON.stringify(rewards) }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order })
      }
    });

    res.json(point);
  } catch (error) {
    console.error('Error updating investigation point:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 조사 지점 삭제
router.delete('/admin/points/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.investigationPoint.delete({
      where: { id }
    });

    res.json({ message: 'Investigation point deleted successfully' });
  } catch (error) {
    console.error('Error deleting investigation point:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 선택지 생성
router.post('/admin/choices', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { pointId, text, response, nextPointId, order } = req.body;

    if (!pointId || !text || !response) {
      return res.status(400).json({ error: 'pointId, text, and response are required' });
    }

    const choice = await prisma.investigationChoice.create({
      data: {
        pointId,
        text,
        response,
        nextPointId: nextPointId || null,
        order: order || 0
      }
    });

    res.status(201).json(choice);
  } catch (error) {
    console.error('Error creating choice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 선택지 수정
router.put('/admin/choices/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { text, response, nextPointId, order } = req.body;

    const choice = await prisma.investigationChoice.update({
      where: { id },
      data: {
        ...(text && { text }),
        ...(response !== undefined && { response }),
        ...(nextPointId !== undefined && { nextPointId }),
        ...(order !== undefined && { order })
      }
    });

    res.json(choice);
  } catch (error) {
    console.error('Error updating choice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 선택지 삭제
router.delete('/admin/choices/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.investigationChoice.delete({
      where: { id }
    });

    res.json({ message: 'Choice deleted successfully' });
  } catch (error) {
    console.error('Error deleting choice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

