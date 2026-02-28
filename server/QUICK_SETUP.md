# 서버 빠른 설정

## Windows에서 실행하기

### 1. .env 파일 생성

`server` 폴더에 `.env` 파일을 생성하고 다음을 입력:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production-12345"
PORT=3001
NODE_ENV=development
```

### 2. 패키지 설치 및 데이터베이스 설정

```powershell
# 서버 폴더로 이동
cd server

# 패키지 설치
npm install

# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션 (이름은 'init' 입력)
npm run prisma:migrate
```

### 3. 서버 실행

```powershell
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다!

## PostgreSQL 사용하기

PostgreSQL을 사용하려면 `.env` 파일의 `DATABASE_URL`을 다음과 같이 변경:

```
DATABASE_URL="postgresql://사용자명:비밀번호@localhost:5432/데이터베이스명"
```


