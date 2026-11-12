import { Check } from "lucide-react";
import { useToast } from "@/lib/toast";

export default function Toasts() {
  const items = useToast((s) => s.items);
  return (
    <div style={{ position: "fixed", left: "50%", bottom: 96, transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 1000, pointerEvents: "none" }}>
      {items.map((t) => (
        <div key={t.id} className="k-pop" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
          <Check size={14} color="var(--success)" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
