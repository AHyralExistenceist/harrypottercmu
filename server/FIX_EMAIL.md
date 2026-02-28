# email 필드 제거 문제 해결

## 문제

데이터베이스에는 아직 `email` 필드가 있지만, 코드에서는 제거했습니다.

## 해결 방법

### 1단계: 데이터베이스 마이그레이션

```powershell
cd server
npm run prisma:migrate
```

마이그레이션 이름: `remove_email`

### 2단계: Prisma 클라이언트 재생성

```powershell
npm run prisma:generate
```

### 3단계: 서버 재시작

```powershell
npm run dev
```

## 만약 마이그레이션이 실패하면

데이터베이스를 초기화하고 다시 시작:

```powershell
# 주의: 모든 데이터가 삭제됩니다!
Remove-Item prisma/dev.db -ErrorAction SilentlyContinue
npm run prisma:migrate
npm run prisma:generate
npm run dev
```


