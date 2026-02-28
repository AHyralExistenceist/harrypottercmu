# 서버 실행 가이드

## 문제: ECONNREFUSED 오류

이 오류는 **백엔드 서버가 실행되지 않아서** 발생합니다.

## 해결 방법

### 1. 백엔드 서버 실행

**새 터미널 창을 열고:**

```powershell
cd server
npm run dev
```

서버가 시작되면 다음과 같은 메시지가 표시됩니다:
```
Server is running on port 3001
```

### 2. 프론트엔드 서버 실행

**또 다른 터미널 창을 열고:**

```powershell
cd client
npm run dev
```

클라이언트가 시작되면:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 3. 브라우저에서 접속

브라우저에서 `http://localhost:5173`를 열면 사이트를 볼 수 있습니다.

## 한 번에 실행하기

루트 디렉토리에서 (모든 패키지가 설치되어 있다면):

```powershell
npm run dev
```

이 명령은 `concurrently`를 사용하여 서버와 클라이언트를 동시에 실행합니다.

## 포트 확인

- **백엔드 서버**: `http://localhost:3001`
- **프론트엔드**: `http://localhost:5173`

백엔드 서버가 실행되지 않으면 프론트엔드에서 API 호출이 실패합니다.

## 문제 해결

### 포트가 이미 사용 중인 경우

다른 프로그램이 3001 포트를 사용 중일 수 있습니다.

`.env` 파일에서 포트를 변경:
```
PORT=3002
```

그리고 `client/vite.config.ts`에서 proxy 포트도 변경해야 합니다.

### 서버가 시작되지 않는 경우

1. 데이터베이스 마이그레이션이 완료되었는지 확인
2. `npm install`이 완료되었는지 확인
3. 에러 메시지를 확인


