import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// JWT_SECRET을 한 곳에서 관리하여 로그인/검증 시 동일한 키 사용 보장
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

 if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('[auth] ERROR: JWT_SECRET is not set in production environment!');
  console.error('[auth] Please set JWT_SECRET environment variable before starting the server.');
}

console.log(`[auth] JWT_SECRET loaded: ${JWT_SECRET ? '***' + JWT_SECRET.slice(-4) : 'NOT SET (using default)'}`);

// 회원가입
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request:', { username: req.body.username });
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // 사용자 생성
    console.log('Creating user...');
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'guest'
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    console.log('User created:', user.id);

    // JWT 토큰 생성
    console.log('[auth/register] Using JWT_SECRET:', JWT_SECRET ? '***' + JWT_SECRET.slice(-4) : 'default (secret)');
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('[auth/register] Token created, expires in 7 days');

    res.status(201).json({ user, token });
  } catch (error: any) {
    console.error('Registration error details:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Prisma 오류 처리
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // 기타 오류 - 상세 메시지 반환
    const errorMessage = error.message || 'Internal server error';
    console.error('Returning error:', errorMessage);
    res.status(500).json({ error: errorMessage, details: error.code || 'Unknown error' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 사용자 찾기 (캐릭터 정보 포함)
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        character: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // JWT 토큰 생성
    console.log('[auth/login] Using JWT_SECRET:', JWT_SECRET ? '***' + JWT_SECRET.slice(-4) : 'default (secret)');
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('[auth/login] Token created, expires in 7 days');

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 현재 사용자 정보
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('[auth/me] No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('[auth/me] Token received, verifying...');
    console.log('[auth/me] Using JWT_SECRET:', JWT_SECRET ? '***' + JWT_SECRET.slice(-4) : 'default (secret)');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('[auth/me] Token verified, userId:', decoded.userId);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        character: true
      }
    });

    if (!user) {
      console.log('[auth/me] User not found for userId:', decoded.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    console.log('[auth/me] User found:', user.username, 'has character:', !!user.character);
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('[auth/me] Token verification failed:', error.message);
    console.error('[auth/me] Error name:', error.name);
    if (error.name === 'TokenExpiredError') {
      console.log('[auth/me] Token expired at:', error.expiredAt);
      res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      console.log('[auth/me] Invalid token format:', error.message);
      res.status(401).json({ error: 'Invalid token format' });
    } else if (error.name === 'NotBeforeError') {
      console.log('[auth/me] Token not active yet:', error.date);
      res.status(401).json({ error: 'Token not active' });
    } else {
      console.log('[auth/me] Other error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }
});

export default router;

