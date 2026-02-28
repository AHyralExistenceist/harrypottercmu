import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 아이템 목록
router.get('/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        price: 'asc'
      }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 아이템
router.get('/items/:id', async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 아이템 구매
router.post('/purchase', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { itemId, quantity = 1 } = req.body;

    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const character = await prisma.character.findUnique({
      where: { userId },
      select: { galleon: true }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const totalPrice = item.price * quantity;
    if (character.galleon < totalPrice) {
      return res.status(400).json({ error: 'Not enough galleons' });
    }

    await prisma.character.update({
      where: { userId },
      data: {
        galleon: {
          decrement: totalPrice
        }
      }
    });

    const userItem = await prisma.userItem.upsert({
      where: {
        userId_itemId: {
          userId,
          itemId
        }
      },
      update: {
        quantity: {
          increment: quantity
        }
      },
      create: {
        userId,
        itemId,
        quantity
      },
      include: {
        item: true
      }
    });

    res.status(201).json(userItem);
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 가챠
router.post('/gacha', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { count = 1 } = req.body;

    const character = await prisma.character.findUnique({
      where: { userId },
      select: { galleon: true }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const gachaCostPerItem = 50;
    const totalGachaCost = gachaCostPerItem * count;
    if (character.galleon < totalGachaCost) {
      return res.status(400).json({ error: 'Not enough galleons for gacha' });
    }

    await prisma.character.update({
      where: { userId },
      data: {
        galleon: {
          decrement: totalGachaCost
        }
      }
    });

    const gachaItems = await prisma.item.findMany({
      where: {
        isGacha: true
      }
    });

    if (gachaItems.length === 0) {
      return res.status(400).json({ error: 'No gacha items available' });
    }

    // 레어도 가중치 계산
    const weightedItems: any[] = [];
    gachaItems.forEach(item => {
      const weight = Math.pow(10, 6 - item.rarity); // 레어도가 높을수록 가중치 높음
      for (let i = 0; i < weight; i++) {
        weightedItems.push(item);
      }
    });

    const results = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * weightedItems.length);
      const item = weightedItems[randomIndex];

      const userItem = await prisma.userItem.upsert({
        where: {
          userId_itemId: {
            userId,
            itemId: item.id
          }
        },
        update: {
          quantity: {
            increment: 1
          }
        },
        create: {
          userId,
          itemId: item.id,
          quantity: 1
        },
        include: {
          item: true
        }
      });

      results.push(userItem);
    }

    res.json({ results });
  } catch (error) {
    console.error('Error gacha:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 사용자 아이템 목록
router.get('/my-items', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const items = await prisma.userItem.findMany({
      where: { userId },
      include: {
        item: true
      }
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 아이템 사용
router.post('/use-item', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { userItemId, quantity = 1 } = req.body;

    if (!userItemId) {
      return res.status(400).json({ error: 'userItemId is required' });
    }

    const userItem = await prisma.userItem.findUnique({
      where: { id: userItemId },
      include: { item: true }
    });

    if (!userItem || userItem.userId !== userId) {
      return res.status(404).json({ error: 'User item not found' });
    }

    if (userItem.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough items' });
    }

    const newQuantity = userItem.quantity - quantity;

    if (newQuantity <= 0) {
      await prisma.userItem.delete({
        where: { id: userItemId }
      });
      res.json({ message: 'Item used and removed', remaining: 0 });
    } else {
      const updated = await prisma.userItem.update({
        where: { id: userItemId },
        data: { quantity: newQuantity }
      });
      res.json({ message: 'Item used', remaining: updated.quantity });
    }
  } catch (error) {
    console.error('Error using item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 아이템 장착
router.post('/equip', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { itemId, characterId } = req.body;

    const userItem = await prisma.userItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId
        }
      }
    });

    if (!userItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // 다른 슬롯의 아이템 해제 (같은 타입인 경우)
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (item) {
      // TODO: 같은 타입의 다른 아이템 해제 로직
    }

    const updated = await prisma.userItem.update({
      where: { id: userItem.id },
      data: {
        isEquipped: true,
        characterId
      },
      include: {
        item: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error equipping item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 아이템 생성
router.post('/items', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, type, imageUrl, effects, price, isGacha, rarity } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const item = await prisma.item.create({
      data: {
        name,
        description: description || null,
        type: type || 'consumable',
        imageUrl: imageUrl || null,
        effects: effects ? (typeof effects === 'string' ? effects : JSON.stringify(effects)) : null,
        price: parseInt(price),
        isGacha: isGacha || false,
        rarity: rarity || 1
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 아이템 수정
router.put('/items/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const itemId = req.params.id;
    const { name, description, type, imageUrl, effects, price, isGacha, rarity } = req.body;

    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (effects !== undefined) {
      updateData.effects = effects ? (typeof effects === 'string' ? effects : JSON.stringify(effects)) : null;
    }
    if (price !== undefined) updateData.price = parseInt(price);
    if (isGacha !== undefined) updateData.isGacha = isGacha;
    if (rarity !== undefined) updateData.rarity = rarity;

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 아이템 삭제
router.delete('/items/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const itemId = req.params.id;

    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.item.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 특정 사용자의 아이템 목록 조회
router.get('/admin/user/:userId/items', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId;

    const items = await prisma.userItem.findMany({
      where: { userId },
      include: {
        item: true
      }
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 특정 사용자에게 아이템 추가
router.post('/admin/user/:userId/items', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId;
    const { itemId, quantity = 1, setQuantity = false } = req.body;

    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const userItem = await prisma.userItem.upsert({
      where: {
        userId_itemId: {
          userId,
          itemId
        }
      },
      update: {
        quantity: setQuantity ? quantity : {
          increment: quantity
        }
      },
      create: {
        userId,
        itemId,
        quantity
      },
      include: {
        item: true
      }
    });

    res.status(201).json(userItem);
  } catch (error) {
    console.error('Error adding item to user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 특정 사용자의 아이템 삭제
router.delete('/admin/user/:userId/items/:userItemId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userItemId = req.params.userItemId;

    const userItem = await prisma.userItem.findUnique({
      where: { id: userItemId }
    });

    if (!userItem) {
      return res.status(404).json({ error: 'User item not found' });
    }

    await prisma.userItem.delete({
      where: { id: userItemId }
    });

    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Error removing item from user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자: 아이템 일괄 생성 (제공된 데이터용)
router.post('/items/batch', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const createdItems = [];
    for (const itemData of items) {
      const { name, price, description, imageUrl, type, effects, isGacha, rarity } = itemData;

      if (!name || price === undefined) {
        continue;
      }

      const item = await prisma.item.create({
        data: {
          name,
          description: description || null,
          type: type || 'consumable',
          imageUrl: imageUrl || null,
          effects: effects ? (typeof effects === 'string' ? effects : JSON.stringify(effects)) : null,
          price: parseInt(price),
          isGacha: isGacha || false,
          rarity: rarity || 1
        }
      });

      createdItems.push(item);
    }

    res.status(201).json({ created: createdItems.length, items: createdItems });
  } catch (error) {
    console.error('Error creating items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


