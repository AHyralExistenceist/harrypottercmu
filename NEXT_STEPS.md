# 다음 단계 (5분이면 완료!)

## ✅ 완료된 작업
- ✅ 의존성 설치 완료 (client, server)
- ✅ 환경 변수 파일 생성 완료 (`client/.env`)

## 🔴 지금 해야 할 일 (순서대로)

### 1단계: Supabase 프로젝트 생성 (2분)

1. https://supabase.com 접속
2. "Start your project" 클릭 → GitHub로 로그인
3. "New Project" 클릭
4. 프로젝트 정보 입력:
   - Name: `harry-potter-rpg` (원하는 이름)
   - Database Password: 강한 비밀번호 (잘 기억해두세요!)
   - Region: 가장 가까운 지역
5. "Create new project" 클릭
6. 2-3분 대기 (프로젝트 생성 중)

### 2단계: API 키 복사 (1분)

1. Supabase Dashboard → 왼쪽 메뉴 **Settings** → **API** 클릭
2. 다음을 복사:
   - **Project URL** (예: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (긴 문자열)
   - **service_role key** (긴 문자열, 서버용)

### 3단계: 환경 변수 파일 수정 (1분)

`client/.env` 파일을 열어서 다음처럼 수정하세요:

```env
VITE_SUPABASE_URL=https://여기에-Project-URL-붙여넣기
VITE_SUPABASE_ANON_KEY=여기에-anon-key-붙여넣기
```

**예시:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4단계: 데이터베이스 스키마 실행 (1분)

1. Supabase Dashboard → 왼쪽 메뉴 **SQL Editor** 클릭
2. "New query" 클릭
3. `server/supabase-migration.sql` 파일을 열어서 전체 내용 복사
4. SQL Editor에 붙여넣기
5. "Run" 버튼 클릭 (또는 Ctrl+Enter)
6. 성공 메시지 확인

### 5단계: 개발 서버 실행

터미널에서 실행:

```bash
cd client
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하면 사이트를 볼 수 있습니다! 🎉

---

## 요약

1. ✅ Supabase 프로젝트 생성 (https://supabase.com)
2. ✅ API 키 복사 (Settings → API)
3. ✅ `client/.env` 파일에 키 입력
4. ✅ 데이터베이스 스키마 실행 (`server/supabase-migration.sql`)
5. ✅ `cd client && npm run dev` 실행

**1-4단계만 완료하면 5단계는 제가 실행해드릴 수 있습니다!**

