import { PROPOSAL } from "@/data/logout";
import type { ScreenId } from "@/data/types";

/** 요소를 가리키는 링크. 에이전트는 이 링크로 브랜치, 화면, 요소를 찾는다 */
export function elementLink(screen: ScreenId, element: string): string {
  return `${window.location.origin}/p/${PROPOSAL.id}/canvas?screen=${screen}&el=${element}`;
}

export function parseElementLink(text: string): { screen: ScreenId; element: string; href: string } | null {
  const m = text.match(/https?:\/\/[^\s]+\/p\/[\w-]+\/canvas\?screen=([\w-]+)&el=(\w+)/);
  if (!m) return null;
  return { screen: m[1] as ScreenId, element: m[2], href: m[0] };
}
