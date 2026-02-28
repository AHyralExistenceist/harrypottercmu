# 빠른 문제 해결

## 문제: 서버 연결 실패 (ECONNREFUSED)

### 단계별 확인

#### 1. 백엔드 서버가 실행 중인지 확인

**서버를 실행한 터미널에서** 다음 메시지가 보여야 합니다:

```
Server is running on port 3001
```

이 메시지가 **보이지 않으면** 서버가 시작되지 않은 것입니다.

#### 2. 서버 시작 시 오류 확인

서버를 실행한 터미널에서 **빨간색 에러 메시지**가 있는지 확인하세요.

**자주 발생하는 오류:**

##### A. Prisma 클라이언트 오류
```
Error: Cannot find module '@prisma/client'
```

**해결:**
```powershell
cd server
npm run prisma:generate
```

##### B. 데이터베이스 오류
```
Error: P1001: Can't reach database server
```

**해결:**
```powershell
cd server
npm run prisma:migrate
```

##### C. 문법 오류
TypeScript 컴파일 오류가 표시됨

**해결:** 오류 메시지를 읽고 해당 파일을 수정

#### 3. 서버가 시작되었는지 테스트

브라우저에서 직접 접속:

```
http://localhost:3001/api/health
```

또는 PowerShell에서:

```powershell
cd server
node check-server.js
```

**정상 응답:**
```json
{"status":"ok","message":"Server is running"}
```

#### 4. 서버 재시작

1. 서버 터미널에서 `Ctrl + C`로 종료
2. 다시 시작:

```powershell
cd server
npm run dev
```

3. "Server is running on port 3001" 메시지 확인
4. 프론트엔드에서 회원가입 다시 시도

### 중요한 확인 사항

**서버를 실행한 터미널에서:**
1. ✅ "Server is running on port 3001" 메시지가 보이나요?
2. ❌ 빨간색 에러 메시지가 있나요?
3. 어떤 메시지들이 표시되나요?

**이 정보를 알려주시면 정확히 해결할 수 있습니다!**


