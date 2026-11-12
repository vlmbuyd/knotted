import type { ProposalStatus } from "@/data/types";

const COLOR: Record<ProposalStatus, string> = {
  "작성 중": "var(--text-tertiary)",
  "검토 요청": "var(--warning)",
  "보류": "var(--text-secondary)",
  "확정": "var(--success)",
  "반영 완료": "var(--success)",
  "반려": "var(--danger)",
};

export default function StatusChip({ status }: { status: ProposalStatus }) {
  return (
    <span className="k-chip" style={{ height: 28, padding: "0 10px", color: "var(--text-primary)", gap: 6 }}>
      <span className="k-dot" style={{ color: COLOR[status] }} />
      {status}
    </span>
  );
}
