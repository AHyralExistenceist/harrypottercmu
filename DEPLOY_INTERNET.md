# 인터넷에 공개하기 (Railway + Vercel)

## 가장 간단한 무료 배포 방법

### 전제 조건
1. GitHub 계정 필요
2. 코드를 GitHub 저장소에 푸시 필요

---

## 1단계: GitHub에 코드 올리기

### GitHub 저장소 생성 및 푸시

```cmd
cd C:\Users\Cursor\harry
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

---

## 2단계: 백엔드 배포 (Railway)

### Railway 가입 및 설정

1. **Railway 가입**: https://railway.app 접속 후 GitHub로 로그인

2. **새 프로젝트 생성**:
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - 저장소 선택
   - "Root Directory" 설정: `server`

3. **환경 변수 설정** (Variables 탭):
   ```
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=your-very-secret-key-change-this
   PORT=3001
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```

4. **Build 설정** (Settings → Build):
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npm start`
   - Healthcheck Path: `/api/health`

5. **PostgreSQL 데이터베이스 추가** (더 안정적):
   - "New" → "Database" → "Add PostgreSQL"
   - 생성된 `DATABASE_URL`을 환경 변수에 복사

6. **도메인 확인**:
   - Settings → Networking에서 생성된 URL 확인
   - 예: `https://your-app.railway.app`

---

## 3단계: 프론트엔드 배포 (Vercel)

### Vercel 가입 및 설정

1. **Vercel 가입**: https://vercel.com 접속 후 GitHub로 로그인

2. **새 프로젝트 생성**:
   - "Add New" → "Project"
   - GitHub 저장소 선택
   - Root Directory: `client`
   - Framework Preset: Vite

3. **환경 변수 설정**:
   ```
   VITE_API_URL=https://your-app.railway.app
   ```

4. **빌드 설정**:
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **배포 완료**:
   - 자동으로 배포 URL 생성
   - 예: `https://your-app.vercel.app`

---

## 4단계: 코드 수정 (환경 변수 사용)

### 프론트엔드 API 클라이언트 수정

`client/src/api/client.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 서버 CORS 설정 확인

`server/src/index.ts`의 CORS 설정이 올바른지 확인:

```typescript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
```

---

## 5단계: 환경 변수 업데이트

### Railway에서 백엔드 환경 변수 업데이트

`CLIENT_URL`을 Vercel에서 제공한 URL로 변경:
```
CLIENT_URL=https://your-app.vercel.app
```

### Railway 재배포

변경 사항 적용을 위해 재배포

---

## 대안: Render 사용 (Railway 대신)

### Render 백엔드 배포

1. https://render.com 접속 후 가입

2. **새 Web Service**:
   - GitHub 저장소 연결
   - Root Directory: `server`
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npm start`
   - Environment: Node

3. **PostgreSQL 데이터베이스 추가**:
   - "New" → "PostgreSQL"
   - 생성된 내부 데이터베이스 URL 사용

4. **환경 변수 설정**:
   ```
   DATABASE_URL=(Render가 자동 생성)
   JWT_SECRET=your-secret-key
   CLIENT_URL=https://your-app.vercel.app
   ```

---

## 주요 체크리스트

- [ ] GitHub에 코드 푸시
- [ ] Railway/Render에서 백엔드 배포
- [ ] PostgreSQL 데이터베이스 연결 (또는 Railway의 PostgreSQL 사용)
- [ ] 환경 변수 설정
- [ ] Vercel에서 프론트엔드 배포
- [ ] CORS 설정 확인
- [ ] 백엔드 URL을 프론트엔드 환경 변수에 설정

---

## 문제 해결

### 데이터베이스 문제

SQLite는 프로덕션에서 문제가 있을 수 있습니다. PostgreSQL 사용 권장:
- Railway: "New" → "Database" → "Add PostgreSQL"
- Render: "New" → "PostgreSQL"

### CORS 오류

서버의 CORS 설정에서 프론트엔드 URL이 허용되었는지 확인

### 환경 변수 문제

배포 후에도 환경 변수가 설정되지 않으면 재배포 필요


