import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 관리자 계정 생성 또는 확인
  const adminUsername = 'admin';
  let admin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (!admin) {
    const adminPasswordHash = await bcrypt.hash('1313', 10);
    admin = await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash: adminPasswordHash,
        role: 'admin'
      }
    });
    console.log('Created admin user:', admin.username);
  } else {
    if (admin.role !== 'admin') {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'admin' }
      });
      console.log('Updated user to admin:', admin.username);
    } else {
      console.log('Admin user already exists:', admin.username);
    }
  }

  // 테스트 사용자 생성 또는 확인
  const testUsername = 'martin';
  const testPassword = 'test123';
  let user = await prisma.user.findUnique({
    where: { username: testUsername }
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    user = await prisma.user.create({
      data: {
        username: testUsername,
        passwordHash
      }
    });
    console.log('Created test user:', user.username);
  } else {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });
    console.log('Updated test user password:', user.username);
  }

  // 기존 캐릭터 확인
  const existingCharacter = await prisma.character.findUnique({
    where: { userId: user.id }
  });

  if (existingCharacter) {
    console.log('Character already exists for user, updating...');
    const updated = await prisma.character.update({
      where: { id: existingCharacter.id },
      data: {
        firstName: '마틴 C. 린드버그',
        lastName: 'Martin C. Lindberg',
        name: '마틴 C. 린드버그 / Martin C. Lindberg',
        quote: '385,000…',
        catchphrase: '우주향',
        portraitImage: 'portrait_1.png',
        attack: 5,
        defense: 3,
        agility: 5,
        luck: 2,
        galleon: 0,
        house: 'RAVENCLAW'
      }
    });
    console.log('Updated character:', updated.name);
  } else {
    // 캐릭터 생성
    const character = await prisma.character.create({
      data: {
        userId: user.id,
        firstName: '마틴 C. 린드버그',
        lastName: 'Martin C. Lindberg',
        name: '마틴 C. 린드버그 / Martin C. Lindberg',
        quote: '385,000…',
        catchphrase: '우주향',
        portraitImage: 'portrait_1.png',
        attack: 5,
        defense: 3,
        agility: 5,
        luck: 2,
        galleon: 0,
        house: 'RAVENCLAW'
      }
    });
    console.log('Created character:', character.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

