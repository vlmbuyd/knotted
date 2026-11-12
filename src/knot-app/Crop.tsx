import type { ScreenId } from "@/data/types";
import KnotScreen from "./KnotScreen";

/** 앱 화면의 한 부분만 잘라 보여 준다. 정책 카드에 쓴다 */
export default function Crop({ screen, region, width, height }: { screen: ScreenId; region: { x: number; y: number; w: number }; width: number; height: number }) {
  const k = width / region.w;
  return (
    <div style={{ width, height, overflow: "hidden", borderRadius: 6, position: "relative", background: "#faf9f7" }}>
      <div style={{ position: "absolute", left: -region.x * k, top: -region.y * k, width: 1440, height: 1024, transform: `scale(${k})`, transformOrigin: "0 0", pointerEvents: "none" }}>
        <KnotScreen screen={screen} />
      </div>
    </div>
  );
}
