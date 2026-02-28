# GitHub 저장소 생성 및 푸시 가이드

## ✅ 완료된 작업
- Git 저장소 초기화 완료
- 파일 커밋 완료
- main 브랜치 설정 완료

## 🔴 지금 해야 할 일 (2분)

### 1단계: GitHub 저장소 생성

1. **브라우저에서 접속**: https://github.com/new
2. **저장소 정보 입력**:
   - Repository name: `harry` (또는 원하는 이름)
   - Description: (선택사항) "Harry Potter RPG Game"
   - Public 또는 Private 선택
   - **"Initialize this repository with" 체크박스는 모두 해제** (이미 로컬에 커밋이 있으므로)
3. **"Create repository" 클릭**

### 2단계: 저장소 URL 복사

생성된 저장소 페이지에서:
- 초록색 "Code" 버튼 클릭
- HTTPS URL 복사 (예: `https://github.com/your-username/harry.git`)

### 3단계: 푸시 (터미널에서 실행)

아래 명령어를 실행하세요. `YOUR-USERNAME`과 `harry`를 실제 값으로 변경하세요:

```bash
cd C:\Users\Cursor\harry
git remote add origin https://github.com/YOUR-USERNAME/harry.git
git push -u origin main
```

**예시:**
```bash
git remote add origin https://github.com/john/harry.git
git push -u origin main
```

### 4단계: GitHub Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭하여 추가:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://unnpnjxdqtrqvrcphmar.supabase.co`

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubnBuanhkcXRycXZyY3BobWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTU3OTMsImV4cCI6MjA4NzgzMTc5M30.EufdzIz-uN7qVYjQiGxxcz0nh-_y2yTcvCEOwtDXcEo`

### 5단계: GitHub Pages 활성화

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source** 선택: **GitHub Actions**
3. 저장

### 6단계: 배포 확인

1. GitHub 저장소 → **Actions** 탭
2. "Deploy to GitHub Pages" 워크플로우 실행 확인
3. 완료되면 (2-3분) 사이트 접속:
   - `https://YOUR-USERNAME.github.io/harry/`

## 완료! 🎉

배포가 완료되면 **어디서나** 사이트에 접속할 수 있습니다!

