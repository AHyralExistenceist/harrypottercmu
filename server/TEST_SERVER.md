# 서버 실행 테스트

## 서버가 시작되지 않는 경우

### 1. 서버 시작 테스트

서버 디렉토리에서:

```powershell
cd server
node --version  # Node.js 버전 확인
npm run dev
```

### 2. 확인해야 할 메시지

서버가 정상적으로 시작되면 다음 메시지가 표시됩니다:
```
Server is running on port 3001
```

만약 이 메시지가 보이지 않으면 서버 시작에 실패한 것입니다.

### 3. 가능한 오류들

#### A. 데이터베이스 마이그레이션 필요
```
Error: P1001: Can't reach database server
```

**해결:**
```powershell
npm run prisma:generate
npm run prisma:migrate
```

#### B. Prisma 클라이언트 오류
```
Cannot find module '@prisma/client'
```

**해결:**
```powershell
npm install
npm run prisma:generate
```

#### C. 포트 사용 중
```
Error: listen EADDRINUSE: address already in use :::3001
```

**해결:** 다른 포트로 변경하거나 해당 포트를 사용하는 프로세스 종료

#### D. 문법 오류
TypeScript 컴파일 오류가 표시됨

**해결:** 오류 메시지를 확인하고 수정

### 4. 간단한 테스트

서버가 시작되었는지 확인:

```powershell
# 새 터미널에서
curl http://localhost:3001/api/health
```

또는 브라우저에서 `http://localhost:3001/api/health` 접속

정상 응답:
```json
{"status":"ok","message":"Server is running"}
```

### 5. 서버 로그 확인

서버를 실행한 터미널에서 모든 에러 메시지를 복사해서 알려주세요.


