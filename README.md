# 해리포터 기반 캐릭터 커뮤 사이트

24~30명이 함께 참여하는 해리포터 테마 롤플레잉 커뮤니티 사이트입니다.

## 주요 기능

### 게시판 시스템
- QnA 게시판 (방명록형)
- 일정 게시판 (캘린더형)
- 대화창 백업 게시판 (스레드형)
- 실시간 스토리 진행 게시판 (인터렉티브형)
- 세계관 게시판
- 연표 게시판
- 상점 게시판 (랜덤뽑기 & 아이템 조합)
- 정산 게시판
- 전투 레이드 게시판 & 시스템
- 월드맵 게시판 & 조사 시스템
- 퀘스트 게시판 & 미션 시스템
- 조사 & 탐색 게시판
- 디엠 채팅방
- 마이룸 (스티커보드 게시판)
- 신청 게시판
- 공지 게시판
- 멤버 게시판

### 게임 시스템
- 스탯 시스템 (공격/방어/민첩/행운, 1-5 범위)
- 장비 시스템
- 전투 시스템 (TRPG 턴제, 주사위 기반)
- 펫 육성 시스템
- 아이템 가챠 시스템
- 미니 게임 (베팅 등)

## 기술 스택

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT

## 설치 방법

```bash
# 모든 패키지 설치
npm run install:all

# 개발 서버 실행
npm run dev
```

## 프로젝트 구조

```
.
├── client/          # 프론트엔드 (React + TypeScript)
├── server/          # 백엔드 (Express + TypeScript)
└── shared/          # 공유 타입 정의
```


