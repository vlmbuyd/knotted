import { Check, ExternalLink, FileText, Sparkles } from "lucide-react";
import { SCREENS, SCREEN_NAME } from "@/data/logout";
import { editorHref, REGISTRY } from "@/data/registry";
import { toast } from "@/lib/toast";
import { useUi } from "@/store/useUi";

/** 고른 요소의 디자인 시스템 이름, 코드 컴포넌트, 파일 위치, props */
export default function InspectPanel() {
  const sel = useUi((s) => s.selectedElement);
  const setRightTab = useUi((s) => s.setRightTab);
  if (!sel) {
    return <div className="k-faint" style={{ padding: 16, fontSize: 13 }}>캔버스에서 요소를 누르면 여기에 컴포넌트 정보가 보여요.</div>;
  }
  const meta = REGISTRY[sel.name];
  if (!meta) return null;
  const usedIn = sel.name === "ProfileMenu" ? SCREENS.filter((x) => x.page === "home").map((x) => x.name) : [SCREEN_NAME[sel.screen]];
  return (
    <div className="inspect" style={{ overflow: "auto" }}>
      <div>
        <h3>{meta.component}</h3>
        <div style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
          <span className="k-faint">디자인 시스템 {meta.ds}</span>
          {meta.inDesignSystem && <span style={{ color: "var(--success)", display: "inline-flex", gap: 3, alignItems: "center" }}><Check size={12} />이름 같음</span>}
        </div>
      </div>
      <div>
        <div className="k-label" style={{ marginBottom: 6 }}>파일</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}><FileText size={14} className="k-muted" /><span className="mono">{meta.file.replace(/^modules\/features\//, "")}</span></div>
      </div>
      <div>
        <div className="k-label" style={{ marginBottom: 6 }}>props</div>
        {Object.entries(meta.props).map(([k, v]) => <div key={k} className="kv"><span>{k}</span><b>{v}</b></div>)}
        {Object.keys(meta.props).length === 0 && <div className="k-faint" style={{ fontSize: 13 }}>없음</div>}
      </div>
      <div>
        <div className="k-label" style={{ marginBottom: 6 }}>이 컴포넌트를 쓰는 화면</div>
        {usedIn.map((n) => <div key={n} style={{ fontSize: 13 }}>{n}</div>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="k-btn k-btn--sm" onClick={() => { const h = editorHref(sel.name); if (h) window.location.href = h; else toast(".env.local에 VITE_KNOT_REPO를 적으면 VS Code로 열려요"); }}><ExternalLink size={13} />에디터에서 열기</button>
        <button className="k-btn k-btn--sm" onClick={() => setRightTab("ai")}><Sparkles size={13} />AI에게 요청</button>
      </div>
    </div>
  );
}
