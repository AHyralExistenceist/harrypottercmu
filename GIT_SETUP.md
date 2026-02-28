# Git 저장소 설정 및 배포 가이드

## 현재 상태
- ✅ 빌드 완료
- ❌ Git 저장소 없음

## 빠른 설정 (5분)

### 방법 1: GitHub에서 저장소 먼저 생성 (권장)

1. **GitHub 저장소 생성**
   - https://github.com/new 접속
   - Repository name: `harry` (또는 원하는 이름)
   - Public 또는 Private 선택
   - "Create repository" 클릭

2. **터미널에서 실행:**

```bash
cd C:\Users\Cursor\harry
git init
git add .
git commit -m "Initial commit: Supabase + GitHub Pages"
git branch -M main
git remote add origin https://github.com/your-username/harry.git
git push -u origin main
```

**주의**: `your-username`을 실제 GitHub 사용자명으로 변경하세요!

### 방법 2: 로컬에서 먼저 초기화

```bash
cd C:\Users\Cursor\harry
git init
git add .
git commit -m "Initial commit: Supabase + GitHub Pages"
git branch -M main
```

그 다음 GitHub에서 저장소 생성 후:
```bash
git remote add origin https://github.com/your-username/harry.git
git push -u origin main
```

## 다음 단계

GitHub에 푸시한 후:
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. Secrets 추가 (DEPLOY_NOW.md 참고)
3. Settings → Pages → Source: GitHub Actions 선택
4. 배포 완료 대기 (2-3분)

## 사이트 주소

배포 완료 후:
- `https://your-username.github.io/harry/`

(저장소 이름이 다르면 `/저장소이름/`으로 변경)

