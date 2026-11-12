import { REGISTRY } from "@/data/registry";
import type { Thread } from "@/data/types";
import { useKnotted } from "@/store/useKnotted";

const running = new Set<string>();

/**
 * 프로토타입의 에이전트. 실제로는 제안한 팀원의 Claude Code가 수정 요청을 받아 코드를 고친다.
 * 여기서는 몇 가지 요청만 화면에 반영하고, 나머지는 고친 것처럼 기록만 남긴다.
 */
export function runRequest(id: string) {
  if (running.has(id)) return;
  running.add(id);
  const get = () => useKnotted.getState().threads.find((t) => t.id === id);
  const t0 = get();
  if (!t0) return;
  const startFixing = () => {
    useKnotted.getState().updateThread(id, { status: "고치는 중" });
    setTimeout(finish, 2600);
  };
  const finish = () => {
    const t = get();
    running.delete(id);
    if (!t || t.status !== "고치는 중") return;
    useKnotted.getState().updateThread(id, { status: "고침", change: changeFor(t) });
  };
  if (t0.status === "고치는 중") setTimeout(finish, 2600);
  else setTimeout(startFixing, 1200);
}

function changeFor(t: Thread): NonNullable<Thread["change"]> {
  const el = t.elements[0] ?? "ProfileMenu";
  const meta = REGISTRY[el];
  const file = meta ? meta.file.split("/").pop()! : "index.tsx";
  if (/연하게|흐리게|옅게/.test(t.text) && el === "ProfileMenu") {
    useKnotted.getState().setStyleOverride("ProfileMenu", { color: "#8C8880" });
    return {
      file,
      before: "color: theme.neutral[900]",
      after: "color: theme.neutral[500]",
      summary: "ProfileMenu의 글자 색을 neutral[900]에서 neutral[500]으로 바꿨어요. 이 컴포넌트를 쓰는 화면 3개에 함께 반영됐어요.",
      styleTarget: "ProfileMenu",
    };
  }
  if (/진하게|굵게/.test(t.text) && el === "ProfileMenu") {
    useKnotted.getState().setStyleOverride("ProfileMenu", { fontWeight: "700" });
    return { file, before: "font-weight: 400", after: "font-weight: 700", summary: "ProfileMenu의 글자를 굵게 바꿨어요.", styleTarget: "ProfileMenu" };
  }
  return {
    file,
    before: "// 바꾸기 전 코드",
    after: "// 요청대로 고친 코드",
    summary: `${meta?.component ?? el}에 요청을 반영했어요. 프로토타입이라 이 요청은 화면에는 바로 보이지 않아요.`,
  };
}

export function revertChange(t: Thread) {
  if (t.change?.styleTarget) useKnotted.getState().setStyleOverride(t.change.styleTarget, null);
  if (t.change?.textKey) useKnotted.getState().setTextOverride(t.change.textKey, null);
  useKnotted.getState().updateThread(t.id, { status: "되돌림" });
}
