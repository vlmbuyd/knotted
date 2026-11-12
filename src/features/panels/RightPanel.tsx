import { BookOpen, MessageCircle, PanelRightClose, ScanSearch, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { type RightTab, useUi } from "@/store/useUi";
import { AgentSelect, ChatInput } from "./ChatPanel";
import ChatPanel from "./ChatPanel";
import CommentsPanel from "./CommentsPanel";
import InspectPanel from "./InspectPanel";
import RulesPanel from "./RulesPanel";
import "./panels.css";

const TABS: { id: RightTab; label: string; Icon: typeof Sparkles }[] = [
  { id: "ai", label: "대화", Icon: Sparkles },
  { id: "comments", label: "댓글", Icon: MessageCircle },
  { id: "inspect", label: "살펴보기", Icon: ScanSearch },
  { id: "rules", label: "규칙", Icon: BookOpen },
];

/** 캔버스 오른쪽 패널. 탭은 아이콘만 보이고, 켜진 탭만 이름이 함께 보인다 */
export default function RightPanel({ inspectContent, chatPlaceholder }: { inspectContent?: ReactNode; chatPlaceholder?: string }) {
  const tab = useUi((s) => s.rightTab);
  const setTab = useUi((s) => s.setRightTab);
  const setOpen = useUi((s) => s.setRightOpen);

  return (
    <section className="k-panel" style={{ width: 340, flexShrink: 0 }}>
      <div className="ptabs">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className="ptab" data-active={tab === id} onClick={() => setTab(id)} title={label}>
            <Icon size={15} />
            {tab === id && label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        {tab === "ai" && <AgentSelect />}
        <button className="icon-btn" onClick={() => setOpen(false)} title="패널 접기"><PanelRightClose size={16} /></button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === "ai" && (chatPlaceholder ? <><div className="chat-body" /><ChatInput placeholder={chatPlaceholder} /></> : <ChatPanel embedded />)}
        {tab === "comments" && <CommentsPanel />}
        {tab === "inspect" && (inspectContent ?? <InspectPanel />)}
        {tab === "rules" && <RulesPanel />}
      </div>
    </section>
  );
}
