# 해리포터 RPG 커뮤 사이트 설정 가이드

## 필수 요구사항

- Node.js 18+ 
- PostgreSQL (또는 SQLite for development)
- npm 또는 yarn

## 설치 및 실행 방법

### 1. 전체 패키지 설치

```bash
npm run install:all
```

### 2. 데이터베이스 설정

1. PostgreSQL 데이터베이스 생성 (또는 SQLite 사용)
2. `.env` 파일 생성:

```bash
cd server
cp .env.example .env
```

3. `.env` 파일 편집:
   - `DATABASE_URL` 설정
   - `JWT_SECRET` 설정 (랜덤 문자열)
   - `PORT` 설정 (기본값: 3001)

4. Prisma 마이그레이션 실행:

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

### 3. 개발 서버 실행

루트 디렉토리에서:

```bash
npm run dev
```

이 명령은 다음을 실행합니다:
- 서버: `http://localhost:3001`
- 클라이언트: `http://localhost:5173`

### 4. 프로덕션 빌드

```bash
npm run build
```

## 주요 기능

### 구현된 기능

✅ 회원가입/로그인 시스템
✅ 멤버 게시판 (3x5 그리드 레이아웃)
✅ 캐릭터 프로필 페이지
✅ 스탯 시스템 (공격/방어/민첩/행운, 1-5 범위)
✅ 전투 시스템 (TRPG 턴제, 주사위 기반)
✅ 게시판 시스템 (기본 CRUD)
✅ 상점 및 아이템 시스템
✅ 가챠 시스템
✅ 퀘스트 시스템

### 향후 구현 예정

- 다양한 게시판 타입 (캘린더, 인터렉티브 등)
- 펫 육성 시스템
- 마이룸 (스티커보드)
- 디엠 채팅
- 월드맵 및 조사 시스템
- 정산 시스템
- 연표 게시판
- 세계관 게시판

## 데이터베이스 스키마

주요 모델:
- User: 사용자
- Character: 캐릭터 (스탯 포함)
- Board: 게시판
- Post: 게시글
- Battle: 전투
- Item: 아이템
- Quest: 퀘스트

자세한 스키마는 `server/prisma/schema.prisma` 참조

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 캐릭터
- `GET /api/characters` - 캐릭터 목록
- `GET /api/characters/:id` - 캐릭터 상세
- `POST /api/characters` - 캐릭터 생성
- `PUT /api/characters/:id` - 캐릭터 수정

### 게시판
- `GET /api/boards` - 게시판 목록
- `GET /api/posts/board/:boardId` - 게시글 목록
- `GET /api/posts/:id` - 게시글 상세
- `POST /api/posts` - 게시글 생성

### 전투
- `GET /api/battles` - 전투 목록
- `POST /api/battles` - 전투 생성
- `POST /api/battles/:id/join` - 전투 참가
- `POST /api/battles/:id/start` - 전투 시작
- `POST /api/battles/:id/action` - 전투 액션

### 상점
- `GET /api/shop/items` - 아이템 목록
- `POST /api/shop/purchase` - 아이템 구매
- `POST /api/shop/gacha` - 가챠
- `GET /api/shop/my-items` - 내 아이템

### 퀘스트
- `GET /api/quests` - 퀘스트 목록
- `GET /api/quests/my-quests` - 내 퀘스트
- `POST /api/quests/:id/accept` - 퀘스트 수락
- `POST /api/quests/:id/complete` - 퀘스트 완료

## 전투 시스템 설명

### 주사위 시스템
- 6면 주사위 사용 (1-6)
- 스탯과 주사위 값을 비교하여 성공/실패 결정
- 주사위 값이 스탯보다 작거나 같으면 성공

### 데미지 계산
성공 시 주사위 값에 따른 데미지:
- 1: 30 데미지
- 2: 25 데미지
- 3: 20 데미지
- 4: 10 데미지
- 5: 5 데미지
- 6: 실패 (데미지 0)

### 액션 종류
- **공격 (ATTACK)**: 공격 스탯 사용, 성공 시 데미지
- **방어 (DEFEND)**: 방어 스탯 사용, 데미지 경감
- **반격 (COUNTER)**: 행운 스탯 사용, 반격 데미지
- **도주 (FLEE)**: 민첩 스탯 사용, 전투에서 도주

## 문제 해결

### Prisma 관련 오류
```bash
cd server
npm run prisma:generate
```

### 포트 충돌
`.env` 파일에서 `PORT` 값 변경

### 데이터베이스 연결 오류
`DATABASE_URL` 확인 및 데이터베이스 서버 실행 확인


