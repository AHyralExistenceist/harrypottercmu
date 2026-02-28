import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 전투 데미지 계산 함수
function calculateDamage(diceRoll: number): number {
  switch (diceRoll) {
    case 1: return 30;
    case 2: return 25;
    case 3: return 20;
    case 4: return 10;
    case 5: return 5;
    default: return 0;
  }
}

// 주사위 굴리기
function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// 전투 목록
router.get('/', async (req, res) => {
  try {
    const battles = await prisma.battle.findMany({
      include: {
        participants: {
          include: {
            user: {
              include: {
                character: true
              }
            }
          }
        },
        _count: {
          select: {
            turns: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(battles);
  } catch (error) {
    console.error('Error fetching battles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 전투
router.get('/:id', async (req, res) => {
  try {
    const battle = await prisma.battle.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          include: {
            user: {
              include: {
                character: true
              }
            }
          }
        },
        turns: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            turnNumber: 'asc'
          }
        }
      }
    });

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json(battle);
  } catch (error) {
    console.error('Error fetching battle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 전투 생성
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description, type, monsterData } = req.body;

    const battle = await prisma.battle.create({
      data: {
        name,
        description,
        type: type || 'raid',
        status: 'pending',
        monsterData: monsterData ? JSON.stringify(monsterData) : null,
        monsterHp: (monsterData as any)?.hp || 100,
        monsterMaxHp: (monsterData as any)?.hp || 100
      }
    });

    res.status(201).json(battle);
  } catch (error) {
    console.error('Error creating battle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 전투 참가
router.post('/:id/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const battleId = req.params.id;

    const battle = await prisma.battle.findUnique({
      where: { id: battleId }
    });

    if (!battle || battle.status !== 'pending') {
      return res.status(400).json({ error: 'Battle not available' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { character: true }
    });

    if (!user?.character) {
      return res.status(400).json({ error: 'Character not found' });
    }

    const participant = await prisma.battleParticipant.create({
      data: {
        battleId,
        userId,
        characterId: user.character.id,
        hp: user.character.hp,
        maxHp: user.character.maxHp,
        order: 0
      }
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error('Error joining battle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 전투 시작
router.post('/:id/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const battleId = req.params.id;

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: true
      }
    });

    if (!battle || battle.status !== 'pending') {
      return res.status(400).json({ error: 'Battle cannot be started' });
    }

    // 턴 순서 결정 (랜덤)
    const order = battle.participants.map((_, i) => i).sort(() => Math.random() - 0.5);
    
    // 참가자 순서 업데이트
    for (let i = 0; i < battle.participants.length; i++) {
      await prisma.battleParticipant.update({
        where: { id: battle.participants[i].id },
        data: { order: order[i] }
      });
    }

    const updated = await prisma.battle.update({
      where: { id: battleId },
      data: {
        status: 'in_progress',
        currentTurn: 0,
        turnOrder: JSON.stringify(order)
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error starting battle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 전투 액션 수행
router.post('/:id/action', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const battleId = req.params.id;
    const { action, targetId } = req.body;

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          include: {
            user: {
              include: {
                character: true
              }
            }
          }
        },
        turns: {
          orderBy: {
            turnNumber: 'desc'
          },
          take: 1
        }
      }
    });

    if (!battle || battle.status !== 'in_progress') {
      return res.status(400).json({ error: 'Battle not in progress' });
    }

    const participant = battle.participants.find(p => p.userId === userId);
    if (!participant) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const character = participant.user.character;
    if (!character) {
      return res.status(400).json({ error: 'Character not found' });
    }

    const lastTurn = battle.turns[0];
    const turnNumber = (lastTurn?.turnNumber || 0) + 1;

    const diceRoll = rollDice();
    let statUsed: string | null = null;
    let success = false;
    let damage = 0;

    switch (action) {
      case 'ATTACK':
        statUsed = 'ATTACK';
        success = diceRoll <= character.attack;
        if (success) {
          damage = calculateDamage(diceRoll);
          // 몬스터에게 데미지
          await prisma.battle.update({
            where: { id: battleId },
            data: {
              monsterHp: Math.max(0, (battle.monsterHp || 0) - damage)
            }
          });
        }
        break;

      case 'DEFEND':
        statUsed = 'DEFENSE';
        success = true; // 방어는 항상 성공
        break;

      case 'COUNTER':
        statUsed = 'LUCK';
        success = diceRoll <= character.luck;
        if (success && targetId) {
          damage = calculateDamage(diceRoll);
          // 반격 데미지 (추가 구현 필요)
        }
        break;

      case 'FLEE':
        statUsed = 'AGILITY';
        success = diceRoll <= character.agility;
        break;
    }

    // 턴 기록
    const turn = await prisma.battleTurn.create({
      data: {
        battleId,
        userId,
        action: action as string,
        diceRoll,
        statUsed,
        damage,
        targetId,
        success,
        turnNumber
      }
    });

    // 전투 종료 체크
    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battleId }
    });

    if (updatedBattle && (updatedBattle.monsterHp || 0) <= 0) {
      await prisma.battle.update({
        where: { id: battleId },
        data: { status: 'completed' }
      });
    }

    res.json({ turn, battle: updatedBattle });
  } catch (error) {
    console.error('Error performing battle action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

