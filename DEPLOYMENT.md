# 서버 공개 배포 가이드

## 방법 1: 로컬 네트워크에서 공유 (같은 WiFi)

### 백엔드 서버 설정

`server/src/index.ts` 파일을 수정:

```typescript
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://YOUR_IP:${PORT}`);
});
```

### IP 주소 확인

PowerShell에서:
```powershell
ipconfig
```

"IPv4 주소"를 찾으세요 (예: 192.168.0.100)

### 프론트엔드 설정

`client/vite.config.ts`를 수정:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // 추가
    proxy: {
      '/api': {
        target: 'http://YOUR_IP:3001', // localhost를 IP로 변경
        changeOrigin: true
      }
    }
  }
});
```

또는 프론트엔드에서 직접 API URL을 IP로 변경:

`client/src/api/client.ts`:
```typescript
const api = axios.create({
  baseURL: 'http://YOUR_IP:3001/api', // 또는 환경 변수 사용
});
```

### 접속 방법

- 로컬: `http://localhost:5173`
- 같은 네트워크의 다른 기기: `http://YOUR_IP:5173`

## 방법 2: 클라우드 서버에 배포

### 옵션 A: Vercel (프론트엔드) + Railway/Render (백엔드)

#### 백엔드 배포 (Railway)
1. https://railway.app 접속
2. New Project → GitHub 연결
3. `server` 폴더 배포
4. 환경 변수 설정:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT`
5. 배포 URL 획득 (예: `https://your-app.railway.app`)

#### 프론트엔드 배포 (Vercel)
1. https://vercel.com 접속
2. New Project → GitHub 연결
3. `client` 폴더 배포
4. 환경 변수 추가:
   - `VITE_API_URL=https://your-app.railway.app`

### 옵션 B: Render (무료)

#### 백엔드
1. https://render.com 접속
2. New Web Service
3. GitHub 저장소 연결
4. Root Directory: `server`
5. Build Command: `npm install && npm run prisma:generate && npm run build`
6. Start Command: `npm start`

#### 프론트엔드
1. New Static Site
2. Root Directory: `client`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`

## 방법 3: ngrok (임시 테스트용)

### 설치
```cmd
npm install -g ngrok
```

### 백엔드 터널링
```cmd
ngrok http 3001
```

### 프론트엔드에서 API URL 변경
ngrok이 제공하는 URL (예: `https://abc123.ngrok.io`)을 사용

## 방법 4: 환경 변수 사용 (권장)

### 백엔드 `.env`
```
DATABASE_URL="..."
JWT_SECRET="..."
PORT=3001
NODE_ENV=production
CLIENT_URL="https://your-frontend-url.com"
```

### 프론트엔드 `.env`
```
VITE_API_URL=http://localhost:3001
```

프로덕션:
```
VITE_API_URL=https://your-backend-url.com
```

`client/src/api/client.ts`:
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
```

## 보안 주의사항

1. ✅ CORS 설정 확인
2. ✅ 환경 변수에 민감한 정보 저장 (`.env` 파일을 git에 커밋하지 말 것)
3. ✅ HTTPS 사용 (프로덕션)
4. ✅ 방화벽 설정 확인


