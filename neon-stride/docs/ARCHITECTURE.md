# 구조와 개발 안내

원본은 `src/`, 웹 배포 결과는 `dist/`, 파일 하나로 배포하는 결과는 `NEON-STRIDE.html`입니다. 자산 조립은 Node.js 내장 기능으로 처리하고, 빌드 결과의 포맷팅에는 개발 의존성인 Prettier를 사용합니다. 처음 작업할 때는 `npm ci`를 실행합니다.

## 기능별 수정 위치

| 수정할 내용                                 | 파일·폴더                                |
| ------------------------------------------- | ---------------------------------------- |
| 점프·중력·슬라이드·점수·충돌 여유·생성 간격 | `src/config/rules.js`                    |
| 난이도별 속도·예고 시간·간격·버튼 문구      | `src/config/difficulties.js`             |
| 단축키·스와이프 기준                        | `src/config/controls.js`                 |
| 상태·실패 안내·HUD 설정                     | `src/config/interface.js`                |
| 효과음 주파수·길이·파형·아이콘              | `src/config/sounds.js`                   |
| 러너 상태와 조작                            | `src/game/runner.js`                     |
| 점프·낙하 적분과 시간 진행                  | `src/game/physics/`                      |
| 장애물 정의·생성·충돌                       | `src/game/obstacles/`                    |
| 발 궤적·관절·팔 스윙·몸통·낙하 포즈         | `src/animation/`                         |
| 원근 투영·기본 도형                         | `src/rendering/canvas-surface.js`        |
| 하늘·건물·도로                              | `src/rendering/world/`                   |
| 괴물·나무·철골·화염·방벽·게이트 그림        | `src/rendering/obstacles/`               |
| 신발·다리·팔·몸통·머리·슬라이드 그림        | `src/rendering/character/`               |
| 화면의 그리기 순서                          | `src/rendering/composition.js`           |
| 점수·결과·난이도·도움말·오버레이            | `src/ui/`의 각 `controller.js`           |
| 마크업                                      | `src/ui/`의 HTML 조각과 `src/index.html` |
| 색·배치·반응형·충돌 효과                    | `src/styles/`                            |
| 키보드·터치·창 이탈                         | `src/input/`                             |
| 브라우저 기록·Web Audio                     | `src/services/`                          |

숫자를 공통화할 때는 같은 의미인지 먼저 확인합니다. 게임 규칙은 설정에서 공유하고, 특정 물체의 모양·색·좌표는 해당 렌더러에 둡니다. 모양이 우연히 같은 수치를 쓴다는 이유만으로 서로 다른 물체를 하나의 설정에 묶지 않습니다.

## 실행과 의존 관계

```text
app.js
  └─ application/create-app.js
       ├─ game/runner.js → physics / obstacles → config
       ├─ rendering/scene.js → world / obstacles / character → animation
       ├─ input → 러너 조작과 UI 동기화
       ├─ ui → 표시 상태와 사용자 이벤트
       └─ services → 저장소·오디오
```

엔진은 DOM과 Canvas를 참조하지 않습니다. 렌더러는 게임 상태를 읽고 자신의 포즈 보간 상태만 관리합니다. 앱 조립 계층이 엔진·화면·입력·서비스를 연결합니다. `createApplication()`은 각 인스턴스의 상태를 만들고 `destroy()`로 이벤트와 루프를 정리합니다.

`src/engine.js`와 `src/renderer.js`는 짧은 공개 진입점입니다. 미리보기 도구와 기존 import 경로를 위해 유지하며, 실제 구현은 기능 폴더에 둡니다.

## 빌드

프로젝트 폴더에서 실행합니다.

```bash
npm run build
npm run build:standalone
```

첫 명령은 기존 `dist/`를 지우고 원본의 JS·CSS·아이콘을 복사하며, HTML 조각을 조립해 `dist/index.html`을 만듭니다. 두 번째 명령은 같은 빌드 후 단일 HTML도 갱신합니다. 생성 파일이 커져도 직접 편집하는 컴포넌트 파일과는 구분합니다.

원본과 생성물은 같은 `.prettierrc.json`을 사용합니다. `npm run format`으로 저장소 전체를 정리하고 `npm run format:check`로 검사합니다. HTML 조립과 단일 파일 생성 후에도 자동으로 포맷팅하므로 빌드 때문에 출력 형식이 다시 흐트러지지 않습니다.

HTML 조각은 `<!-- include: ui/hud/hud.html -->` 형식으로 포함합니다. 난이도 버튼과 초기 설명은 엔진과 같은 난이도 설정에서 생성합니다. 런타임에 마크업을 다시 조립하지 않으므로 게임 시작 전 화면 구조도 유지됩니다.

스타일 진입점은 `src/style.css`입니다. import 순서가 CSS 적용 순서이므로 바꿀 때 화면을 비교합니다. 단일 HTML 빌드는 로컬 CSS import를 재귀적으로 펼치고 외부 폰트 import는 유지합니다.

단일 HTML용 모듈 조립기는 현재 프로젝트의 **정적 named / namespace import, named export**를 처리합니다. 각 모듈을 별도 함수 범위에 넣어 지역 변수 충돌과 의존 모듈의 중복 실행을 방지합니다. 순환 의존·default export·동적 import는 지원하지 않습니다. 이 구문이 필요해지면 조립기의 범위를 넓히거나 표준 번들러로 전환해야 합니다.

## 테스트와 확인

```bash
npm test
node --test tests/interface/difficulty.test.mjs
```

`npm test`는 먼저 배포 파일을 빌드합니다. 개별 테스트를 직접 실행할 때도 `dist/`가 최신인지 확인합니다. 테스트는 `engine/`, `animation/`, `rendering/`, `interface/`, `build/`에 나뉘어 있고 공통 호스트는 `fixtures/`에서 제공합니다. UI 테스트는 앱을 각각 생성하므로 다른 테스트의 실행 순서에 의존하지 않습니다.

코드 이동·정리 시 점수와 속도뿐 아니라 난수 호출 순서, 물리 연산 순서, Canvas 그리기 순서, DOM 요소와 CSS 순서를 함께 보존합니다. 현재 리팩터링에서는 이전 구현과 24,000번의 엔진 상태 및 346개 장면의 Canvas 명령을 비교했고, 정규화한 HTML 구조와 CSS 규칙도 일치함을 확인했습니다.

DOM·Canvas 모형을 쓰는 자동 테스트 외에 실제 브라우저에서 시작·점프·슬라이드·정지·도움말·게임 오버와 단일 HTML 실행을 확인합니다. 모바일 화면의 CSS 변경은 세로·가로 화면을 모두 확인합니다.
