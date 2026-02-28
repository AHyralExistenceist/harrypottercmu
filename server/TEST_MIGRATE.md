# Prisma 마이그레이션 테스트

## 문제 해결 방법

Prisma는 `schema.prisma` 파일이 있는 폴더(`prisma`)를 기준으로 `.env` 파일을 찾습니다.

### 방법 1: 환경 변수 직접 설정 (가장 확실함)

```powershell
$env:DATABASE_URL="file:./prisma/dev.db"
npm run prisma:migrate
```

또는 절대 경로:

```powershell
$env:DATABASE_URL="file:$PWD/prisma/dev.db"
npm run prisma:migrate
```

### 방법 2: .env 파일을 prisma 폴더에도 복사

`server/prisma/.env` 파일이 있어야 합니다.

### 방법 3: schema.prisma에서 직접 경로 지정 (임시)

`schema.prisma` 파일에서:
```
datasource db {
  provider = "sqlite"
  url      = "file:./prisma/dev.db"  // env() 대신 직접 경로
}
```

하지만 이 방법은 프로덕션에서 문제가 될 수 있으므로 개발용으로만 사용하세요.


