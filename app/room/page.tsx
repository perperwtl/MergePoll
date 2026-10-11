"use client";
import { useEffect, useState, useRef } from "react";
import { useLanguage, LanguageSwitch } from "../language";
import { GithubIcon } from "../github-icon";
import { BrandIcon } from "../brand-icon";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Settings2,
  Users,
  MessageCircle,
  Layers3,
  Radio,
  BookOpen,
  Leaf,
  Plus,
  RefreshCw,
  ShieldCheck,
  Clock3,
  Sparkles,
  X,
  Bookmark,
  FlaskConical,
  Split,
  Send,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { samples, pairKey, type Question } from "../../lib/grouping";
import { SOURCE_URL } from "../../lib/project";
type Room = {
  title: string;
  description: string;
  published: boolean;
  interval: number;
  threshold: number;
  questions: Question[];
  scores: Record<string, number>;
  blocked: string[];
  lastRun: number;
  lock: number;
  metrics: any;
  canTeach: boolean;
  connected: boolean;
  localDemo: boolean;
  publicDemo?: boolean;
  demoRunsRemaining?: number;
  revision: number;
  lastGroupedIds?: string[];
  noNewQuestions?: boolean;
};
export default function Home() {
  const { t } = useLanguage();
  const [room, setRoom] = useState<Room | null>(null),
    [mode, setMode] = useState("organizer"),
    [tab, setTab] = useState("active"),
    [raw, setRaw] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [noticeVersion, setNoticeVersion] = useState(0),
    [actor, setActor] = useState(""),
    [text, setText] = useState(""),
    [settings, setSettings] = useState(false),
    [inspect, setInspect] = useState(false),
    [now, setNow] = useState(Date.now()),
    [resetConfirm, setResetConfirm] = useState(false),
    [composerOpen, setComposerOpen] = useState(false);
  const [login, setLogin] = useState(false),
    [loginToken, setLoginToken] = useState(""),
    [loginBusy, setLoginBusy] = useState(false),
    [loginError, setLoginError] = useState(""),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [interval, setIntervalValue] = useState(120),
    [threshold, setThreshold] = useState(0.7),
    [published, setPublished] = useState(true);
  const running = useRef(false),
    retryAt = useRef(0),
    composerInput = useRef<HTMLTextAreaElement>(null);
  async function refresh() {
    try {
      const r = await fetch("/api/room", { cache: "no-store" });
      const d = (await r.json()) as Room & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setRoom((prev) => (!prev || d.revision >= prev.revision ? d : prev));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    let id = localStorage.getItem("mergepoll-participant");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("mergepoll-participant", id);
    }
    setActor(id);
    if (
      new URLSearchParams(location.search).get("view") === "participant" ||
      new URLSearchParams(location.search).get("view") === "student"
    )
      setMode("participant");
    refresh();
    const poll = setInterval(refresh, 3000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);
  async function organizerSession(logout = false) {
    setLoginBusy(true);
    setLoginError("");
    setError("");
    try {
      const r = await fetch("/api/organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logout ? { logout: true } : { token: loginToken }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(d.error);
      setLoginToken("");
      setLogin(false);
      if (logout) setMode("participant");
      await refresh();
      setNotice(logout ? "Organizer signed out." : "Organizer signed in.");
    } catch (e) {
      if (logout) setError((e as Error).message);
      else setLoginError((e as Error).message);
    } finally {
      setLoginBusy(false);
    }
  }
  async function act(action: string, data: any = {}) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, actor, ...data }),
      });
      const d = (await r.json()) as Room & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setRoom((prev) => (!prev || d.revision >= prev.revision ? d : prev));
      if (action === "submit") {
        setText("");
        setComposerOpen(false);
        setNotice(
          "Your question or request is in. You’re anonymous to the room.",
        );
      }
      if (action === "group") {
        setNoticeVersion((v) => v + 1);
        setNotice(
          d.noNewQuestions
            ? "No new questions"
            : d.metrics?.pairs
              ? t("Grouped with {model}. Original questions are preserved.", {
                  model: d.metrics.model,
                })
              : "New questions checked. No comparison needed yet.",
        );
      }
      if (action === "answer")
        setNotice("Marked answered. You can revisit it in Answered.");
      if (action === "restore") setNotice("Question reopened.");
      if (action === "settings") {
        setSettings(false);
        setNotice("Room settings saved.");
      }
      if (action === "reset") {
        setResetConfirm(false);
        setNotice("Ten test questions restored. Ready for a fresh Jev pass.");
      }
    } catch (e) {
      setError((e as Error).message);
      retryAt.current = Date.now() + 60000;
    } finally {
      setBusy(false);
      running.current = false;
    }
  }
  useEffect(() => {
    if (
      !room ||
      mode !== "organizer" ||
      !room.canTeach ||
      !room.published ||
      !room.interval ||
      (room.lock && now - room.lock < 300000) ||
      running.current ||
      now < retryAt.current
    )
      return;
    if (now - room.lastRun >= room.interval * 1000) void act("group");
  }, [now, room, mode]);
  useEffect(() => {
    if (!composerOpen) return;
    // On phones the composer is a bottom sheet; close it if the layout widens.
    const sheet = window.matchMedia("(max-width: 760px)");
    if (!sheet.matches) return setComposerOpen(false);
    const close = () => setComposerOpen(false),
      onKey = (e: KeyboardEvent) => e.key === "Escape" && close(),
      onResize = () => !sheet.matches && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    composerInput.current?.focus();
    document.addEventListener("keydown", onKey);
    sheet.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      sheet.removeEventListener("change", onResize);
    };
  }, [composerOpen]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(
      () => setNotice(""),
      notice === "No new questions" ? 10000 : 6000,
    );
    return () => clearTimeout(timer);
  }, [notice, noticeVersion]);
  const active = room?.questions.filter((q) => !q.saved) || [],
    saved = room?.questions.filter((q) => q.saved) || [];
  function groups(qs: Question[]) {
    const map = new Map<string, Question[]>();
    qs.forEach((q) => {
      const id = raw ? q.id : q.group;
      map.set(id, [...(map.get(id) || []), q]);
    });
    return [...map.entries()]
      .map(([id, members]) => ({
        id,
        members,
        supporters: [...new Set(members.flatMap((q) => q.supporters))],
      }))
      .sort(
        (a, b) =>
          b.supporters.length - a.supporters.length ||
          a.members[0].created - b.members[0].created,
      );
  }
  const allGroups = groups(active),
    list = groups(tab === "saved" ? saved : active),
    unique = new Set(room?.questions.flatMap((q) => q.supporters) || []).size,
    merged = active.length - new Set(active.map((q) => q.group)).size;
  const remaining = room?.interval
    ? Math.max(
        0,
        room.interval - Math.floor(Math.max(0, now - room.lastRun) / 1000),
      )
    : 0;
  const clock = (n: number) =>
    `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  function openSettings() {
    if (!room) return;
    setTitle(room.title);
    setDescription(room.description);
    setIntervalValue(room.interval);
    setThreshold(room.threshold);
    setPublished(room.published);
    setSettings(true);
  }
  const seeded =
    room?.questions.filter((q) => q.id.startsWith("sample-")) || [];
  let tp = 0,
    fp = 0,
    fn = 0;
  for (let i = 0; i < seeded.length; i++)
    for (let j = i + 1; j < seeded.length; j++) {
      const a = seeded[i],
        b = seeded[j];
      const expected =
          samples[Number(a.id.slice(7))][1] ===
          samples[Number(b.id.slice(7))][1],
        actual = a.group === b.group;
      if (actual && expected) tp++;
      if (actual && !expected) fp++;
      if (!actual && expected) fn++;
    }
  if (!room)
    return (
      <div className="intro">
        <nav className="intro-nav">
          <a className="brand" href="/">
            MergePoll
          </a>
        </nav>
        <main>
          <h1>
            {error ? t("Could not open the event") : t("Opening your event…")}
          </h1>
          <p role="status">
            {t(error) || t("Loading the shared queue and event settings.")}
          </p>
          {error && (
            <button className="primary" onClick={refresh}>
              {t("Try again")}
            </button>
          )}
        </main>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <BrandIcon />
          </span>
          Merge<span>Poll</span>
        </a>
        <a
          className="source-link"
          href={SOURCE_URL}
          target="_blank"
          rel="noreferrer"
        >
          <GithubIcon size={18} /> {t("GitHub · Source code ↗")}
        </a>
        <a className="side-link" href="/new">
          <Plus size={18} /> {t("New task")}
        </a>
        <div className="workspace-label">{t("YOUR EVENT")}</div>
        <button
          className="side-link selected"
          onClick={() => {
            setTab("active");
            setRaw(false);
          }}
        >
          <Radio size={18} /> {t("Live room")}
          <span className="side-dot" />
        </button>
        <button className="side-link" onClick={() => setInspect(true)}>
          <FlaskConical size={18} /> {t("Grouping lab")}
        </button>
        <button
          className="side-link"
          onClick={() => {
            setTab("saved");
            setRaw(false);
          }}
        >
          <Bookmark size={18} /> {t("Answered questions")}{" "}
          <small>{new Set(saved.map((q) => q.group)).size}</small>
        </button>
        <div className="side-course">
          <span className="course-icon">
            <Leaf size={22} />
          </span>
          <small>{t("DEMO EVENT")}</small>
          <strong>{room?.title || "Climate Change 101"}</strong>
          <p>
            {t("Many voices.")}
            <br />
            {t("Shared understanding.")}
          </p>
          <div className="orbital" aria-hidden="true">
            <div className="planet" />
            <i />
            <b />
          </div>
        </div>
        <div className="sidebar-foot">
          <ShieldCheck size={17} />
          <div>
            {t("Space to ask freely")}
            <small>{t("Names stay out of the queue.")}</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            {t("Event")}
            <ChevronRight size={14} />
            <strong>{t("Live room")}</strong>
            <a className="about-link" href="/">
              {t("About MergePoll")}
            </a>
          </div>
          <div className="top-actions">
            <LanguageSwitch />
            {!room.publicDemo && (
              <button
                className="outline share-link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      location.origin + "/room?view=participant",
                    );
                    setNotice(
                      t(
                        "Participant link copied. Anyone with the link can join as a participant.",
                      ),
                    );
                  } catch {
                    setError(
                      t(
                        "Could not copy the link. Copy this page’s address instead.",
                      ),
                    );
                  }
                }}
              >
                <Copy size={14} /> {t("Share room")}
              </button>
            )}
            <span className="demo-pill">{t("INTERACTIVE DEMO")}</span>
            <div className="mode-switch">
              <button
                className={mode === "organizer" ? "on" : ""}
                onClick={() => {
                  setMode("organizer");
                  if (!room.canTeach) setLogin(true);
                }}
              >
                {t("Organizer")}
              </button>
              <button
                className={mode === "participant" ? "on" : ""}
                onClick={() => setMode("participant")}
              >
                {t("Participant")}
              </button>
            </div>
            {room.canTeach && !room.localDemo && !room.publicDemo && (
              <button
                className="text-link"
                onClick={() => organizerSession(true)}
              >
                {t("Sign out")}
              </button>
            )}
            <span className="avatar">{mode === "organizer" ? "O" : "P"}</span>
          </div>
        </header>
        <main>
          {room.publicDemo && (
            <div className="notice" role="status">
              {t("Live experiment · Your own browser sandbox.")}{" "}
              {room.demoRunsRemaining ?? 10}{" "}
              {t(
                "live grouping passes left · 100 total questions per task · 500 characters each · one minute between passes. Questions go to TypeSafe when you group. Use synthetic examples.",
              )}
            </div>
          )}
          {room.localDemo && (
            <div className="notice" role="status">
              {t(
                "Local shared room · Organizer controls are shared on this computer. Set ORGANIZER_TOKEN in your Docker .env file to require sign-in.",
              )}
            </div>
          )}
          {!room.publicDemo && !room.connected && (
            <div className="notice" role="status">
              {t(
                "AI grouping needs your own TypeSafe API key. The Docker operator must copy .env.example to .env, set TYPESAFE_API_KEY, then run docker compose up -d. No demo key is included. Posting and voting work without a key.",
              )}
            </div>
          )}
          {mode === "organizer" && !room.canTeach && (
            <div className="notice" role="status">
              {t("Join as a participant, or")}{" "}
              <button className="text-link" onClick={() => setLogin(true)}>
                {t("sign in as the organizer")}
              </button>
              .
            </div>
          )}
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="status-dot" />{" "}
                {room?.published ? t("ROOM IS LIVE") : t("ROOM PAUSED")}{" "}
                <span className="muted">{t("/ MergePoll")}</span>
              </div>
              <h1>
                {room?.title || "Climate Change 101"}
                <span className="title-dot">.</span>
              </h1>
              <p>
                {mode === "organizer"
                  ? t("A clearer picture of what your audience wants to ask.")
                  : t(
                      "A small question can start a big conversation. Ask yours.",
                    )}
              </p>
            </div>
            <button
              className="outline settings-trigger"
              onClick={openSettings}
              disabled={!room?.canTeach || mode !== "organizer"}
            >
              <Settings2 size={16} /> {t("Room settings")}
            </button>
          </section>
          <section className="hero">
            <div className="hero-copy">
              <div className="hero-label">
                <Sparkles size={14} />{" "}
                {t("LESS REPETITION. MORE UNDERSTANDING.")}
              </div>
              <h2>
                {t("Every question counts.")}
                <br />
                <span>{t("Even the quiet ones.")}</span>
              </h2>
              <p>
                {t(
                  "Different questions, shared answer? Jev brings them together.",
                )}
                <br />
                {t("Your audience decides what rises to the top.")}
              </p>
              <div className="hero-meta">
                <span>
                  <ShieldCheck size={14} /> {t("Anonymous questions")}
                </span>
                <span>
                  <Layers3 size={14} /> {t("Semantic merging")}
                </span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <svg viewBox="0 0 330 220">
                <defs>
                  <radialGradient id="earth">
                    <stop stopColor="#9dac78" />
                    <stop offset="1" stopColor="#4f684b" />
                  </radialGradient>
                </defs>
                <ellipse
                  cx="167"
                  cy="112"
                  rx="129"
                  ry="54"
                  fill="none"
                  stroke="#9cab7e"
                  strokeOpacity=".35"
                  transform="rotate(-25 167 112)"
                />
                <ellipse
                  cx="167"
                  cy="112"
                  rx="95"
                  ry="95"
                  fill="none"
                  stroke="#9cab7e"
                  strokeOpacity=".15"
                />
                <circle cx="167" cy="112" r="68" fill="url(#earth)" />
                <g stroke="#bfd0a0" strokeOpacity=".3" fill="none">
                  <ellipse cx="167" cy="112" rx="28" ry="68" />
                  <ellipse cx="167" cy="112" rx="55" ry="68" />
                  <ellipse cx="167" cy="112" rx="68" ry="24" />
                  <ellipse cx="167" cy="112" rx="68" ry="48" />
                  <path d="M99 112h136M167 44v136" />
                </g>
                <circle cx="57" cy="149" r="8" fill="#d7e4b6" />
                <circle cx="281" cy="61" r="5" fill="#c7a07e" />
                <path
                  d="M145 82l15-10 18 7 7 21-16 8-8 23-18-13-3-21zM187 134l14 6 5 18-17 11-12-16z"
                  fill="#d6e1af"
                  fillOpacity=".65"
                />
              </svg>
              <span className="art-note">
                {t("ONE EVENT. MANY PERSPECTIVES.")}
              </span>
            </div>
          </section>
          <section className="stats">
            <div>
              <span>
                <MessageCircle size={16} /> {t("Questions asked")}
              </span>
              <strong>
                {room?.questions.length || 0}
                <small>{t("original voices")}</small>
              </strong>
            </div>
            <div>
              <span>
                <Layers3 size={16} /> {t("Questions in queue")}
              </span>
              <strong>
                {new Set(active.map((q) => q.group)).size}
                <small>
                  {merged
                    ? `${merged} duplicate${merged === 1 ? "" : "s"} merged`
                    : t("ready to group")}
                </small>
              </strong>
            </div>
            <div>
              <span>
                <Users size={16} /> {t("Unique supporters")}
              </span>
              <strong>
                {unique}
                <small>{t("across all questions")}</small>
              </strong>
            </div>
            <div>
              <span>
                <Clock3 size={16} /> {t("Next grouping pass")}
              </span>
              <strong className="timer">
                {!room?.published
                  ? t("Paused")
                  : busy || (room?.lock && now - room.lock < 300000)
                    ? t("Working…")
                    : mode === "organizer" && now < retryAt.current
                      ? t("Retrying…")
                      : room?.interval
                        ? clock(remaining)
                        : t("Manual")}
                <small>
                  {mode === "organizer"
                    ? t("cycle restarts after every check")
                    : t("managed by organizer")}
                </small>
              </strong>
            </div>
          </section>
          {error && (
            <div className="error toast" role="alert">
              {t(error)}
              <button
                aria-label={t("Dismiss error")}
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div
              className={
                "notice toast " +
                (notice === "No new questions" ? "idle-notice" : "")
              }
              role="status"
            >
              <CheckCircle2 size={16} />
              {t(notice)}
            </div>
          )}
          <div className="content-grid">
            <section className="queue">
              <div className="queue-top">
                <div>
                  <h2>
                    {tab === "saved"
                      ? t("Answered questions")
                      : mode === "organizer"
                        ? t("The question queue")
                        : t("What’s on everyone’s mind")}{" "}
                    <span>{list.length}</span>
                  </h2>
                  <p>{t("Ranked by people who want the same answer.")}</p>
                </div>
                {mode === "organizer" && (
                  <button
                    className="primary"
                    disabled={busy || !room?.canTeach || !room?.published}
                    onClick={() => act("group")}
                  >
                    <Sparkles size={16} className={busy ? "spin" : ""} />
                    {busy ? t("Working…") : t("Group now")}
                  </button>
                )}
              </div>
              <div className="queue-toolbar">
                <div className="tabs">
                  <button
                    className={tab === "active" ? "active" : ""}
                    onClick={() => setTab("active")}
                  >
                    {t("Open questions")}
                  </button>
                  <button
                    className={tab === "saved" ? "active" : ""}
                    onClick={() => setTab("saved")}
                  >
                    {t("Answered")}{" "}
                    <span>{new Set(saved.map((q) => q.group)).size}</span>
                  </button>
                </div>
                <button
                  className={"raw-toggle " + (raw ? "chosen" : "")}
                  onClick={() => setRaw(!raw)}
                >
                  <Layers3 size={14} />
                  {raw ? t("Raw questions") : t("Merged view")}
                  <ChevronDown size={12} />
                </button>
              </div>
              <div className="question-list">
                {list.map((g, index) => {
                  const q = g.members[0];
                  const voted = g.supporters.includes(actor);
                  const match =
                    g.members.length > 1
                      ? Math.min(
                          ...g.members.flatMap((a, i) =>
                            g.members
                              .slice(i + 1)
                              .map(
                                (b) => room?.scores[pairKey(a.id, b.id)] ?? 0,
                              ),
                          ),
                        )
                      : null;
                  return (
                    <article
                      className={
                        "question-card " +
                        (index === 0 && tab === "active" ? "leading" : "")
                      }
                      key={g.id}
                    >
                      <div className="rank">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="question-body">
                        <div className="question-label">
                          <span>
                            {g.members.length > 1 ? (
                              <>
                                <Layers3 size={12} />
                                {g.members.length} {t("questions merged")}
                              </>
                            ) : (
                              <>
                                <MessageCircle size={12} />
                                {t("Anonymous question")}
                              </>
                            )}
                          </span>
                          {index === 0 && tab === "active" && (
                            <em>{t("MOST ASKED")}</em>
                          )}
                        </div>
                        <h3>{q.text}</h3>
                        {tab === "saved" && (
                          <span className="answered-badge">
                            <CheckCircle2 size={12} /> {t("Answered")}
                          </span>
                        )}
                        <div className="question-bottom">
                          <span>
                            {g.supporters.length}{" "}
                            {g.supporters.length === 1
                              ? t("person wants")
                              : t("people want")}{" "}
                            {t("to know")}
                          </span>
                          {match !== null && (
                            <span className="confidence">
                              <span className="tiny-dot" />
                              {Math.round(match * 100)}
                              {t("% minimum match")}
                            </span>
                          )}
                        </div>
                        {g.members.length > 1 && (
                          <details>
                            <summary>
                              {t("See original questions")}
                              <ChevronDown size={13} />
                            </summary>
                            <div className="originals">
                              {g.members.map((m) => (
                                <p key={m.id}>“{m.text}”</p>
                              ))}
                              {mode === "organizer" && (
                                <button
                                  disabled={busy || !room.canTeach}
                                  onClick={() => act("split", { id: q.group })}
                                >
                                  <Split size={13} /> {t("Keep these separate")}
                                </button>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                      <div className="card-actions">
                        {tab === "active" ? (
                          <>
                            <button
                              className={"vote " + (voted ? "voted" : "")}
                              disabled={busy || !room?.published}
                              onClick={() => act("vote", { id: q.group })}
                              aria-label={t("Support question:") + q.text}
                            >
                              <ArrowUp size={19} />
                              <strong>{g.supporters.length}</strong>
                              <small>{voted ? t("Joined") : "+1"}</small>
                            </button>
                            {mode === "organizer" && (
                              <button
                                className="save"
                                disabled={busy || !room?.canTeach}
                                onClick={() => act("answer", { id: q.group })}
                                title={t("Mark this question answered")}
                              >
                                <Check size={14} /> {t("Mark answered")}
                              </button>
                            )}
                          </>
                        ) : (
                          mode === "organizer" && (
                            <button
                              className="save"
                              disabled={busy || !room.canTeach}
                              onClick={() => act("restore", { id: q.group })}
                            >
                              <RefreshCw size={14} /> {t("Reopen")}
                            </button>
                          )
                        )}
                      </div>
                    </article>
                  );
                })}
                {!list.length && (
                  <div className="empty">
                    <MessageCircle size={30} />
                    <h3>
                      {tab === "saved"
                        ? t("Your answered questions will live here.")
                        : t("A little space for curiosity.")}
                    </h3>
                    <p>
                      {tab === "saved"
                        ? t("Mark a question answered to revisit it here.")
                        : t("Ask a question to start the conversation.")}
                    </p>
                  </div>
                )}
              </div>
              <div className="queue-footer">
                <ShieldCheck size={14} />{" "}
                {t(
                  "Original wording is always preserved. Votes count unique supporters.",
                )}
              </div>
            </section>
            <aside className="right-column">
              {composerOpen && (
                <div
                  className="composer-scrim"
                  onClick={() => setComposerOpen(false)}
                />
              )}
              <section
                id="composer"
                className={"composer " + (composerOpen ? "open" : "")}
                aria-labelledby="composer-title"
                {...(composerOpen && { role: "dialog", "aria-modal": true })}
              >
                <button
                  type="button"
                  className="composer-close"
                  aria-label={t("Close")}
                  onClick={() => setComposerOpen(false)}
                >
                  <X size={18} />
                </button>
                <div className="section-icon">
                  <Plus size={19} />
                </div>
                <h2 id="composer-title">{t("Wondering about something?")}</h2>
                <p>
                  {t("No raised hands. No names.")}
                  <br />
                  {t("Just your question or request.")}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    act("submit", { text });
                  }}
                >
                  <label className="sr-only" htmlFor="question">
                    {t("Your question or request")}
                  </label>
                  <textarea
                    ref={composerInput}
                    id="question"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                    placeholder={t("Ask a question or make a request…")}
                    required
                    disabled={!room?.published}
                  />
                  <div className="composer-bottom">
                    <span>{text.length}/500</span>
                    <span>
                      <ShieldCheck size={12} /> {t("Anonymous")}
                    </span>
                  </div>
                  <button
                    className="primary full"
                    disabled={busy || !text.trim() || !room?.published}
                  >
                    {t("Post to the room")}
                    <ArrowRight size={16} />
                  </button>
                </form>
                <small className="hint">
                  {t("See your question already? Give it a +1.")}
                </small>
              </section>
              <section className="engine">
                <div className="engine-heading">
                  <span className="engine-icon">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <strong>{t("Small model. Shared insight.")}</strong>
                    <span>{t("Powered by TypeSafe Jev")}</span>
                  </div>
                  <span className="status-dot" />
                </div>
                <p>
                  {t(
                    "Questions merge when one useful answer or action can satisfy both.",
                  )}
                </p>
                <div className="engine-facts">
                  <span>
                    {t("Connection")}{" "}
                    <b>{room?.connected ? t("Ready") : t("Not configured")}</b>
                  </span>
                  <span>
                    {t("Merge threshold")}{" "}
                    <b>{Math.round((room?.threshold || 0.7) * 100)}%</b>
                  </span>
                  <span>
                    {t("Last pass")}{" "}
                    <b>
                      {room?.metrics
                        ? t("{seconds}s · {pairs} new pairs", {
                            seconds: (room.metrics.ms / 1000).toFixed(1),
                            pairs: room.metrics.pairs,
                          })
                        : t("Not run yet")}
                    </b>
                  </span>
                </div>
                <button className="text-link" onClick={() => setInspect(true)}>
                  {t("Inspect the grouping")}
                  <ArrowUpRight size={14} />
                </button>
              </section>
              <section className="demo-card">
                <div>
                  <FlaskConical size={17} />
                  <span>{t("TRY THE EXPERIMENT")}</span>
                </div>
                <h3>{t("10 questions. How many answers?")}</h3>
                <p>
                  {t(
                    "Four paraphrase pairs and two distinct questions. Test how well Jev understands the difference.",
                  )}
                </p>
                <button
                  disabled={busy || mode !== "organizer" || !room.canTeach}
                  onClick={() => setResetConfirm(true)}
                >
                  <RefreshCw size={14} /> {t("Reset test questions")}
                </button>
              </section>
            </aside>
          </div>
          {!composerOpen && (
            <div className="ask-bar">
              <button
                type="button"
                aria-controls="composer"
                aria-haspopup="dialog"
                disabled={!room.published}
                onClick={() => setComposerOpen(true)}
              >
                <span>
                  {!room.published
                    ? t("The room is paused for new questions")
                    : text.trim() || t("Ask a question or make a request…")}
                </span>
                <span className="ask-bar-icon" aria-hidden="true">
                  <ArrowUp size={16} />
                </span>
              </button>
            </div>
          )}
          <footer className="page-footer">
            <span>
              MergePoll{" "}
              <span className="muted">
                {t("/ Curiosity, without the spotlight.")}
              </span>
            </span>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">
              {t("Source code · MergePoll")}
            </a>
          </footer>
        </main>
      </div>
      {login && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setLogin(false);
            setLoginToken("");
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label={t("Close organizer login")}
              onClick={() => {
                setLogin(false);
                setLoginToken("");
              }}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">{t("ORGANIZER ACCESS")}</div>
            <h2 id="login-title">{t("Welcome back.")}</h2>
            <p>
              {t(
                "Enter the private organizer token configured by the person hosting this room. Participants do not need a token.",
              )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void organizerSession();
              }}
            >
              <label htmlFor="organizer-token">{t("Organizer token")}</label>
              {loginError && (
                <p className="error" role="alert">
                  {t(loginError)}
                </p>
              )}
              <input
                id="organizer-token"
                type="password"
                autoComplete="current-password"
                value={loginToken}
                onChange={(e) => setLoginToken(e.target.value)}
                required
                maxLength={512}
              />
              <button className="primary full" disabled={loginBusy}>
                {t("Sign in")}
                <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>
      )}
      {settings && (
        <div className="modal-backdrop" onClick={() => setSettings(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label={t("Close settings")}
              onClick={() => setSettings(false)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">{t("YOUR EVENT")}</div>
            <h2 id="settings-title">{t("Make room for questions.")}</h2>
            <p>
              {t("An event name is all you need. Add context if you like.")}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act("settings", {
                  title,
                  description,
                  interval,
                  threshold,
                  published,
                });
              }}
            >
              <label htmlFor="course">
                {t("Event name")}
                <span>{t("Required")}</span>
              </label>
              <input
                id="course"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
              <label htmlFor="description">
                {t("Event context")}
                <span>{t("Optional")}</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder={t(
                  "Agenda, session topics, performance details, or event rules…",
                )}
              />
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setDescription(
                    title.toLowerCase().includes("climate")
                      ? t(
                          "Explore weather and climate, greenhouse gases, evidence of human-caused warming, sea-level rise, and everyday climate action.",
                        )
                      : t(
                          "An introduction to {title}: what the event covers, what participants can ask or request, and how the organizer will respond.",
                          { title: title || t("this event") },
                        ),
                  )
                }
              >
                <Sparkles size={14} /> {t("Use a starter outline")}{" "}
                <span className="muted">{t("(template)")}</span>
              </button>
              <div className="form-row">
                <div>
                  <label htmlFor="interval">{t("Grouping cycle")}</label>
                  <select
                    id="interval"
                    value={interval}
                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                  >
                    {!room.publicDemo && (
                      <>
                        <option value={60}>{t("Every 1 minute")}</option>
                        <option value={120}>
                          {t("Every 2 minutes · recommended")}
                        </option>
                        <option value={180}>{t("Every 3 minutes")}</option>
                        <option value={300}>{t("Every 5 minutes")}</option>
                      </>
                    )}
                    <option value={0}>{t("Manual only")}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="threshold">{t("Merge threshold")}</label>
                  <select
                    id="threshold"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  >
                    <option value={0.7}>
                      {t("70% · shared answers · recommended")}
                    </option>
                    <option value={0.75}>{t("75% · exploratory")}</option>
                    <option value={0.85}>{t("85% · balanced")}</option>
                    <option value={0.95}>{t("95% · conservative")}</option>
                  </select>
                </div>
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />{" "}
                {t("Publish room · participants can post and vote")}
              </label>
              <p className="fine-print">
                {room.publicDemo
                  ? t(
                      "Hosted tasks allow 100 total questions and manual grouping with shared session and daily budgets.",
                    )
                  : t(
                      "Automatic passes run while the organizer view is open. No application question-count or grouping quota; your own provider limits apply.",
                    )}
              </p>
              <button className="primary full" disabled={busy}>
                {t("Save room")}
                <Check size={16} />
              </button>
            </form>
          </section>
        </div>
      )}
      {inspect && (
        <div className="modal-backdrop" onClick={() => setInspect(false)}>
          <section
            className="modal lab-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lab-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label={t("Close grouping lab")}
              onClick={() => setInspect(false)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">
              <FlaskConical size={14} /> {t("GROUPING LAB")}
            </div>
            <h2 id="lab-title">{t("Different questions. Shared answers.")}</h2>
            <p>
              {t(
                "Jev judges whether one concise response naturally covers both posts. Broader and narrower questions can merge; a shared topic alone does not qualify.",
              )}
            </p>
            <div className="lab-stats">
              <div>
                <strong>
                  {room?.metrics
                    ? `${tp + fp ? Math.round((tp / (tp + fp)) * 100) : 0}%`
                    : "—"}
                </strong>
                <span>{t("Pair precision")}</span>
              </div>
              <div>
                <strong>
                  {room?.metrics
                    ? `${tp + fn ? Math.round((tp / (tp + fn)) * 100) : 0}%`
                    : "—"}
                </strong>
                <span>{t("Pair recall")}</span>
              </div>
              <div>
                <strong>6</strong>
                <span>{t("Expected seed groups")}</span>
              </div>
            </div>
            <p className="fine-print">
              {t(
                "Metrics use only the ten original test questions and their predefined equivalence labels. Zero predicted matches displays 0% precision. These original labels test paraphrases; the broader shared-answer policy can also accept overlap beyond those labels. This is a small sanity check, not a general accuracy benchmark.",
              )}
            </p>
            <div className="lab-settings">
              <span>
                {t("Model")}
                <b>{room?.metrics?.model || "jev-1.13.0"}</b>
              </span>
              <span>
                {t("Last request")}{" "}
                <b>
                  {room?.metrics?.usage?.input_tokens || 0} {t("input tokens")}
                </b>
              </span>
              <span>
                {t("Estimated request cost")}{" "}
                <b>
                  $
                  {(
                    ((room?.metrics?.usage?.input_tokens || 0) * 0.042) /
                    1e6
                  ).toFixed(6)}
                </b>
              </span>
            </div>
            <h3>{t("Test questions & actual groups")}</h3>
            <div className="lab-questions">
              {seeded.map((q, i) => (
                <div key={q.id}>
                  <span>{i + 1}</span>
                  <p>
                    {q.text}
                    <small>
                      {t("Expected:")}
                      {samples[Number(q.id.slice(7))][1]} {t("· Actual group:")}
                      {q.group}
                    </small>
                  </p>
                  <b>
                    {room?.metrics
                      ? q.group !== q.id
                        ? t("Merged")
                        : t("Representative")
                      : t("Unprocessed")}
                  </b>
                </div>
              ))}
            </div>
            <details className="pair-details">
              <summary>
                {t("Inspect all pair probabilities")}
                <ChevronDown size={14} />
              </summary>
              <div>
                {Object.entries(room?.scores || {}).map(([key, p]) => {
                  const ids = key.split("|"),
                    a = room?.questions.find((q) => q.id === ids[0]),
                    b = room?.questions.find((q) => q.id === ids[1]);
                  return (
                    <div key={key}>
                      <span>
                        {a?.text}
                        <br />
                        <em>{b?.text}</em>
                      </span>
                      <strong
                        className={p >= (room?.threshold || 0.7) ? "match" : ""}
                      >
                        {Math.round(p * 100)}%
                      </strong>
                    </div>
                  );
                })}
              </div>
            </details>
            <p className="fine-print">
              {t(
                "Complete-link merging: every pair inside a group must clear the threshold. Splitting a group blocks its pairs from being automatically merged again. Cost is estimated at the documented $0.042 per million input tokens; outputs are free.",
              )}
            </p>
            {mode === "organizer" && (
              <button
                className="primary full"
                disabled={busy}
                onClick={() => act("group")}
              >
                <Sparkles size={16} />
                {busy ? t("Evaluating…") : t("Run real Jev grouping")}
              </button>
            )}
          </section>
        </div>
      )}
      {resetConfirm && (
        <div className="modal-backdrop">
          <section
            className="modal small-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
          >
            <h2 id="reset-title">{t("Reset the experiment?")}</h2>
            <p>
              {t(
                "This replaces the room’s questions, votes, answered history, and match history with the ten test questions.",
              )}
            </p>
            <div className="form-row">
              <button
                className="outline"
                onClick={() => setResetConfirm(false)}
              >
                {t("Keep my questions")}
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => act("reset")}
              >
                {t("Reset demo")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
