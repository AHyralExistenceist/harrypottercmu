# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. New Project 생성
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. Region 선택 (가장 가까운 지역)

## 2. 환경 변수 설정

### 서버 환경 변수 (`.env` 파일)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 클라이언트 환경 변수 (`.env` 파일)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**주의**: `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용하고, 클라이언트에는 절대 노출하지 마세요.

## 3. 데이터베이스 스키마 생성

Supabase Dashboard → SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- users 테이블 (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- characters 테이블
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  quote TEXT,
  catchphrase TEXT,
  name TEXT NOT NULL,
  profile_image TEXT,
  portrait_image TEXT,
  description TEXT,
  background TEXT,
  attack INTEGER DEFAULT 1,
  defense INTEGER DEFAULT 1,
  agility INTEGER DEFAULT 1,
  luck INTEGER DEFAULT 1,
  hp INTEGER DEFAULT 100,
  max_hp INTEGER DEFAULT 100,
  galleon INTEGER DEFAULT 0,
  house TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 나머지 테이블들도 Prisma 스키마를 기반으로 생성 필요
-- (boards, posts, comments, items, battles, quests 등)
```

## 4. Row Level Security (RLS) 설정

Supabase Dashboard → Authentication → Policies에서 RLS 정책 설정:

```sql
-- users 테이블: 자신의 데이터만 읽기 가능
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- characters 테이블: 모든 사용자가 읽기 가능, 자신의 것만 수정 가능
CREATE POLICY "Anyone can read characters" ON characters
  FOR SELECT USING (true);

CREATE POLICY "Users can update own character" ON characters
  FOR UPDATE USING (auth.uid() = user_id);
```

## 5. 인증 설정

Supabase Dashboard → Authentication → Settings:
- Email 인증 활성화
- 필요시 소셜 로그인 설정 (Google, GitHub 등)

## 6. API 키 확인

Supabase Dashboard → Settings → API:
- Project URL: `SUPABASE_URL`
- anon/public key: `SUPABASE_ANON_KEY` (클라이언트용)
- service_role key: `SUPABASE_SERVICE_ROLE_KEY` (서버용, 절대 노출 금지)

