# 빠른 시작 가이드

## 사이트 실행 방법

### 1단계: Node.js 설치 확인

터미널에서 다음 명령어로 Node.js가 설치되어 있는지 확인하세요:

```bash
node --version
npm --version
```

만약 설치되어 있지 않다면, [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드하세요.

### 2단계: 서버 설정

#### 서버 디렉토리로 이동
```bash
cd server
```

#### .env 파일 생성
`server` 폴더에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production-12345"
PORT=3001
NODE_ENV=development
```

> **참고**: 개발 환경에서는 SQLite를 사용합니다 (file:./dev.db). PostgreSQL을 사용하려면 `DATABASE_URL`을 PostgreSQL 연결 문자열로 변경하세요.

#### 패키지 설치
```bash
npm install
```

#### Prisma 클라이언트 생성 및 데이터베이스 마이그레이션
```bash
npm run prisma:generate
npm run prisma:migrate
```

마이그레이션 이름을 물어보면 `init`이라고 입력하세요.

### 3단계: 클라이언트 설정

새 터미널을 열고:

#### 클라이언트 디렉토리로 이동
```bash
cd client
```

#### 패키지 설치
```bash
npm install
```

### 4단계: 서버 실행

서버 디렉토리에서:
```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 5단계: 클라이언트 실행

새 터미널을 열고 클라이언트 디렉토리에서:
```bash
npm run dev
```

클라이언트가 `http://localhost:5173`에서 실행됩니다.

### 6단계: 브라우저에서 접속

브라우저를 열고 `http://localhost:5173`로 이동하세요!

## 한 번에 실행하기 (루트 디렉토리에서)

모든 패키지가 설치되었다면, 루트 디렉토리에서:

```bash
npm run install:all  # 패키지 설치 (처음 한 번만)
npm run dev          # 서버와 클라이언트 동시 실행
```

## 문제 해결

### npm이 인식되지 않는 경우
- Node.js를 재설치하거나
- 환경 변수 PATH에 Node.js가 포함되어 있는지 확인하세요

### 포트가 이미 사용 중인 경우
- `.env` 파일에서 `PORT=3001`을 다른 포트(예: `3002`)로 변경하세요
- 또는 다른 포트를 사용하는 프로그램을 종료하세요

### Prisma 오류가 발생하는 경우
```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

### 데이터베이스 오류
SQLite를 사용하는 경우 (`file:./dev.db`) 별도 설치가 필요 없습니다.
PostgreSQL을 사용하는 경우 데이터베이스 서버가 실행 중인지 확인하세요.

## 사용 방법

1. **회원가입**: `http://localhost:5173/register`에서 계정을 만드세요
2. **로그인**: 만든 계정으로 로그인하세요
3. **캐릭터 생성**: 로그인 후 캐릭터를 생성하세요 (추후 캐릭터 생성 페이지 구현 예정)
4. **게시판 탐색**: 다양한 게시판을 확인하세요
5. **전투**: 전투 시스템을 테스트해보세요
6. **상점**: 아이템을 구매하고 가챠를 돌려보세요

## 개발 팁

- 서버 코드를 수정하면 자동으로 재시작됩니다 (tsx watch)
- 클라이언트 코드를 수정하면 브라우저가 자동으로 새로고침됩니다 (Vite HMR)
- Prisma Studio로 데이터베이스를 시각적으로 확인: `cd server && npm run prisma:studio`


