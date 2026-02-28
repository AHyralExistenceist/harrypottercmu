# .env 파일 문제 해결

## 문제: Prisma가 DATABASE_URL을 찾지 못함

## 해결 방법

### 방법 1: 명령어를 올바르게 입력 (세미콜론 사용)

```powershell
$env:DATABASE_URL="file:./dev.db"; npm run prisma:migrate
```

### 방법 2: 두 줄로 나누기

```powershell
$env:DATABASE_URL="file:./dev.db"
npm run prisma:migrate
```

### 방법 3: .env 파일 경로 확인

Prisma는 `prisma/schema.prisma` 파일이 있는 위치를 기준으로 `.env` 파일을 찾습니다.

`.env` 파일이 `server` 폴더에 있어야 합니다:
```
server/
  ├── .env          ← 여기!
  ├── prisma/
  │   └── schema.prisma
  └── src/
```

### 방법 4: .env 파일 내용 확인

`.env` 파일을 메모장으로 열어서 다음 형식인지 확인:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production-12345"
PORT=3001
NODE_ENV=development
```

**중요**: 따옴표가 있어야 합니다!

### 방법 5: 절대 경로 사용

```powershell
$env:DATABASE_URL="file:C:\Users\Cursor\harry\server\dev.db"
npm run prisma:migrate
```

### 방법 6: Prisma가 .env를 찾도록 설정

`server` 폴더에서 실행:
```powershell
cd C:\Users\Cursor\harry\server
npm run prisma:migrate
```

Prisma는 현재 작업 디렉토리에서 `.env` 파일을 찾습니다.


