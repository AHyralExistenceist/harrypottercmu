# 프론트엔드 서버 실행 가이드

## 프론트엔드가 접속이 안 되는 경우

프론트엔드 서버를 실행해야 합니다.

## 실행 방법

### 방법 1: 클라이언트 디렉토리에서 실행

**새 터미널 창을 열고:**

```cmd
cd C:\Users\Cursor\harry\client
npm run dev
```

성공하면 다음과 같은 메시지가 표시됩니다:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

그런 다음 브라우저에서 `http://localhost:5173` 접속

### 방법 2: 루트 디렉토리에서 실행 (권장)

루트 디렉토리에서 백엔드와 프론트엔드를 동시에 실행:

```cmd
cd C:\Users\Cursor\harry
npm run dev
```

이 명령은 백엔드와 프론트엔드를 동시에 실행합니다.

### 방법 3: 각각 별도 터미널에서 실행

**터미널 1 (백엔드):**
```cmd
cd C:\Users\Cursor\harry\server
npm run dev
```

**터미널 2 (프론트엔드):**
```cmd
cd C:\Users\Cursor\harry\client
npm run dev
```

## 확인 사항

### 프론트엔드 패키지 설치 확인

클라이언트 디렉토리에 `node_modules` 폴더가 있는지 확인:

```cmd
cd C:\Users\Cursor\harry\client
dir node_modules
```

만약 없다면:
```cmd
npm install
```

### 포트 확인

- 프론트엔드: `http://localhost:5173` (Vite 기본 포트)
- 백엔드: `http://localhost:3001`

포트가 이미 사용 중이면 다른 포트로 자동 변경될 수 있습니다. 터미널 메시지를 확인하세요.

## 문제 해결

### 오류가 발생하는 경우

터미널에 표시되는 에러 메시지를 확인하고 알려주세요.

### 패키지 설치 오류

```cmd
cd C:\Users\Cursor\harry\client
npm install
```

### 포트 충돌

다른 프로그램이 5173 포트를 사용 중일 수 있습니다.
터미널에서 표시되는 실제 포트 번호를 확인하세요.


