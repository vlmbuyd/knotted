import { create } from "zustand";

export type RightTab = "ai" | "comments" | "inspect" | "rules";
export type Tool = "select" | "hand" | "comment";

interface UiState {
  rightTab: RightTab;
  selectedElement: { screen: string; name: string } | null;
  activeThread: string | null;
  /** 수정 요청을 바꾸기 전 모습으로 잠깐 볼 때, 무시할 고침 대상 */
  previewBefore: string | null;
  leftOpen: boolean;
  rightOpen: boolean;
  setRightTab: (t: RightTab) => void;
  setSelectedElement: (e: UiState["selectedElement"]) => void;
  setActiveThread: (id: string | null) => void;
  setPreviewBefore: (k: string | null) => void;
  setLeftOpen: (v: boolean) => void;
  setRightOpen: (v: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  rightTab: "ai",
  selectedElement: null,
  activeThread: null,
  previewBefore: null,
  leftOpen: true,
  rightOpen: true,
  setRightTab: (rightTab) => set({ rightTab, rightOpen: true }),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  setActiveThread: (activeThread) => set({ activeThread }),
  setPreviewBefore: (previewBefore) => set({ previewBefore }),
  setLeftOpen: (leftOpen) => set({ leftOpen }),
  setRightOpen: (rightOpen) => set({ rightOpen }),
}));
