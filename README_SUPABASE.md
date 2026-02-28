# Supabase 마이그레이션 완료

## 완료된 작업

✅ Supabase 클라이언트 설정 (서버 + 클라이언트)
✅ Supabase Auth로 인증 시스템 전환
✅ Prisma 스키마를 Supabase SQL 마이그레이션으로 변환
✅ 클라이언트 AuthContext를 Supabase Auth로 전환
✅ GitHub Pages 배포 설정 추가

## 다음 단계

### 1. Supabase 프로젝트 설정

1. Supabase 프로젝트 생성
2. `server/supabase-migration.sql` 실행
3. 환경 변수 설정 (아래 참고)

### 2. 환경 변수 설정

**클라이언트** (`client/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**서버** (`server/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

### 3. 의존성 설치

```bash
cd server && npm install
cd ../client && npm install
```

### 4. 나머지 라우트 전환 (선택사항)

현재 인증 라우트만 Supabase로 전환되었습니다. 나머지 라우트들(`user`, `board`, `post`, `character`, `battle`, `shop`, `quest`, `map`)도 필요에 따라 Supabase로 전환할 수 있습니다.

**예시:**
```typescript
// 기존 Prisma 방식
const users = await prisma.user.findMany();

// Supabase 방식
const { data: users } = await supabaseAdmin.from('users').select('*');
```

### 5. GitHub Pages 배포

1. GitHub 저장소 → Settings → Pages → Source: "GitHub Actions"
2. Secrets 설정:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. `main` 브랜치에 푸시하면 자동 배포

## 파일 구조

```
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth-supabase.ts      # Supabase 인증 라우트
│   │   │   └── auth.ts                # 기존 라우트 (백업)
│   │   ├── middleware/
│   │   │   └── supabase-auth.ts       # Supabase 인증 미들웨어
│   │   └── utils/
│   │       └── supabase.ts            # Supabase 클라이언트
│   └── supabase-migration.sql        # 데이터베이스 스키마
├── client/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # Supabase Auth 컨텍스트
│   │   ├── api/
│   │   │   └── client.ts              # Supabase 토큰 인터셉터
│   │   └── utils/
│   │       └── supabase.ts            # Supabase 클라이언트
│   └── vite.config.ts                 # GitHub Pages base 경로 설정
└── .github/
    └── workflows/
        └── deploy.yml                 # GitHub Pages 배포 워크플로우
```

## 주요 변경사항

1. **인증**: JWT → Supabase Auth
2. **데이터베이스**: Prisma/SQLite → Supabase PostgreSQL
3. **클라이언트**: 직접 Supabase 클라이언트 사용
4. **배포**: Express 서버 불필요 (선택사항)

## 참고 문서

- `SUPABASE_SETUP.md`: Supabase 설정 상세 가이드
- `DEPLOY_GITHUB_PAGES_SUPABASE.md`: 배포 가이드

