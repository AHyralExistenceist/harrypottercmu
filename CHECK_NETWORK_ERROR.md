# Network Error 해결 방법

## 확인 사항

### 1. 백엔드 서버가 실행 중인가요?

**백엔드 서버를 실행한 터미널에서** 다음 메시지가 보여야 합니다:

```
Server is running on port 3001
```

이 메시지가 **보이지 않으면** 서버가 시작되지 않은 것입니다.

### 2. 서버 상태 테스트

브라우저에서 직접 접속해보세요:

```
http://localhost:3001/api/health
```

**정상이면:**
```json
{"status":"ok","message":"Server is running"}
```

**접속이 안 되면:** 서버가 실행되지 않은 것입니다.

### 3. 서버 실행 방법

새 터미널 창에서:

```cmd
cd C:\Users\Cursor\harry\server
npm run dev
```

"Server is running on port 3001" 메시지가 보여야 합니다.

### 4. 프론트엔드와 백엔드 동시 실행

**방법 1: 각각 다른 터미널에서 실행**

터미널 1 (백엔드):
```cmd
cd C:\Users\Cursor\harry\server
npm run dev
```

터미널 2 (프론트엔드):
```cmd
cd C:\Users\Cursor\harry\client
npm run dev
```

**방법 2: 루트에서 한 번에 실행**

```cmd
cd C:\Users\Cursor\harry
npm run dev
```

### 5. 포트 확인

- 백엔드: `http://localhost:3001` ← 이게 작동해야 함
- 프론트엔드: `http://localhost:5173`

### 6. 브라우저 콘솔 확인

F12를 눌러 개발자 도구를 열고:
- Console 탭에서 에러 메시지 확인
- Network 탭에서 `/api/auth/register` 요청이 실패하는지 확인

## 문제 해결 순서

1. ✅ 백엔드 서버 실행 확인 (`http://localhost:3001/api/health` 접속 테스트)
2. ✅ 프론트엔드 서버 실행 확인 (`http://localhost:5173` 접속)
3. ✅ 두 서버가 모두 실행 중인 상태에서 회원가입 시도


