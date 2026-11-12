import type { DraftScreen, Requirement, Rule, Thread } from "./types";

export const PROPOSAL = {
  id: "logout",
  title: "상단바 프로필 메뉴에서 로그아웃하기",
  shortTitle: "로그아웃 제안",
  summary: "프로필 사진을 누르면 메뉴가 열리고, 로그아웃을 누르면 이 브라우저의 로그인이 끝나요. 녹음 중이면 먼저 물어봐요.",
  kind: "추가",
  area: "시작하기",
  branch: "proposal/logout",
  proposer: "팀원 A",
  confirmer: "유월",
  createdLabel: "10분 전",
} as const;

export const REQUIREMENTS: Requirement[] = [
  {
    id: "AUTH-R17",
    short: "R17",
    name: "프로필 메뉴",
    draftName: "프로필 메뉴에 로그아웃",
    sentence: "상단바 오른쪽 끝의 프로필 사진을 누르면 메뉴가 열리고, 메뉴에 로그아웃이 있다.",
    kind: "추가",
    screens: ["profile-menu-open"],
  },
  {
    id: "AUTH-R18",
    short: "R18",
    name: "로그아웃",
    draftName: "누르면 로그인 화면으로",
    sentence: "누르면 확인 없이 이 브라우저의 로그인을 끝내고 로그인 화면으로 간다.",
    kind: "추가",
    screens: [],
    noScreenNote: "흐름에 반영: 로그아웃 뒤 로그인 화면",
  },
  {
    id: "AUTH-R19",
    short: "R19",
    name: "처리 중과 실패",
    draftName: "처리 중과 실패",
    sentence: "요청하는 동안 로그아웃은 처리 중이 되고, 실패하면 화면을 두고 오류 토스트를 띄운다.",
    kind: "추가",
    screens: ["logging-out", "logout-failed"],
  },
  {
    id: "AUTH-R20",
    short: "R20",
    name: "앞 계정의 기록 지우기",
    draftName: "앞 계정의 기록 지우기",
    sentence: "로그아웃하면 이 탭에 남은 피드백 초안, 마지막 대화, 돌아갈 주소를 지운다.",
    kind: "추가",
    screens: [],
    noScreenNote: "화면 없이 동작만 바뀌어요",
  },
  {
    id: "AUTH-R21",
    short: "R21",
    name: "로그인 만료와 구분",
    draftName: "로그인 만료 안내와 구분",
    sentence: "로그아웃해서 로그인 화면에 오면 로그인 만료 토스트를 띄우지 않는다.",
    kind: "추가",
    screens: [],
    noScreenNote: "화면 없이 동작만 바뀌어요",
  },
  {
    id: "AUTH-R22",
    short: "R22",
    name: "녹음 중 로그아웃",
    draftName: "녹음 중이면 끝낼지 먼저 묻기",
    sentence: "녹음 중이면 녹음을 끝내고 로그아웃할지 먼저 묻는다.",
    kind: "추가",
    screens: ["recording-confirm", "finish-logging-out", "recording-elsewhere"],
  },
];

export const SCREENS: DraftScreen[] = [
  { id: "profile-menu-open", name: "프로필 메뉴 열림", page: "home", requirement: "AUTH-R17" },
  { id: "logging-out", name: "로그아웃 처리 중", page: "home", requirement: "AUTH-R19" },
  { id: "logout-failed", name: "로그아웃 실패", page: "home", requirement: "AUTH-R19" },
  { id: "recording-confirm", name: "녹음 중 확인", page: "recording", requirement: "AUTH-R22" },
  { id: "finish-logging-out", name: "끝내고 로그아웃 처리 중", page: "recording", requirement: "AUTH-R22" },
  { id: "recording-elsewhere", name: "다른 곳 녹음 알림", page: "recording", requirement: "AUTH-R22" },
];

export const SCREEN_NAME: Record<string, string> = {
  home: "홈",
  login: "로그인 화면",
  "home-recording": "홈 (녹음 중)",
  "menu-recording": "프로필 메뉴 열림 (녹음 중)",
  ...Object.fromEntries(SCREENS.map((s) => [s.id, s.name])),
};

export const PAGES = [
  { id: "home" as const, name: "홈", path: "/" },
  { id: "recording" as const, name: "녹음 중", path: "/recording" },
];

export const DECISIONS = ["로그아웃 뒤에는 로그인 화면으로 가요", "녹음 중이면 끝낼지 먼저 물어요"];

export const REFERENCES = [
  { group: "바뀌는 노션 문서", items: [
    { label: "기능 요구사항", detail: "로그인, 온보딩 (v2)에 AUTH-R17~R22 추가" },
    { label: "관련 문서 링크", detail: "새 문서 '로그아웃' 추가, 로그인 문서에 링크" },
    { label: "QA 시트", detail: "시나리오 11개 추가" },
  ] },
  { group: "바뀌는 디자인", items: [
    { label: "디자인 시스템", detail: "ProfileMenu 추가, Toast에 로그아웃 실패 변형 추가" },
    { label: "디자인 정책", detail: "시작하기 영역에 프로필 메뉴, 로그아웃 실패 카드 추가" },
    { label: "유저 플로우", detail: "로그인과 로그아웃 흐름에 화면 5개 추가" },
  ] },
];

