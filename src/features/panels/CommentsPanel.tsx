import { ChevronLeft, FileText, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { SCREEN_NAME } from "@/data/logout";
import { REGISTRY } from "@/data/registry";
import type { Thread } from "@/data/types";
import { revertChange, runRequest } from "@/lib/agent";
import { initialOf } from "@/lib/people";
import { ago } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useKnotted } from "@/store/useKnotted";
import { useUi } from "@/store/useUi";

type Filter = "all" | "comment" | "request";

const STATUS_COLOR: Record<string, string> = {
  "에이전트 기다리는 중": "var(--text-tertiary)",
  "고치는 중": "var(--warning)",
  "고침": "var(--success)",
  "확인함": "var(--text-secondary)",
  "되돌림": "var(--text-tertiary)",
};

export default function CommentsPanel() {
  const threads = useKnotted((s) => s.threads);
  const active = useUi((s) => s.activeThread);
  const setActive = useUi((s) => s.setActiveThread);
  const [filter, setFilter] = useState<Filter>("all");

  // 새로고침해도 고치는 중이던 요청은 이어서 끝낸다
  useEffect(() => {
    threads.filter((t) => t.status === "고치는 중").forEach((t) => runRequest(t.id));
  }, [threads]);

  const thread = threads.find((t) => t.id === active);
  if (thread) return <ThreadDetail t={thread} onBack={() => setActive(null)} />;

  const shown = threads.filter((t) => filter === "all" || t.kind === filter);
  const count = (k: Filter) => threads.filter((t) => k === "all" || t.kind === k).length;

  return (
    <div style={{ overflow: "auto", flex: 1, paddingBottom: 16 }}>
      <div className="filter-row">
        {([["all", "전체"], ["comment", "댓글"], ["request", "수정 요청"]] as const).map(([k, label]) => (
          <button key={k} className="k-chip" data-active={filter === k} onClick={() => setFilter(k)}>{label} {count(k)}</button>
        ))}
      </div>
      {shown.length === 0 && <div className="k-faint" style={{ padding: 16, fontSize: 13 }}>아직 없어요. 캔버스에서 요소를 누르거나 C를 눌러 남겨 보세요.</div>}
      {shown.map((t) => (
        <button key={t.id} className="thread" onClick={() => setActive(t.id)}>
          <div className="thread-head">
            {t.kind === "request" ? <Sparkles size={14} /> : <MessageCircle size={14} className="k-muted" />}
            <span style={{ color: t.kind === "request" ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: t.kind === "request" ? 600 : 400 }}>{t.kind === "request" ? "수정 요청" : "댓글"}</span>
            <span className="k-faint" style={{ marginLeft: "auto", fontWeight: 400, fontSize: 12 }}>{SCREEN_NAME[t.screen]}</span>
          </div>
          <div>{t.text}</div>
          <div className="thread-foot">
            <span className="avatar-s">{initialOf(t.author)}</span>
            {t.author}
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              {t.kind === "request" ? <><span className="k-dot" style={{ color: STATUS_COLOR[t.status ?? ""] }} />{t.status}</> : t.replies ? `답글 ${t.replies}` : "답글 없음"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function ThreadDetail({ t, onBack }: { t: Thread; onBack: () => void }) {
  const updateThread = useKnotted((s) => s.updateThread);
  const previewBefore = useUi((s) => s.previewBefore);
  const setPreviewBefore = useUi((s) => s.setPreviewBefore);
  const target = t.change?.styleTarget ?? t.change?.textKey ?? null;
  const meta = REGISTRY[t.elements[0] ?? ""];

  useEffect(() => () => setPreviewBefore(null), [setPreviewBefore]);

  return (
    <div style={{ overflow: "auto", flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <button className="k-faint" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }} onClick={onBack}><ChevronLeft size={14} />목록</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
        {t.kind === "request" ? <Sparkles size={15} /> : <MessageCircle size={15} />}
        {t.kind === "request" ? "수정 요청" : "댓글"}
        {t.status && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 400, display: "flex", alignItems: "center", gap: 6 }}><span className="k-dot" style={{ color: STATUS_COLOR[t.status] }} />{t.status}</span>}
      </div>
      <div className="k-faint" style={{ fontSize: 12 }}>{SCREEN_NAME[t.screen]}{meta ? `, ${meta.component}` : ""}</div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><span className="avatar-s">{initialOf(t.author)}</span><b>{t.author}</b><span className="k-faint">{ago(t.createdAt)}</span></div>
        <div style={{ marginTop: 6 }}>{t.text}</div>
      </div>
      {t.kind === "request" && t.status === "에이전트 기다리는 중" && (
        <div className="k-muted" style={{ fontSize: 13 }}>제안한 팀원의 에이전트가 켜지면 이 요청을 가져가요.</div>
      )}
      {t.kind === "request" && t.status === "고치는 중" && <div className="k-muted" style={{ fontSize: 13 }}>Claude Code가 고치고 있어요.</div>}
      {t.change && (
        <>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><span className="avatar-s"><Sparkles size={11} /></span><b>Claude Code</b><span className="k-faint">방금</span></div>
            <div className="k-muted" style={{ marginTop: 6, color: "#cfcfd2" }}>{t.change.summary}</div>
          </div>
          <div className="diff">
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13 }}><FileText size={14} />{t.change.file}<span className="k-faint" style={{ marginLeft: "auto" }}>+1 −1</span></div>
            <div className="minus">− {t.change.before}</div>
            <div className="plus">+ {t.change.after}</div>
          </div>
          {target && (t.status === "고침" || t.status === "확인함") && (
            <div className="k-segment" style={{ alignSelf: "flex-start" }}>
              <button data-active={previewBefore === target} onClick={() => setPreviewBefore(target)}>바꾸기 전</button>
              <button data-active={previewBefore !== target} onClick={() => setPreviewBefore(null)}>바꾼 뒤</button>
            </div>
          )}
          {t.status === "고침" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="k-btn" onClick={() => { setPreviewBefore(null); revertChange(t); toast("되돌렸어요"); }}>되돌리기</button>
              <button className="k-btn k-btn--primary" onClick={() => { setPreviewBefore(null); updateThread(t.id, { status: "확인함" }); toast("확인했어요"); }}>확인</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
