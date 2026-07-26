# 배포 & 롤백 런북 (Recipe Box v1.0.0 — Must US-001~010)

FE = React + TypeScript + Vite (`web/`, 정적 빌드)
BE = Python + FastAPI + SQLite (`server/`, ASGI)

> 원칙: **배포보다 롤백을 먼저 설계한다.** 배포 전 반드시 "롤백 절차" 절을 숙지할 것.
> 시크릿(SECRET_KEY 등)은 리포지토리에 커밋하지 않는다. 배포 환경변수/시크릿 저장소로만 주입한다.

---

## 1. 아키텍처 개요

```
[브라우저] ──HTTPS──> [리버스 프록시 / 정적 호스팅]
                          ├─ /            → web/dist (정적 SPA)
                          └─ /api/v1/*    → FastAPI (uvicorn/gunicorn)
                                              └─ SQLite (DB_PATH)
```

- 인증: 세션 쿠키(HttpOnly). HTTPS 배포에서는 `COOKIE_SECURE=true` 필수.
- API 프리픽스: `/api/v1` (프록시가 백엔드로 전달).
- 업로드 파일: `UPLOAD_DIR`에 저장, `UPLOAD_BASE_URL`로 서빙.

---

## 2. 환경변수

`server/.env.example` 참고. 운영에서 반드시 설정할 값:

| 변수 | 설명 | 운영 권장값 |
|---|---|---|
| `SECRET_KEY` | 세션 쿠키 서명 시크릿 | 길고 랜덤한 문자열 (시크릿 저장소로 주입, **커밋 금지**) |
| `DB_PATH` | SQLite 파일 경로 | 영속 볼륨 위 절대경로 (예: `/var/lib/recipebox/app.db`) |
| `COOKIE_SECURE` | Set-Cookie Secure 속성 | `true` (HTTPS 필수) |
| `UPLOAD_DIR` | 업로드 저장 디렉토리 | 영속 볼륨 위 경로 (예: `/var/lib/recipebox/uploads`) |
| `UPLOAD_BASE_URL` | 업로드 공개 base URL | `/api/v1/uploads/files` (기본값) |

`SECRET_KEY` 생성 예: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

> 주의: `DB_PATH`와 `UPLOAD_DIR`는 재배포 시에도 보존되는 **영속 스토리지**에 두어야 한다.
> 컨테이너 임시 파일시스템에 두면 재시작 때 데이터가 사라진다.

---

## 3. 빌드

### 3.1 프론트엔드 (정적)
```bash
cd web
npm ci
npm run lint && npm test && npm run build   # 산출물: web/dist/
```
`web/dist/`를 정적 호스팅(Nginx/S3+CDN 등)에 배포하고, `/api`는 백엔드로 프록시.
SPA이므로 라우팅 fallback(모든 미매칭 경로 → `index.html`)을 프록시/호스팅에 설정한다.

### 3.2 백엔드
```bash
cd server
python -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q     # 배포 전 검증(선택)
```

---

## 4. 마이그레이션 (기동 시 자동)

- 스키마는 `server/app/migrations/*.sql` 파일로만 관리한다(수동 변경 금지).
- 앱 **기동 시 FastAPI lifespan에서 `run_migrations()`가 자동 실행**된다.
  - `schema_migrations` 테이블에 적용 이력을 기록해 중복 적용을 방지(idempotent).
  - 파일명 사전순으로 미적용 마이그레이션만 순차 적용.
- 별도의 수동 마이그레이션 명령은 없다. **새 버전 배포 → 앱 기동 → 자동 적용**.

> 마이그레이션은 **전진(forward-only)** 이다. 자동 다운 마이그레이션은 제공하지 않는다.
> (롤백 시 주의사항은 5절 참고.)

---

## 5. 기동 (uvicorn / gunicorn)

