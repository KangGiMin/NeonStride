# 공개 배포와 검색 등록

공개 게임 주소: **https://neon-stride-run-kr.famousessay4.chatgpt.site/**

이 게임은 Sites의 공개 정적 호스팅에서 제공됩니다. 개발 PC나 로컬 서버가 꺼져 있어도 다른 사람이 주소를 열어 플레이할 수 있습니다. 방문자의 로그인은 필요하지 않습니다.

## 검색용 설정

빌드에서 다음 항목을 생성합니다.

- 영문·한글 게임 이름이 들어간 제목과 설명
- 검색 수집 허용 메타태그와 `robots.txt`
- 공개 주소를 가리키는 canonical URL과 `sitemap.xml`
- 링크 공유용 Open Graph·Twitter 메타데이터
- 실제 게임 정보를 담은 VideoGame·WebApplication JSON-LD

공개 주소와 메타데이터의 원본은 `src/config/site.json`입니다. 주소를 변경하면 이 파일을 갱신하고 다시 빌드·배포합니다.

## 아직 필요한 소유자 작업

검색엔진의 소유확인 코드는 아직 발급되지 않았으며, 계정을 통한 사이트 등록·색인 요청은 완료되지 않았습니다. 공개 배포와 검색용 파일 준비는 검색 등록 완료와 구분해야 합니다. 검색 반영 시점과 최상단 순위는 보장할 수 없습니다.

### Google

1. [Google Search Console](https://search.google.com/search-console/)에 본인 Google 계정으로 로그인합니다.
2. **URL 접두어** 속성에 `https://neon-stride-run-kr.famousessay4.chatgpt.site/`를 추가합니다.
3. **HTML 태그** 소유확인 방법을 선택합니다. 공용 호스팅의 상위 도메인 DNS를 수정하는 방식은 사용하지 않습니다.
4. 발급된 `<meta name="google-site-verification" content="…">`의 content 값을 `src/config/site.json`의 `verification.google`에 입력합니다.
5. 빌드·재배포한 뒤 Search Console에서 소유확인을 완료합니다.
6. 사이트맵 메뉴에서 `sitemap.xml`을 제출하고 홈페이지 URL 검사에서 색인 생성을 요청합니다.

공식 안내: [소유권 확인](https://support.google.com/webmasters/answer/9008080?hl=ko), [재크롤링 요청](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=ko).

### 네이버

1. [네이버 서치어드바이저](https://searchadvisor.naver.com/)에 본인 네이버 계정으로 로그인합니다.
2. 웹마스터 도구에 위 공개 주소를 등록하고 **HTML 태그** 소유확인을 선택합니다.
3. 발급된 `<meta name="naver-site-verification" content="…">`의 content 값을 `verification.naver`에 입력합니다.
4. 빌드·재배포한 뒤 소유확인을 완료합니다.
5. 사이트맵 제출 및 홈페이지 수집 요청을 진행합니다.

공식 안내: [사이트 등록 및 소유확인](https://searchadvisor.naver.com/guide/faq-start-register).

제출할 사이트맵 주소는 **https://neon-stride-run-kr.famousessay4.chatgpt.site/sitemap.xml**입니다. 소유확인 코드는 빈 값이면 태그를 생성하지 않으며, 예시 코드를 실제 배포에 넣지 않습니다.

## 업데이트 배포

`npm run build:standalone`은 로컬 배포 파일을 갱신하며, 이것만으로 온라인 버전이 바뀌지는 않습니다. Sites에서 같은 프로젝트 ID를 유지하고 소스 동기화·버전 저장·공개 배포를 완료해야 온라인 게임이 갱신됩니다. `.openai/hosting.json`의 프로젝트 ID는 유지합니다.

자체 도메인이 필요하면 소유한 도메인을 이 Sites 프로젝트에 연결할 수 있습니다. 새 도메인의 구매나 별도 유료 서비스 결제는 이번 배포에 포함하지 않았습니다.