export const REFLECT_STEPS = [
  "기능 요구사항에 새 문서 로그아웃 추가",
  "로그인, 온보딩 (v2)에 링크 추가",
  "QA 시트에 시나리오 11개 추가",
  "디자인 시스템, 정책, 플로우 반영",
  "이슈 만들기",
  "상태를 반영 완료로 바꾸기",
];

export const SEED_THREADS: Thread[] = [
  {
    id: "t1",
    kind: "request",
    screen: "profile-menu-open",
    anchor: { x: 1176, y: 72, w: 240, h: 52 },
    elements: ["ProfileMenu"],
    text: "로그아웃 글자를 조금 더 연하게 해 줘.",
    author: "유월",
    createdAt: Date.now() - 1000 * 60 * 3,
    status: "고치는 중",
    replies: 0,
  },
  {
    id: "t2",
    kind: "comment",
    screen: "logout-failed",
    anchor: { x: 720, y: 862 },
    elements: ["Toast"],
    text: "토스트 문구가 정책 문장과 같은지 봐 주세요.",
    author: "팀원 B",
    createdAt: Date.now() - 1000 * 60 * 20,
    replies: 1,
  },
  {
    id: "t3",
    kind: "request",
    screen: "recording-confirm",
    anchor: { x: 720, y: 563 },
    elements: ["ConfirmDialog"],
    text: "버튼 순서를 취소, 끝내고 로그아웃 순서로 바꿔 줘.",
    author: "팀원 A",
    createdAt: Date.now() - 1000 * 60 * 40,
    status: "에이전트 기다리는 중",
    replies: 0,
  },
  {
    id: "t4",
    kind: "comment",
    screen: "finish-logging-out",
    anchor: { x: 1296, y: 98 },
    elements: ["ProfileMenu"],
    text: "이 상태는 1초 안에 끝나서 거의 안 보일 수 있어요.",
    author: "유월",
    createdAt: Date.now() - 1000 * 60 * 60,
    replies: 0,
  },
];

export const REVIEW_COMMENTS = [
  { id: "rc1", author: "유월", target: "AUTH-R21에", when: "5분 전", text: "AUTH-R21도 화면으로 보고 싶어요. 로그인 화면에 만료 토스트가 안 뜨는 상태를 하나 넣어 주세요." },
  { id: "rc2", author: "팀원 A", target: "", when: "방금", text: "넣었어요. 화면이 7개가 됐어요." },
];

const DESIGN_RULES_BODY = `# Knot 디자인 규칙

출처: frontend theme.ts, GlobalStyle.tsx, 실제 컴포넌트(WorkspaceGnb, Toast, ConfirmDialog)

## 토큰
theme 토큰만 쓴다. 토큰 밖의 색과 글자 크기는 쓰지 않는다.
- 글꼴: Pretendard
- 글자: title 40px, heading02 26px/600, heading03 20px/600, body01 16px/400, caption02 14px/400
- 그림자: shadow02, shadow03

## 레이아웃
- 화면 배경은 neutral-50, 카드와 팝오버는 neutral-0에 1px neutral-200 테두리
- 상단바: 높이 44px, 좌우 여백 24px(모바일 16px)
- 토스트: 화면 아래 가운데, radius 16px, 흰 글자 label01
- 확인 창: 폭 최대 520px, 버튼 두 개를 가로로(취소, 확인)`;

const day = 1000 * 60 * 60 * 24;

export const SEED_RULES: Rule[] = [
  {
    id: "knot-design-rules",
    title: "Knot 디자인 규칙",
    summary: "토큰, 글자, 그림자, 레이아웃",
    file: ".knotted/rules/knot-design-rules.md",
    body: DESIGN_RULES_BODY,
    author: "유월",
    updatedAt: Date.now() - 3 * day,
    history: [
      { author: "유월", at: Date.now() - 3 * day, message: "레이아웃에 확인 창 규칙 추가" },
      { author: "유월", at: Date.now() - 5 * day, message: "Knot 디자인 규칙 처음 작성" },
    ],
  },
  {
    id: "toast",
    title: "토스트",
    summary: "위치, 색, 사라지는 시간",
    file: ".knotted/rules/toast.md",
    body: `# 토스트

- 화면 아래 가운데, 녹음 독 바로 위에 띄운다.
- 성공은 accent-700, 애매한 상황은 caution-700, 오류는 warning-700.
- 4초 뒤에 사라지고, 같은 문구는 겹쳐 띄우지 않는다.`,
    author: "도넛",
    updatedAt: Date.now() - 1 * day,
    history: [{ author: "도넛", at: Date.now() - 1 * day, message: "토스트 규칙 추가" }],
  },
  {
    id: "confirm-dialog",
    title: "확인 창",
    summary: "폭, 버튼 순서, 모바일 시트",
    file: ".knotted/rules/confirm-dialog.md",
    body: `# 확인 창

- 폭 최대 520px, 패딩 32px, radius 20px.
- 버튼은 왼쪽 취소, 오른쪽 확인. 확인 버튼에 무엇을 하는지 동사로 쓴다.
- 모바일에서는 아래에 붙는 시트로 연다.`,
    author: "유월",
    updatedAt: Date.now() - 5 * day,
    history: [{ author: "유월", at: Date.now() - 5 * day, message: "확인 창 규칙 추가" }],
  },
];
