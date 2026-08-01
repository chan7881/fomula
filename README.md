# 수식·그래프 애니메이션 생성기

LaTeX 수식이나 엑셀 데이터를 입력하면 [Manim](https://www.manim.community/)이 GIF·MP4·PNG 애니메이션으로 렌더링해주는 편집기입니다.

- `frontend/` — React + Vite + Tailwind 에디터 UI
- `backend/` — FastAPI + Manim 렌더링 서버

## GitHub Pages 배포 관련 안내

GitHub Pages는 정적 파일만 서빙할 수 있어 Python/Manim 백엔드는 온라인에서 실행되지 않습니다.
`main` 브랜치에 푸시하면 GitHub Actions가 `frontend/`만 빌드해 Pages로 배포하므로,
Pages 사이트에서는 에디터 UI는 볼 수 있지만 **생성(Generate) 버튼은 백엔드가 별도로 떠 있어야 동작**합니다.

실제 렌더링까지 포함해 전체 기능을 쓰려면 로컬에서 백엔드까지 함께 실행하세요.

## 로컬 실행

```bash
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
cd ..
run.bat
```

`run.bat`이 백엔드(`http://localhost:8000`)와 프론트엔드(`http://localhost:5173`)를 각각 새 창에서 띄웁니다.

## 백엔드를 온라인에 배포하려면

Render, Railway 등에 `backend/`를 배포한 뒤, 프론트엔드 빌드 시
`VITE_API_BASE_URL` 환경 변수를 배포한 백엔드 URL로 지정하면 Pages에서도 생성 기능이 동작합니다.

```bash
VITE_API_BASE_URL=https://your-backend.example.com npm run build
```
