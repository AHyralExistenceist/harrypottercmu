# 지금 배포하기 (5분이면 완료!)

## ✅ 완료된 작업
- 빌드 완료 (`client/dist` 폴더 생성됨)
- GitHub Actions 워크플로우 준비 완료

## 🔴 지금 해야 할 일

### 1단계: GitHub 저장소에 코드 푸시 (2분)

터미널에서 실행:

```bash
cd C:\Users\Cursor\harry
git add .
git commit -m "Supabase 마이그레이션 및 GitHub Pages 배포 준비"
git push origin main
```

**주의**: 저장소가 없으면 먼저 생성하세요:
1. https://github.com/new 접속
2. 저장소 이름: `harry` (또는 원하는 이름)
3. Public 또는 Private 선택
4. "Create repository" 클릭
5. 위 명령어 실행

### 2단계: GitHub Secrets 설정 (2분)

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** 클릭
2. **New repository secret** 클릭하여 다음 Secrets 추가:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://unnpnjxdqtrqvrcphmar.supabase.co`

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubnBuanhkcXRycXZyY3BobWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTU3OTMsImV4cCI6MjA4NzgzMTc5M30.EufdzIz-uN7qVYjQiGxxcz0nh-_y2yTcvCEOwtDXcEo`

### 3단계: GitHub Pages 활성화 (1분)

1. GitHub 저장소 → **Settings** → **Pages** 클릭
2. **Source** 선택: **GitHub Actions**
3. 저장

### 4단계: 배포 확인

1. GitHub 저장소 → **Actions** 탭 클릭
2. "Deploy to GitHub Pages" 워크플로우가 실행되는지 확인
3. 완료되면 (약 2-3분) 사이트 주소 확인:
   - `https://your-username.github.io/harry/`
   - (저장소 이름이 다르면 `/저장소이름/`으로 변경)

## 완료!

배포가 완료되면 **어디서나** 사이트에 접속할 수 있습니다! 🎉

## 문제 해결

### Actions가 실행되지 않음
→ 코드를 푸시했는지 확인하세요. `main` 브랜치에 푸시해야 합니다.

### 빌드 실패
→ Secrets가 제대로 설정되었는지 확인하세요.

### 404 에러
→ 저장소 이름이 `harry`가 아니면 `client/vite.config.ts`의 `base` 경로를 수정하세요.

