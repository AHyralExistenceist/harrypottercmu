# 폰트 설정 가이드

## 빛의 계승자체 폰트 추가 방법

### 방법 1: 폰트 파일 다운로드 및 추가

1. **빛의 계승자체 폰트 파일 다운로드**
   - `.woff2`, `.woff`, 또는 `.ttf` 형식의 파일 준비

2. **폰트 파일을 `client/public/fonts/` 폴더에 복사**
   ```
   client/
     public/
       fonts/
         LightOfSuccessor.woff2
         LightOfSuccessor.woff
         LightOfSuccessor.ttf
   ```

3. **폰트가 자동으로 적용됩니다**

### 방법 2: 온라인 폰트 사용 (임시)

현재는 Google Fonts의 `Cinzel`과 `MedievalSharp`가 폴백으로 설정되어 있습니다.
빛의 계승자체 폰트 파일을 추가하면 자동으로 우선 사용됩니다.

### 방법 3: CDN 사용 (가능한 경우)

만약 빛의 계승자체가 CDN에서 제공된다면:

`client/index.html`에 추가:
```html
<link href="폰트_CDN_URL" rel="stylesheet">
```

그리고 `client/src/index.css`에서:
```css
@font-face {
  font-family: 'Light of Successor';
  src: url('폰트_CDN_URL');
}
```

## 현재 설정

- **한글**: 빛의 계승자체 (파일 추가 필요)
- **영문 폴백**: Cinzel, MedievalSharp (Google Fonts)
- **기본 스타일**: 판타지 테마에 맞게 골드/브라운 색상 사용


