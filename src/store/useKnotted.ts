import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DECISIONS, PROPOSAL, REQUIREMENTS, REVIEW_COMMENTS, SEED_RULES, SEED_THREADS } from "@/data/logout";
import type { ChatMessage, ProposalStatus, Role, Rule, ScreenId, Thread } from "@/data/types";

export interface ReviewComment {
  id: string;
  author: string;
  target: string;
  when: string;
  text: string;
}

interface KnottedState {
  role: Role;
  status: ProposalStatus;
  /** 0 시작 전, 1 첫 질문, 2 둘째 질문, 3 제안서로 묶음 */
  planStep: 0 | 1 | 2 | 3;
  planMessages: ChatMessage[];
  decisions: string[];
  reviewComments: ReviewComment[];
  threads: Thread[];
  textOverrides: Record<string, string>;
  styleOverrides: Record<string, Record<string, string>>;
  rules: Rule[];
  refScreens: ScreenId[];
  reflectDone: number;
  savedFlows: string[][];

  setRole: (role: Role) => void;
  setStatus: (status: ProposalStatus) => void;
  resetDemo: () => void;
  startNewProposal: () => void;
  pushPlanMessage: (m: ChatMessage) => void;
  updatePlanMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setPlanStep: (step: KnottedState["planStep"]) => void;
  addDecision: (text: string) => void;
  addReviewComment: (text: string) => void;
  addThread: (t: Thread) => void;
  updateThread: (id: string, patch: Partial<Thread>) => void;
  setTextOverride: (key: string, value: string | null) => void;
  setStyleOverride: (name: string, style: Record<string, string> | null) => void;
  saveRule: (rule: Rule, message: string) => void;
  deleteRule: (id: string) => void;
  toggleRefScreen: (id: ScreenId) => void;
  setReflectDone: (n: number) => void;
  saveFlow: (flow: string[]) => void;
}

export const FULL_TRANSCRIPT: ChatMessage[] = [
  { id: "m1", from: "user", text: "로그아웃 기능 구현해 줘" },
  {
    id: "m2",
    from: "agent",
    text: "지금 기능 요구사항에는 로그아웃이 없어요. 상단바 프로필 메뉴에 로그아웃을 두는 것으로 시작할게요. 두 가지만 정해 주세요.",
    question: {
      id: "q1",
      title: "로그아웃하고 나면 어디로 갈까요?",
      options: [{ label: "로그인 화면", recommended: true }, { label: "랜딩 페이지" }],
      answered: "로그인 화면",
    },
  },
  {
    id: "m3",
    from: "agent",
    text: "로그아웃 뒤 갈 곳을 반영해서 요구사항 5개와 화면 3개를 만들었어요. 녹음 중일 때를 정하면 나머지 화면을 이어서 만들게요.",
    question: {
      id: "q2",
      title: "녹음 중에 로그아웃을 누르면요?",
      options: [{ label: "녹음을 끝낼지 먼저 묻기", recommended: true }, { label: "바로 로그아웃" }],
      answered: "녹음을 끝낼지 먼저 묻기",
    },
  },
  {
    id: "m4",
    from: "agent",
    text: "정한 내용으로 요구사항 6개와 화면 6개를 만들고 제안서로 묶었어요. 바뀌는 노션 문서는 3개이고, 백엔드 작업은 없어요. 고칠 게 없으면 검토를 요청해 주세요.",
    action: { label: "제안서 보기", to: `/p/${PROPOSAL.id}` },
  },
];

const initial = () => ({
  role: "confirmer" as Role,
  status: "검토 요청" as ProposalStatus,
  planStep: 3 as const,
  planMessages: FULL_TRANSCRIPT,
  decisions: DECISIONS,
  reviewComments: REVIEW_COMMENTS,
  threads: SEED_THREADS,
  textOverrides: {},
  styleOverrides: {},
  rules: SEED_RULES,
  refScreens: ["home"] as ScreenId[],
  reflectDone: 0,
  savedFlows: [],
});

export const useKnotted = create<KnottedState>()(
  persist(
    (set) => ({
      ...initial(),
      setRole: (role) => set({ role }),
      setStatus: (status) => set({ status }),
      resetDemo: () => set(initial()),
      startNewProposal: () =>
        set({
          role: "proposer",
          status: "작성 중",
          planStep: 0,
          planMessages: [],
          decisions: [],
          reviewComments: [],
          threads: [],
          textOverrides: {},
          styleOverrides: {},
          reflectDone: 0,
        }),
      pushPlanMessage: (m) => set((s) => ({ planMessages: [...s.planMessages, m] })),
      updatePlanMessage: (id, patch) =>
        set((s) => ({ planMessages: s.planMessages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      setPlanStep: (planStep) => set({ planStep }),
      addDecision: (text) => set((s) => ({ decisions: [...s.decisions, text] })),
      addReviewComment: (text) =>
        set((s) => ({
          reviewComments: [
            ...s.reviewComments,
            { id: `rc${Date.now()}`, author: s.role === "confirmer" ? PROPOSAL.confirmer : PROPOSAL.proposer, target: "", when: "방금", text },
          ],
        })),
      addThread: (t) => set((s) => ({ threads: [t, ...s.threads] })),
      updateThread: (id, patch) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      setTextOverride: (key, value) =>
        set((s) => {
          const next = { ...s.textOverrides };
          if (value === null) delete next[key];
          else next[key] = value;
          return { textOverrides: next };
        }),
      setStyleOverride: (name, style) =>
        set((s) => {
          const next = { ...s.styleOverrides };
          if (style === null) delete next[name];
          else next[name] = style;
          return { styleOverrides: next };
        }),
      saveRule: (rule, message) =>
        set((s) => {
          const exists = s.rules.some((r) => r.id === rule.id);
          const author = s.role === "confirmer" ? PROPOSAL.confirmer : PROPOSAL.proposer;
          const updated: Rule = {
            ...rule,
            author,
            updatedAt: Date.now(),
            history: [{ author, at: Date.now(), message }, ...rule.history],
          };
          return { rules: exists ? s.rules.map((r) => (r.id === rule.id ? updated : r)) : [...s.rules, updated] };
        }),
      deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      toggleRefScreen: (id) =>
        set((s) => ({ refScreens: s.refScreens.includes(id) ? s.refScreens.filter((x) => x !== id) : [...s.refScreens, id] })),
      setReflectDone: (reflectDone) => set({ reflectDone }),
      saveFlow: (flow) => set((s) => ({ savedFlows: [...s.savedFlows, flow] })),
    }),
    { name: "knotted-demo", version: 1 },
  ),
);

export function decidedRequirements(planStep: number) {
  if (planStep >= 3) return REQUIREMENTS;
  if (planStep >= 2) return REQUIREMENTS.filter((r) => r.id !== "AUTH-R22");
  if (planStep >= 1) return REQUIREMENTS.filter((r) => r.id === "AUTH-R17");
  return [];
}

export function currentUser(role: Role) {
  return role === "confirmer" ? PROPOSAL.confirmer : PROPOSAL.proposer;
}
