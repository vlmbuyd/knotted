import { ArrowUp, MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { REGISTRY } from "@/data/registry";

export const TEAM = [
  { name: "도넛", color: "#d9735a" },
  { name: "루덴스", color: "#5a80e6" },
  { name: "이스타", color: "#9973d9" },
  { name: "흑곰", color: "#66a699" },
  { name: "유월", color: "#d9a64d" },
];

interface Props {
  kind: "comment" | "request";
  /** 4-1처럼 댓글과 수정 요청을 고를 수 있게 할지 */
  allowToggle?: boolean;
  elements: string[];
  onSubmit: (kind: "comment" | "request", text: string, mentions: string[]) => void;
  width?: number;
}

/** 요소에 남기는 댓글과 AI에게 요청을 쓰는 팝오버 */
export default function Composer({ kind: initialKind, allowToggle, elements, onSubmit, width = 360 }: Props) {
  const [kind, setKind] = useState(initialKind);
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const names = elements.map((e) => REGISTRY[e]?.component ?? e);
  const submit = () => {
    if (!text.trim()) return;
    onSubmit(kind, text.trim(), mentions);
  };
  const accent = kind === "request" && allowToggle;

  return (
    <div
      className="k-pop composer"
      style={{ width, borderColor: accent ? "var(--selection)" : undefined }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {allowToggle && (
        <div className="composer-toggle">
          <button data-active={kind === "comment"} onClick={() => setKind("comment")}><MessageCircle size={14} />댓글</button>
          <button data-active={kind === "request"} onClick={() => setKind("request")}><Sparkles size={14} />수정 요청</button>
        </div>
      )}
      <textarea
        autoFocus
        rows={2}
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          setMentions(TEAM.filter((m) => v.includes(`@${m.name}`)).map((m) => m.name));
        }}
        placeholder={kind === "comment" ? "이 요소에 댓글 남기기. @로 팀원을 부를 수 있어요." : "어떻게 고칠지 적어 주세요. 예: 로그아웃 글자를 조금 더 연하게 해 줘"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
          e.stopPropagation();
        }}
      />
      {allowToggle && names.length > 0 && <div className="composer-scope">선택한 영역 안: {names.join(", ")}</div>}
      {kind === "comment" && (
        <div className="mentions">
          {TEAM.map((m) => (
            <button
              key={m.name}
              className="mention"
              data-on={mentions.includes(m.name)}
              onClick={() => {
                if (!text.includes(`@${m.name}`)) setText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}@${m.name} `);
                setMentions((xs) => (xs.includes(m.name) ? xs : [...xs, m.name]));
              }}
            >
              <span className="mention-av" style={{ background: m.color }}>{m.name[0]}</span>@{m.name}
            </button>
          ))}
        </div>
      )}
      <div className="composer-foot">
        {kind === "request" ? (
          <span className="k-muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} />제안한 팀원의 Claude Code가 이어서 고쳐요</span>
        ) : <span />}
        {kind === "request" && allowToggle ? (
          <button className="send-btn" onClick={submit} aria-label="보내기"><ArrowUp size={16} /></button>
        ) : (
          <button className={`k-btn k-btn--sm ${text.trim() ? "k-btn--primary" : ""}`} style={{ borderRadius: 999 }} disabled={!text.trim()} onClick={submit}>
            {kind === "comment" ? "남기기" : "보내기"}
          </button>
        )}
      </div>
    </div>
  );
}
