import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

function parseNameToFirstAndLast(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }
  const trimmedName = fullName.trim();
  if (trimmedName.includes(' / ')) {
    const parts = trimmedName.split(' / ').map(s => s.trim());
    const koreanRegex = /[\uAC00-\uD7A3\u3131-\u318E]/;
    const englishRegex = /^[A-Za-z\s.]+$/;
    const koreanPart = parts.find(part => koreanRegex.test(part)) || '';
    const englishPart = parts.find(part => englishRegex.test(part)) || '';
    return {
      firstName: koreanPart,
      lastName: englishPart || (parts.length > 1 ? parts[parts.length - 1] : '')
    };
  }
  const koreanRegex = /[\uAC00-\uD7A3\u3131-\u318E]/;
  const hasKorean = koreanRegex.test(trimmedName);
  const hasEnglish = /[A-Za-z]/.test(trimmedName);
  if (hasKorean && hasEnglish) {
    const match = trimmedName.match(/^([가-힣\u3131-\u318E\s.]+)\s*\/\s*([A-Za-z\s.]+)$/);
    if (match) {
      return { firstName: match[1].trim(), lastName: match[2].trim() };
    }
  }
  if (hasKorean) {
    return { firstName: trimmedName, lastName: '' };
  }
  if (hasEnglish) {
    return { firstName: '', lastName: trimmedName };
  }
  return { firstName: trimmedName, lastName: '' };
}

