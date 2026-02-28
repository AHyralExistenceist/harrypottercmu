# 서버 시작 문제 해결

## 서버가 시작되지 않는 경우

### 1단계: 서버 디렉토리로 이동

```powershell
cd server
```

### 2단계: 서버 시작

```powershell
npm run dev
```

### 3단계: 에러 메시지 확인

서버 시작 시 **어떤 에러 메시지가 나오는지** 복사해서 알려주세요.

### 자주 발생하는 문제들

#### 문제 1: Prisma 클라이언트가 없음

에러 메시지:
```
Cannot find module '@prisma/client'
```

해결:
```powershell
npm run prisma:generate
npm run dev
```

#### 문제 2: 데이터베이스 마이그레이션 필요

에러 메시지:
```
P1001: Can't reach database server
```

해결:
```powershell
npm run prisma:migrate
npm run dev
```

#### 문제 3: TypeScript 컴파일 오류

에러 메시지에 파일 경로와 줄 번호가 표시됨

해결: 해당 파일의 오류를 수정

#### 문제 4: 포트가 이미 사용 중

에러 메시지:
```
Error: listen EADDRINUSE: address already in use :::3001
```

해결 방법 A: 다른 프로세스 종료
```powershell
# Windows에서 포트 3001 사용 중인 프로세스 찾기
netstat -ano | findstr :3001
# PID를 찾은 후
taskkill /PID <PID번호> /F
```

해결 방법 B: 다른 포트 사용
`.env` 파일에서:
```
PORT=3002
```

그리고 `client/vite.config.ts`에서도 포트 변경

### 4단계: 성공 확인

서버가 성공적으로 시작되면 다음 메시지가 표시됩니다:

```
Server is running on port 3001
```

이 메시지가 보이면 브라우저에서 `http://localhost:3001/api/health` 접속 테스트


