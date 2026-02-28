# .env 파일 설정 가이드

## .env 파일 생성 방법

`server` 폴더에 `.env` 파일을 생성하세요.

### SQLite 사용 (개발용, 추천)

`.env` 파일 내용:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production-12345"
PORT=3001
NODE_ENV=development
```

### PostgreSQL 사용

`.env` 파일 내용:

```
DATABASE_URL="postgresql://사용자명:비밀번호@localhost:5432/데이터베이스명"
JWT_SECRET="your-secret-key-change-in-production-12345"
PORT=3001
NODE_ENV=development
```

**중요**: 
- SQLite를 사용하는 경우 별도의 데이터베이스 서버 설치가 필요 없습니다.
- PostgreSQL을 사용하려면 `server/prisma/schema.prisma` 파일의 `provider`를 `"postgresql"`로 변경해야 합니다.

## Windows에서 .env 파일 생성 방법

1. `server` 폴더로 이동
2. 메모장이나 텍스트 에디터를 열고 위의 내용을 입력
3. 파일 이름을 `.env`로 저장 (파일 형식: 모든 파일)
4. 또는 PowerShell에서:
   ```powershell
   cd server
   echo 'DATABASE_URL="file:./dev.db"' > .env
   echo 'JWT_SECRET="your-secret-key-change-in-production-12345"' >> .env
   echo 'PORT=3001' >> .env
   echo 'NODE_ENV=development' >> .env
   ```


