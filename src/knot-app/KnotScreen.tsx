import { ChevronRight, CircleAlert, Inbox, List, LoaderCircle, LogOut, MessageSquareMore, Mic, RotateCw, User } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { ScreenId } from "@/data/types";
import { useKnotted } from "@/store/useKnotted";
import { useUi } from "@/store/useUi";
import s from "./knot.module.css";

export type KnotAction = "avatar" | "logout" | "cancel" | "confirm" | "outside";

interface Props {
  screen: ScreenId;
  /** develop은 로그아웃 기능이 없는 지금 화면 */
  variant?: "draft" | "develop";
  /** 흐름 보기에서 실제 앱처럼 누를 때만 넘긴다 */
  onAction?: (action: KnotAction) => void;
}

const RECORDING_SCREENS: ScreenId[] = ["recording-confirm", "finish-logging-out", "recording-elsewhere", "home-recording", "menu-recording"];

/** 고친 문구가 있으면 그것을, 없으면 기본 문구를 보여 준다 */
function Txt({ k, d }: { k: string; d: string }) {
  const value = useKnotted((st) => st.textOverrides[k]);
  const before = useUi((u) => u.previewBefore === k);
  return <span data-knotted-text={k}>{before ? d : value ?? d}</span>;
}

function El({ name, className, style, children, onClick, as = "div" }: {
  name: string; className?: string; style?: CSSProperties; children?: ReactNode; onClick?: () => void; as?: "div" | "nav" | "button";
}) {
  const raw = useKnotted((st) => st.styleOverrides[name]);
  const before = useUi((u) => u.previewBefore === name);
  const override = before ? undefined : raw;
  const Tag = as;
  return (
    <Tag data-knotted={name} className={className} style={{ ...style, ...(override as CSSProperties) }} onClick={onClick}>
      {children}
    </Tag>
  );
}

export default function KnotScreen(props: Props) {
  if (props.screen === "login") return <LoginScreen />;
  return <HomeScreen {...props} />;
}

