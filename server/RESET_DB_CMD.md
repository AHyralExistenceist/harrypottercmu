# 데이터베이스 초기화 (CMD용)

## CMD에서 실행하는 방법

### 1단계: 서버 중지
서버가 실행 중이면 `Ctrl + C`로 중지

### 2단계: 데이터베이스 파일 삭제

**CMD에서:**
```cmd
cd server
del prisma\dev.db
del prisma\dev.db-journal
```

또는 파일 탐색기에서 직접 삭제:
- `server\prisma\dev.db` 파일 삭제
- `server\prisma\dev.db-journal` 파일 삭제 (있다면)

### 3단계: Prisma 클라이언트 재생성

```cmd
npm run prisma:generate
```

### 4단계: 새로운 마이그레이션 생성

```cmd
npm run prisma:migrate
```

마이그레이션 이름: `init`

### 5단계: 서버 시작

```cmd
npm run dev
```

## PowerShell을 사용하는 경우

PowerShell을 사용하려면:
1. 시작 메뉴에서 "PowerShell" 검색
2. PowerShell 실행
3. 다음 명령어 사용:

```powershell
cd C:\Users\Cursor\harry\server
Remove-Item prisma\dev.db -ErrorAction SilentlyContinue
Remove-Item prisma\dev.db-journal -ErrorAction SilentlyContinue
npm run prisma:generate
npm run prisma:migrate
npm run dev
```