### 5.1 단일 프로세스 (소규모 기본)
```bash
cd server
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### 5.2 다중 워커 (gunicorn + uvicorn worker)
```bash
cd server
.venv/bin/pip install gunicorn        # requirements 에는 미포함(운영 선택 의존성)
.venv/bin/gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8080 --workers 2 --timeout 60
```

> SQLite 주의: 다중 워커/프로세스가 같은 DB 파일에 동시 쓰기를 하면 락 경합이 생길 수 있다.
> 소규모 서비스 전제이므로 워커 수는 낮게(1~2) 유지하고, 필요 시 단일 프로세스 + 비동기로 운영한다.

### 5.3 헬스체크
- **현재 전용 헬스 엔드포인트는 없다(server는 회귀 보호 대상이라 이번 릴리스에서 추가하지 않음).**
- 임시 liveness 프로브로 사용 가능한 항상 응답하는 경로:
  - `GET /openapi.json` (FastAPI 자동 생성) → 200 이면 프로세스 정상.
- 후속 additive 개선 권장: `GET /api/v1/health` 전용 엔드포인트 추가(다음 릴리스, 사용자 승인 후 baseline 갱신).

---

## 6. 배포 절차 (요약)

1. CI 그린 확인 (backend pytest / frontend lint·test·build / harness).
2. 릴리스 태그 지정 (예: `v1.0.0`) — 배포 아티팩트를 버전으로 식별.
3. 백엔드 배포: 새 코드 + venv → 기동 (기동 시 마이그레이션 자동 적용).
4. 프론트 배포: `web/dist/` 업로드 후 CDN/캐시 무효화.
5. 스모크 테스트: `/openapi.json` 200, 로그인/레시피 목록 등 핵심 플로우 수동 확인.

---

## 7. 롤백 절차 (배포보다 먼저 설계)

### 7.1 애플리케이션 롤백 (코드/아티팩트)
- **프론트엔드**: 직전 버전의 `web/dist/` 아티팩트로 교체 후 CDN 캐시 무효화. (상태 없음 → 즉시 안전)
- **백엔드**: 직전 릴리스 태그/아티팩트로 프로세스 재기동.

### 7.2 DB 관련 주의사항 (중요)
- 마이그레이션은 **전진 전용**이다. 코드를 이전 버전으로 되돌려도 **DB 스키마는 자동으로 내려가지 않는다.**
  - v1.0.0은 초기 스키마(`001_init.sql`)만 있으므로 v1 내 롤백에서는 스키마 문제 없음.
  - **다음 릴리스에서 새 마이그레이션을 추가한 뒤 이전 버전으로 롤백할 때가 위험**하다.
    새 컬럼/테이블이 남아 있어도 구버전 코드가 동작하도록 마이그레이션을 **additive(하위호환)** 로만
    작성해야 롤백이 안전하다. (파괴적 변경은 회귀 하네스가 차단함.)
- **soft delete 기반**: 데이터는 물리 삭제하지 않고 `deleted_at`으로 표시한다.
  - 잘못된 삭제/변경은 DB 레코드의 `deleted_at`을 NULL로 되돌리는 등 데이터 레벨 복구가 가능하다.
  - 반대로 애플리케이션 롤백만으로는 이미 기록된 데이터 변경이 되돌아가지 않는다.
- **안전한 롤백을 위한 DB 백업 원칙**:
  - 각 배포 **직전**에 `DB_PATH` 파일을 스냅샷(복사)해 둔다. SQLite는 단일 파일이라 파일 복사로 백업된다.
    ```bash
    cp "$DB_PATH" "$DB_PATH.bak-$(date +%Y%m%d%H%M%S)"
    ```
  - 심각한 데이터 손상 시: 애플리케이션을 중지 → 백업 파일로 `DB_PATH` 복원 → 이전 버전 코드로 기동.
  - 업로드 파일(`UPLOAD_DIR`)도 동일하게 스냅샷 대상에 포함한다.

### 7.3 롤백 체크리스트
- [ ] 배포 직전 `DB_PATH` / `UPLOAD_DIR` 백업 완료
- [ ] 롤백 대상(직전) 아티팩트/태그 확인 가능
- [ ] 롤백 후 스모크 테스트(`/openapi.json`, 로그인, 레시피 목록)
- [ ] DB 스키마 하위호환 여부 확인(신규 마이그레이션이 있었던 경우)

---

## 8. 회귀 보호 베이스라인 (사용자 후속 조치)

이번 프로젝트는 greenfield로 **보호 베이스라인이 아직 없다**(`check.sh`는 exit 2 = 경고 후 통과).
1차 릴리스가 확정되면 **사용자가 직접** 최초 베이스라인을 캡처해 v1을 회귀 보호 대상에 편입한다:

```bash
./harness/baseline.sh          # 최초 캡처 (베이스라인 없을 때만)
```
- 이후부터 `check.sh`는 exit 2가 사라지고, 기존 화면/기능 침범(exit 1)을 **실제로 차단**한다.
- `harness/baselines/`와 `harness/baseline-history.log`는 git 커밋 대상이다.
- 이후 의도된 변경 승인은 사용자만: `./harness/baseline.sh --approve <스토리ID>`
- **에이전트/CI는 baseline.sh를 실행하지 않는다(사용자 전용).**

---

## 9. v2.3.0 배포 (레시피 상자 기능 확장 — US-014~022)

> v2.3.0은 **DB 마이그레이션이 있는 첫 후속 릴리스**다(v1.1.0/v1.2.0은 스키마 무변경). 아래 순서를 지킨다.
> 릴리스 노트: `docs/releases/v2.3.0.md`.

### 9.1 마이그레이션 (`002_v230.sql`)

- 파일: `server/app/migrations/002_v230.sql` — **additive-only**(nullable `ADD COLUMN` + 신규 테이블 `recipe_ratings`), 백필 없음.
  - `recipes.cook_time_minutes` / `ingredients.aliases_json·kcal_per_100g·default_storage·memo` / `inventory_items.storage_location` 추가.
  - 신규 테이블 `recipe_ratings`(+ 활성 UNIQUE·조회 인덱스).
- **적용 순서**: 4절 원칙과 동일 — 앱 **기동 시 lifespan `run_migrations()`가 자동 적용**한다. `schema_migrations`로 idempotent(중복 적용 방지), 파일명 사전순으로 `001_init.sql` 다음 `002_v230.sql`이 적용된다. **수동 명령 없음**.
- **선행 조건**: 배포 **직전** `DB_PATH` 스냅샷을 반드시 남긴다(7.2절 `cp "$DB_PATH" "$DB_PATH.bak-..."`).

### 9.2 배포 절차

1. CI 그린 확인 (backend pytest 64 / frontend lint·test·build 53 / harness).
   - ⚠️ **하네스 스텝은 재베이스라인(9.4) 전까지 red(exit 1)가 정상**이다. 아래 9.4를 참고해 판단한다.
2. 배포 직전 `DB_PATH`·`UPLOAD_DIR` 스냅샷.
3. 릴리스 태그 `v2.3.0` 지정.
4. 백엔드 배포: 새 코드 + venv → 기동(기동 시 `002_v230.sql` 자동 적용). 로그에서 마이그레이션 적용 확인.
5. 프론트 배포: `web/dist/` 업로드 후 CDN 캐시 무효화.
6. 스모크 테스트: `/openapi.json` 200, 로그인, 레시피 목록/상세, **홈 대시보드(`GET /dashboard`, 로그인)**, **별점 등록·취소(`PUT|DELETE /recipes/{id}/rating`)** 핵심 플로우 확인.

### 9.3 롤백 절차 (v2.3.0 → v2.0.0)

- **애플리케이션 롤백만으로 안전**: `002_v230.sql`은 additive(nullable 컬럼 + 신규 테이블)이므로 구버전(v2.0.0) 코드가 남은 컬럼/테이블을 무시하고 동작한다. **스키마 되돌림 불필요.**
- FE·BE를 직전 릴리스(v2.0.0) 아티팩트/태그로 재기동 + CDN 캐시 무효화.
- 데이터 손상 등 예외 상황에서만 배포 직전 `DB_PATH` 스냅샷으로 복원(7.2절). 마이그레이션은 **전진 전용** — 자동 다운 마이그레이션은 없다.

### 9.4 재베이스라인 (사용자 전용) — ✅ 완료 (2026-07-26)

- v2.3.0은 홈 대시보드 셸 등에 **사전 승인된 additive 편집**(App.tsx/AppLayout/Header 순수 추가)이 있어 구현 시점엔 보호 파일 무결성만 red였다(삭제 0·기능 회귀 0의 예상된 red).
- 사용자가 아래를 실행해 새 베이스라인에 반영 완료 → **하네스 전체 green, CI 하네스 스텝 green**:
  ```bash
  ./harness/baseline.sh --approve v2.3.0    # 사용자 전용, 실행됨(git_ref 1a020d7)
  ```
- (참고) 향후 보호 파일 additive 편집 시 동일 절차를 따른다. 하네스 스텝은 삭제하지 않는다.