function HomeScreen({ screen, variant = "draft", onAction }: Props) {
  const rawMenuStyle = useKnotted((st) => st.styleOverrides.ProfileMenu) as CSSProperties | undefined;
  const menuBefore = useUi((u) => u.previewBefore === "ProfileMenu");
  const menuStyle = menuBefore ? undefined : rawMenuStyle;
  const recording = RECORDING_SCREENS.includes(screen);
  const menuOpen = variant === "draft" && screen !== "home" && screen !== "home-recording";
  const busy = screen === "logging-out" || screen === "finish-logging-out";
  const fire = (a: KnotAction) => (e?: { stopPropagation: () => void }) => {
    e?.stopPropagation();
    onAction?.(a);
  };

  return (
    <div className={s.screen} onClick={() => onAction?.("outside")}>
      <El name="WorkspaceGnb" className={s.gnb}>
        <div className={s.gnbLeft}>
          <span className={s.roundBtn}><List size={16} /></span>
          <span className={s.wsAvatar}>노</span>
          <span className={s.crumb}><span>팀 노트</span><ChevronRight size={14} color="#b0aba2" /><span>홈</span></span>
        </div>
        <div className={s.tabs}>
          <span className={`${s.tab} ${s.tabActive}`}>홈</span>
          <span className={s.tab}>탐색</span>
          {recording && <span className={s.tab}>문서</span>}
        </div>
        <div className={s.gnbRight}>
          <span className={s.divider} />
          <span className={s.roundBtn}><Inbox size={16} /></span>
          <El name="MemberProfileAvatar" as="button" className={s.avatar} onClick={() => fire("avatar")()}>노</El>
        </div>
      </El>

      {menuOpen && (
        <El name="ProfileMenu" as="nav" className={s.menu}>
          <button
            type="button"
            className={`${s.menuItem} ${busy ? s.menuItemBusy : ""}`}
            onClick={(e) => fire("logout")(e)}
            style={menuStyle}
          >
            {busy ? <LoaderCircle size={18} className={s.spin} /> : <LogOut size={18} />}
            <Txt k="menu.logout" d="로그아웃" />
          </button>
        </El>
      )}

      <El name="MemberGreeting" className={s.greeting}><Txt k="greeting" d="반가워요, 유월 님" /></El>

      <El name="RecordingHistory" className={`${s.card} ${s.history}`}>
        <div className={s.cardTitle}><Txt k="card.history" d="녹음 기록" /></div>
        {recording && (
          <>
            <El name="RecordingHistoryItem" className={s.recRow}>
              <span className={s.recIcon}><Mic size={20} /></span>
              <div className={s.rowMain}>
                <div className={s.rowTitle} style={{ fontWeight: 600 }}>유월 님의 녹음</div>
                <div className={s.recLive}>녹음 중 12:48</div>
                <div className={s.recDesc}>
                  {screen === "recording-elsewhere" ? "녹음 중인 탭에서 일시정지, 끝내기를 할 수 있어요" : "다른 화면으로 이동해도 녹음은 계속돼요"}
                </div>
              </div>
              <span className={`${s.darkBtn} ${screen === "recording-elsewhere" ? s.darkBtnOff : ""}`} style={{ display: "grid", placeItems: "center" }}>녹음 화면으로</span>
            </El>
            <div className={s.sep} />
          </>
        )}
        <div className={s.rows} style={recording ? { marginTop: 4 } : undefined}>
          <Row title="알림 정책 정리 회의와 다음 분기 알림 채널 우선순위, 실패 알림 묶음 정리" meta={<><span>2026년 10월 26일</span><span className={s.dur}>48분</span></>} />
          <Row title="온보딩 인터뷰 참가자 3" meta={<span className={s.fail}>녹음을 글로 옮기지 못했어요</span>} retry />
          <Row title="주간 회의 10월 넷째 주" meta={<><span>2026년 10월 24일</span><span className={s.dur}>52분</span></>} />
          <Row title="유월 님의 녹음" meta={<span className={s.muted}>변환된 음성 기록이 없어요.</span>} />
          {!recording && <Row title="결제 화면 개편 회의" meta={<span className={s.fail}>문서를 만들지 못했어요</span>} noLink />}
          <div className={s.faded}><Row title="비밀번호 재설정 정책 논의" meta={<span>2026년 10월 20일</span>} /></div>
        </div>
      </El>

      <El name="PendingDocuments" className={`${s.card} ${s.pending}`}>
        <div className={s.cardTitle}><Txt k="card.pending" d="확인이 필요한 문서" /><em>2</em></div>
        <div style={{ marginTop: 16 }}>
          {[["결제 화면 개편 회의 요약", "2026년 9월 16일"], ["회원 탈퇴 정책", "2026년 9월 15일"]].map(([t, d]) => (
            <div key={t} className={s.docRow}>
              <div><div className={s.docTitle}>{t}</div><div className={s.docDate}>{d}</div></div>
              <El name="Button" as="div" className={s.outlineBtn} style={{ display: "grid", placeItems: "center" }}>확인하기</El>
            </div>
          ))}
        </div>
      </El>

      <El name="InviteCard" className={`${s.card} ${s.invite}`}>
        <div className={s.inviteHead}><span className={s.inviteIcon}><User size={20} /></span><Txt k="card.invite" d="팀원 초대" /></div>
        <div className={s.inviteField}><span>knot.app/i/X35D3S</span><span className={s.darkBtn} style={{ display: "grid", placeItems: "center" }}>복사</span></div>
        <div className={s.inviteSub}>초대 코드 복사</div>
      </El>

      {screen === "logout-failed" && (
        <El name="Toast" className={s.toast}>
          <CircleAlert size={18} />
          <Txt k="toast.logoutFailed" d="로그아웃하지 못했어요. 다시 시도해 주세요." />
        </El>
      )}

      {recording ? (
        <El name="RecordDock" className={s.wave}>
          <div className={s.waveBars}>
            {Array.from({ length: 60 }, (_, i) => (
              <i key={i} style={{ height: `${20 + 70 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21))}%` }} />
            ))}
          </div>
          12:48
        </El>
      ) : (
        <El name="RecordDock" className={s.dock}>
          <MessageSquareMore size={24} />
          <span className={s.recDot} />
        </El>
      )}

      {(screen === "recording-confirm" || screen === "recording-elsewhere") && (
        <>
          <div className={s.dim} />
          <El name="ConfirmDialog" className={s.dialog} style={{ top: screen === "recording-confirm" ? 405 : 393 }}>
            {screen === "recording-confirm" ? (
              <>
                <div className={s.dialogTitle}><Txt k="dialog.recording.title" d="녹음을 끝내고 로그아웃할까요?" /></div>
                <div className={s.dialogDesc}><Txt k="dialog.recording.desc" d="지금 녹음은 문서로 정리돼요." /></div>
                <div className={s.dialogActions}>
                  <button type="button" className={s.cancelBtn} onClick={(e) => fire("cancel")(e)}><Txt k="dialog.recording.cancel" d="취소" /></button>
                  <button type="button" className={s.confirmBtn} onClick={(e) => fire("confirm")(e)}><Txt k="dialog.recording.confirm" d="끝내고 로그아웃" /></button>
                </div>
              </>
            ) : (
              <>
                <div className={s.dialogTitle}><Txt k="dialog.elsewhere.title" d="다른 곳에서 녹음 중이에요" /></div>
                <div className={s.dialogDesc}><Txt k="dialog.elsewhere.desc" d={"로그아웃하면 이 브라우저의 녹음은 저장이 멈춰요.\n다른 기기의 녹음은 그대로 이어져요."} /></div>
                <div className={s.dialogActions}>
                  <button type="button" className={s.cancelBtn} onClick={(e) => fire("cancel")(e)}>취소</button>
                  <button type="button" className={s.confirmBtn} onClick={(e) => fire("confirm")(e)}><Txt k="dialog.elsewhere.confirm" d="로그아웃" /></button>
                </div>
              </>
            )}
          </El>
        </>
      )}
    </div>
  );
}

