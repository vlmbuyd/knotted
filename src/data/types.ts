export type ProposalStatus = "작성 중" | "검토 요청" | "보류" | "확정" | "반영 완료" | "반려";

export type Role = "proposer" | "confirmer";

export type ScreenId =
  | "home"
  | "profile-menu-open"
  | "logging-out"
  | "logout-failed"
  | "recording-confirm"
  | "finish-logging-out"
  | "recording-elsewhere"
  | "login"
  | "home-recording"
  | "menu-recording";

export interface DraftScreen {
  id: ScreenId;
  name: string;
  page: "home" | "recording";
  /** 이 화면을 만든 요구사항 */
  requirement: string;
}

export interface Requirement {
  id: string;
  short: string;
  name: string;
  /** 1-1 초안 패널에 쓰는 짧은 이름 */
  draftName: string;
  sentence: string;
  kind: "추가" | "수정" | "삭제";
  screens: ScreenId[];
  /** 화면이 없을 때 무엇이 바뀌는지 */
  noScreenNote?: string;
}

export interface Anchor {
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export type RequestStatus = "에이전트 기다리는 중" | "고치는 중" | "고침" | "확인함" | "되돌림";

export interface Thread {
  id: string;
  kind: "comment" | "request";
  screen: ScreenId;
  anchor: Anchor;
  elements: string[];
  text: string;
  author: string;
  createdAt: number;
  status?: RequestStatus;
  replies: number;
  /** 수정 요청이 고친 내용 */
  change?: { file: string; before: string; after: string; summary: string; textKey?: string; textAfter?: string; styleTarget?: string };
}

export interface Rule {
  id: string;
  title: string;
  summary: string;
  file: string;
  body: string;
  author: string;
  updatedAt: number;
  history: { author: string; at: number; message: string }[];
}

export interface ChatMessage {
  id: string;
  from: "user" | "agent";
  text: string;
  /** 대화 안에 들어가는 질문 카드 */
  question?: { id: string; title: string; options: { label: string; recommended?: boolean }[]; answered?: string };
  attachments?: { label: string; href: string }[];
  action?: { label: string; to: string };
}
