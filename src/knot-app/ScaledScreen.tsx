import type { ScreenId } from "@/data/types";
import KnotScreen, { type KnotAction } from "./KnotScreen";

export const SCREEN_W = 1440;
export const SCREEN_H = 1024;

interface Props {
  screen: ScreenId;
  width: number;
  variant?: "draft" | "develop";
  onAction?: (a: KnotAction) => void;
  /** 썸네일은 누를 수 없게 한다 */
  inert?: boolean;
  dimmed?: boolean;
}

/** 1440x1024 앱 화면을 주어진 폭에 맞춰 줄여 보여 준다 */
export default function ScaledScreen({ screen, width, variant, onAction, inert, dimmed }: Props) {
  const scale = width / SCREEN_W;
  return (
    <div
      data-screen={screen}
      style={{ width, height: SCREEN_H * scale, overflow: "hidden", position: "relative", borderRadius: 4, background: "#faf9f7", flexShrink: 0 }}
    >
      <div style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})`, transformOrigin: "0 0", pointerEvents: inert ? "none" : undefined }}>
        <KnotScreen screen={screen} variant={variant} onAction={onAction} />
      </div>
      {dimmed && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)" }} />}
    </div>
  );
}
