/**
 * 시안 화면의 요소마다 디자인 시스템 이름, 코드 컴포넌트, 파일 위치, 넘긴 값을 적어 둔 표.
 * 실제 Knotted는 빌드할 때 이 정보를 붙이고, 지금 프로토타입은 손으로 적어 둔다.
 */
export interface ElementMeta {
  /** 디자인 시스템 이름(한글) */
  ds: string;
  /** 코드 컴포넌트 이름 */
  component: string;
  /** frontend/src 기준 파일 위치 */
  file: string;
  line: number;
  props: Record<string, string>;
  /** 디자인 시스템에 있는 컴포넌트인지 */
  inDesignSystem: boolean;
  /** 이 제안에서 새로 생겼는지 */
  isNew?: boolean;
}

export const REGISTRY: Record<string, ElementMeta> = {
  WorkspaceGnb: {
    ds: "상단바",
    component: "WorkspaceGnb",
    file: "modules/features/workspace/WorkspaceGnb/index.tsx",
    line: 24,
    props: { workspaceName: '"팀 노트"', current: '"home"' },
    inDesignSystem: true,
  },
  MemberProfileAvatar: {
    ds: "프로필 사진",
    component: "MemberProfileAvatar",
    file: "modules/features/member/MemberProfileAvatar/index.tsx",
    line: 31,
    props: { nickname: '"유월"', isMenuOpen: "true" },
    inDesignSystem: true,
  },
  ProfileMenu: {
    ds: "프로필 메뉴",
    component: "ProfileMenu",
    file: "modules/features/member/MemberProfileAvatar/ui/ProfileMenu.tsx",
    line: 18,
    props: { isLoggingOut: "false", onLogoutSelect: "() => void" },
    inDesignSystem: true,
    isNew: true,
  },
  MemberGreeting: {
    ds: "인사말",
    component: "MemberGreeting",
    file: "modules/features/member/MemberGreeting/index.tsx",
    line: 12,
    props: { nickname: '"유월"' },
    inDesignSystem: true,
  },
  RecordingHistory: {
    ds: "녹음 기록 카드",
    component: "RecordingHistory",
    file: "modules/features/recording/RecordingHistory/index.tsx",
    line: 40,
    props: { items: "RecordingSummary[]" },
    inDesignSystem: true,
  },
  RecordingHistoryItem: {
    ds: "녹음 기록 행",
    component: "RecordingHistoryItem",
    file: "modules/features/recording/RecordingHistory/ui/RecordingHistoryItem.tsx",
    line: 22,
    props: { title: "string", status: '"done" | "failed" | "recording"' },
    inDesignSystem: true,
  },
  PendingDocuments: {
    ds: "확인이 필요한 문서 카드",
    component: "PendingDocuments",
    file: "modules/features/document/PendingDocuments/index.tsx",
    line: 28,
    props: { documents: "DocumentSummary[]" },
    inDesignSystem: true,
  },
  InviteCard: {
    ds: "팀원 초대 카드",
    component: "WorkspaceInvite",
    file: "modules/features/workspace/WorkspaceInvite/index.tsx",
    line: 19,
    props: { inviteUrl: '"knot.app/i/X35D3S"' },
    inDesignSystem: true,
  },
  RecordDock: {
    ds: "녹음 독",
    component: "RecordDock",
    file: "modules/features/recording/RecordDock/index.tsx",
    line: 35,
    props: { isRecording: "false" },
    inDesignSystem: true,
  },
  Toast: {
    ds: "토스트",
    component: "Toast",
    file: "shared/components/primitives/ui/Toast/index.tsx",
    line: 16,
    props: { variant: '"error"', message: '"로그아웃하지 못했어요. 다시 시도해 주세요."' },
    inDesignSystem: true,
  },
  ConfirmDialog: {
    ds: "확인 창",
    component: "ConfirmDialog",
    file: "shared/components/composites/ConfirmDialog/index.tsx",
    line: 27,
    props: { title: '"녹음을 끝내고 로그아웃할까요?"', confirmLabel: '"끝내고 로그아웃"' },
    inDesignSystem: true,
  },
  Button: {
    ds: "버튼",
    component: "Button",
    file: "shared/components/primitives/ui/Button/index.tsx",
    line: 14,
    props: { variant: '"outline"', size: '"sm"' },
    inDesignSystem: true,
  },
  LoginPage: {
    ds: "로그인 화면",
    component: "LoginPage",
    file: "pages/LoginPage/index.tsx",
    line: 20,
    props: {},
    inDesignSystem: true,
  },
};

export function snippetOf(name: string): string {
  const meta = REGISTRY[name];
  if (!meta) return "";
  const entries = Object.entries(meta.props);
  if (entries.length === 0) return `<${meta.component} />`;
  const lines = entries.map(([k, v]) => {
    const value = v.startsWith('"') ? v : `{${v === "() => void" ? `handle${k.replace(/^on/, "")}` : v}}`;
    return `  ${k}=${value}`;
  });
  return `<${meta.component}\n${lines.join("\n")}\n/>`;
}

export function editorHref(name: string): string | null {
  const meta = REGISTRY[name];
  const repo = import.meta.env.VITE_KNOT_REPO as string | undefined;
  if (!meta || !repo) return null;
  return `vscode://file/${repo}/frontend/src/${meta.file}:${meta.line}`;
}
