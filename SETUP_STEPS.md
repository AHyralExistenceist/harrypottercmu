# 사이트를 보기 위한 단계별 가이드

## 현재 상태
✅ 코드는 준비되었지만, Supabase 프로젝트와 환경 변수 설정이 필요합니다.

## 단계별 진행 방법

### 1단계: Supabase 프로젝트 생성 (5분)

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub로 로그인 (또는 이메일로 가입)
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - **Name**: `harry-potter-rpg` (원하는 이름)
   - **Database Password**: 강한 비밀번호 입력 (잘 기억해두세요!)
   - **Region**: 가장 가까운 지역 선택
6. "Create new project" 클릭
7. 프로젝트 생성 완료까지 2-3분 대기

### 2단계: Supabase API 키 확인 (1분)

1. Supabase Dashboard에서 왼쪽 메뉴 → **Settings** → **API** 클릭
2. 다음 정보를 복사해두세요:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: 긴 문자열 (클라이언트용)
   - **service_role key**: 긴 문자열 (서버용, 절대 노출 금지!)

### 3단계: 데이터베이스 스키마 생성 (2분)

1. Supabase Dashboard에서 왼쪽 메뉴 → **SQL Editor** 클릭
2. "New query" 클릭
3. `server/supabase-migration.sql` 파일을 열어서 전체 내용 복사
4. SQL Editor에 붙여넣기
5. "Run" 버튼 클릭 (또는 Ctrl+Enter)
6. 성공 메시지 확인

### 4단계: 환경 변수 파일 생성 (2분)

#### 클라이언트 환경 변수

`client` 폴더에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**주의**: `your-project-id`와 `your-anon-key-here`를 2단계에서 복사한 실제 값으로 교체하세요!

#### 서버 환경 변수 (선택사항 - Socket.io 등 필요시만)

`server` 폴더에 `.env` 파일 생성:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3001
```

### 5단계: 의존성 설치 (3분)

터미널에서 실행:

```bash
# 서버 의존성 설치
cd server
npm install

# 클라이언트 의존성 설치
cd ../client
npm install
```

### 6단계: 개발 서버 실행 (1분)

```bash
# client 폴더에서 실행
cd client
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하면 사이트를 볼 수 있습니다!

## 문제 해결

### 에러: "Cannot find module '@supabase/supabase-js'"
→ 5단계 의존성 설치를 다시 실행하세요:
```bash
cd client && npm install
```

### 에러: "SUPABASE_URL is not set"
→ 4단계에서 `.env` 파일을 제대로 만들었는지 확인하세요.
→ 파일 이름이 정확히 `.env`인지 확인 (`.env.txt` 아님!)

### 에러: "Invalid API key"
→ 2단계에서 복사한 키가 정확한지 확인하세요.
→ Supabase Dashboard → Settings → API에서 다시 확인

### 로그인/회원가입이 안 됨
→ 3단계 데이터베이스 스키마가 제대로 실행되었는지 확인하세요.
→ Supabase Dashboard → Table Editor에서 `users` 테이블이 있는지 확인

## 다음 단계 (배포)

로컬에서 잘 작동하면 GitHub Pages로 배포할 수 있습니다:

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 Secrets 추가:
   - `VITE_SUPABASE_URL`: Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon key
3. 코드를 GitHub에 푸시하면 자동 배포됩니다!