// 캐릭터 목록 (멤버 게시판)
router.get('/', async (req, res) => {
  try {
    const characters = await prisma.character.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        equippedItems: {
          include: {
            item: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 모든 캐릭터 목록
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const characters = await prisma.character.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(characters);
  } catch (error) {
    console.error('Error fetching all characters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 캐릭터 상세 정보
router.get('/:id', async (req, res) => {
  try {
    const character = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        equippedItems: {
          include: {
            item: true
          }
        },
        relationships: {
          include: {
            characterB: true
          }
        },
        relationships2: {
          include: {
            characterA: true
          }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 캐릭터 생성
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { userId: targetUserId, firstName, lastName, quote, catchphrase, name, displayName, profileImage, portraitImage, description, background, attack, defense, agility, luck, galleon, house, gender, height, weight, personalityKeywords, personalityDescriptions, notes } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const characterUserId = user?.role === 'admin' && targetUserId ? targetUserId : userId;

    // 이미 캐릭터가 있는지 확인
    const existing = await prisma.character.findUnique({
      where: { userId: characterUserId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Character already exists' });
    }

    // 필수 필드 검증
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // name을 파싱하여 firstName(한글), lastName(영어)로 분리
    const { firstName: parsedFirstName, lastName: parsedLastName } = parseNameToFirstAndLast(name);
    const finalFirstName = firstName || parsedFirstName || '';
    const finalLastName = lastName || parsedLastName || '';

    // 스탯 검증 (1-5)
    const stats = {
      attack: Math.max(1, Math.min(5, attack || 1)),
      defense: Math.max(1, Math.min(5, defense || 1)),
      agility: Math.max(1, Math.min(5, agility || 1)),
      luck: Math.max(1, Math.min(5, luck || 1))
    };

    const character = await prisma.character.create({
      data: {
        userId: characterUserId,
        firstName: finalFirstName,
        lastName: finalLastName,
        quote: quote || null,
        catchphrase: catchphrase || null,
        name: name.trim(),
        displayName: displayName?.trim() || null,
        profileImage,
        portraitImage: portraitImage || null,
        description,
        background,
        galleon: galleon !== undefined ? galleon : 0,
        house: house || null,
        gender: gender || null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        personalityKeywords: personalityKeywords && Array.isArray(personalityKeywords) && personalityKeywords.length > 0 ? JSON.stringify(personalityKeywords) : null,
        personalityDescriptions: personalityDescriptions && typeof personalityDescriptions === 'object' ? JSON.stringify(personalityDescriptions) : null,
        notes: notes || null,
        ...stats
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(201).json(character);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 캐릭터 수정
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const characterId = req.params.id;
    const { firstName, lastName, quote, catchphrase, name, displayName, profileImage, portraitImage, description, background, attack, defense, agility, luck, galleon, house, gender, height, weight, personalityKeywords, personalityDescriptions, notes, defaultSlot } = req.body;

    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (character.userId !== userId && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 스탯 검증 및 업데이트 데이터 구성
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim();
      const { firstName: parsedFirstName, lastName: parsedLastName } = parseNameToFirstAndLast(name);
      updateData.firstName = parsedFirstName || '';
      updateData.lastName = parsedLastName || '';
    } else {
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
    }
    if (quote !== undefined) updateData.quote = quote;
    if (catchphrase !== undefined) updateData.catchphrase = catchphrase;
    if (displayName !== undefined) updateData.displayName = displayName?.trim() || null;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (portraitImage !== undefined) updateData.portraitImage = portraitImage;
    if (description !== undefined) updateData.description = description;
    if (background !== undefined) updateData.background = background;
    if (galleon !== undefined) updateData.galleon = Math.max(0, galleon);
    if (house !== undefined) updateData.house = house || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (height !== undefined) updateData.height = Number(height) > 0 ? Number(height) : null;
    if (weight !== undefined) updateData.weight = Number(weight) > 0 ? Number(weight) : null;
    if (personalityKeywords !== undefined) {
      if (Array.isArray(personalityKeywords) && personalityKeywords.length >= 3) {
        updateData.personalityKeywords = JSON.stringify(personalityKeywords);
      } else if (personalityKeywords === null) {
        updateData.personalityKeywords = null;
      }
    }
    if (personalityDescriptions !== undefined) {
      if (typeof personalityDescriptions === 'object' && personalityDescriptions !== null) {
        updateData.personalityDescriptions = JSON.stringify(personalityDescriptions);
      } else if (personalityDescriptions === null) {
        updateData.personalityDescriptions = null;
      }
    }
    if (notes !== undefined) updateData.notes = notes || null;
    
    if (defaultSlot !== undefined && user?.role === 'admin') {
      const slotValue = (defaultSlot >= 1 && defaultSlot <= 4) ? defaultSlot : null;
      await prisma.character.updateMany({
        data: { defaultSlot: slotValue }
      });
      updateData.defaultSlot = slotValue;
    }
    
    if (attack !== undefined) updateData.attack = Math.max(1, Math.min(5, attack));
    if (defense !== undefined) updateData.defense = Math.max(1, Math.min(5, defense));
    if (agility !== undefined) updateData.agility = Math.max(1, Math.min(5, agility));
    if (luck !== undefined) updateData.luck = Math.max(1, Math.min(5, luck));

    const updated = await prisma.character.update({
      where: { id: characterId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 캐릭터 삭제 (관리자 전용)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const characterId = req.params.id;

    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    await prisma.character.delete({
      where: { id: characterId }
    });

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 캐릭터 관계 추가
router.post('/:id/relationships', authenticate, async (req: AuthRequest, res) => {
  try {
    const characterAId = req.params.id;
    const { characterBId, relationship, description } = req.body;

    if (!characterBId || !relationship) {
      return res.status(400).json({ error: 'characterBId and relationship are required' });
    }

    if (characterAId === characterBId) {
      return res.status(400).json({ error: 'Cannot create relationship with self' });
    }

    const characterA = await prisma.character.findUnique({
      where: { id: characterAId }
    });

    if (!characterA) {
      return res.status(404).json({ error: 'Character A not found' });
    }

    const characterB = await prisma.character.findUnique({
      where: { id: characterBId }
    });

    if (!characterB) {
      return res.status(404).json({ error: 'Character B not found' });
    }

    const existingRel = await prisma.characterRelationship.findFirst({
      where: {
        characterAId,
        characterBId
      }
    });

    if (existingRel) {
      const updated = await prisma.characterRelationship.update({
        where: { id: existingRel.id },
        data: {
          relationship,
          description: description || null
        },
        include: {
          characterA: true,
          characterB: true
        }
      });
      return res.status(200).json(updated);
    }

    const rel = await prisma.characterRelationship.create({
      data: {
        characterAId,
        characterBId,
        relationship,
        description: description || null
      },
      include: {
        characterA: true,
        characterB: true
      }
    });

    res.status(201).json(rel);
  } catch (error: any) {
    console.error('Error creating relationship:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Relationship already exists', details: error.meta });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 캐릭터 관계 수정
router.put('/:id/relationships/:relationshipId', authenticate, async (req: AuthRequest, res) => {
  try {
    const relationshipId = req.params.relationshipId;
    const characterId = req.params.id;
    const { relationship, description } = req.body;

    const rel = await prisma.characterRelationship.findUnique({
      where: { id: relationshipId }
    });

    if (!rel) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    if (rel.characterAId !== characterId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.characterRelationship.update({
      where: { id: relationshipId },
      data: {
        relationship: relationship !== undefined ? relationship : rel.relationship,
        description: description !== undefined ? (description || null) : rel.description
      },
      include: {
        characterA: true,
        characterB: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 캐릭터 관계 삭제
router.delete('/:id/relationships/:relationshipId', authenticate, async (req: AuthRequest, res) => {
  try {
    const relationshipId = req.params.relationshipId;
    const characterId = req.params.id;

    const rel = await prisma.characterRelationship.findUnique({
      where: { id: relationshipId }
    });

    if (!rel) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    if (rel.characterAId !== characterId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.characterRelationship.delete({
      where: { id: relationshipId }
    });

    res.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


