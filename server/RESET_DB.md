# 데이터베이스 초기화 및 재설정

## 문제

Prisma 클라이언트와 데이터베이스 스키마가 불일치합니다.

## 해결 방법: 완전 초기화

### 1단계: 서버 중지

서버가 실행 중이면 `Ctrl + C`로 중지

### 2단계: 데이터베이스 파일 삭제

```powershell
cd server
Remove-Item prisma/dev.db -ErrorAction SilentlyContinue
Remove-Item prisma/dev.db-journal -ErrorAction SilentlyContinue
```

### 3단계: 마이그레이션 폴더 정리 (선택사항)

```powershell
Remove-Item prisma/migrations -Recurse -Force -ErrorAction SilentlyContinue
```

### 4단계: Prisma 클라이언트 재생성

```powershell
npm run prisma:generate
```

### 5단계: 새로운 마이그레이션 생성

```powershell
npm run prisma:migrate
```

마이그레이션 이름: `init`

### 6단계: 서버 시작

```powershell
npm run dev
```

이제 모든 것이 초기화되고 새로운 스키마로 시작됩니다!