function Row({ title, meta, retry, noLink }: { title: string; meta: ReactNode; retry?: boolean; noLink?: boolean }) {
  return (
    <El name="RecordingHistoryItem" className={s.row}>
      <span className={s.micIcon}><Mic size={16} /></span>
      <div className={s.rowMain}>
        <div className={s.rowTitle}>{title}</div>
        <div className={s.rowMeta}>{meta}</div>
      </div>
      {retry ? (
        <span className={s.retry}><RotateCw size={13} />다시 시도</span>
      ) : noLink ? null : (
        <span className={s.rowLink}>녹음 보기<ChevronRight size={14} /></span>
      )}
    </El>
  );
}

function LoginScreen() {
  return (
    <El name="LoginPage" className={s.screen}>
      <div className={s.login}>
        <div className={s.logo}>knot</div>
        <div className={s.headline}><Txt k="login.headline" d="팀의 결정을" /><br />모두의 기억으로</div>
        <div className={s.loginBtns}>
          <div className={s.loginBtn} style={{ background: "#3c3b39", color: "#fff" }}>GitHub으로 시작하기</div>
          <div className={s.loginBtn} style={{ background: "#fff", border: "1px solid #747775", color: "#1f1f1f" }}>Google로 시작하기</div>
          <div className={s.loginBtn} style={{ background: "#fee500", color: "rgba(0,0,0,.85)" }}>카카오로 시작하기</div>
        </div>
        <div className={s.loginNote}>처음 가입한 방법으로 로그인해야 같은 계정이에요</div>
        <div className={s.loginFine}>로그인하면 서비스 이용약관과 개인정보 처리방침에 동의하게 됩니다.</div>
      </div>
    </El>
  );
}
