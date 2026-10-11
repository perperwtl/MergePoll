"use client";
import { useEffect, useState, useRef } from "react";
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
  Activity,
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
  revision: number;
  lastGroupedIds?: string[];
  noNewQuestions?: boolean;
};
export default function Home() {
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
    [resetConfirm, setResetConfirm] = useState(false);
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
    retryAt = useRef(0);
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
              ? `Grouped with ${d.metrics.model}. Original questions are preserved.`
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
    if (!notice) return;
    const t = setTimeout(
      () => setNotice(""),
      notice === "No new questions" ? 10000 : 6000,
    );
    return () => clearTimeout(t);
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
          <h1>{error ? "Could not open the event" : "Opening your event…"}</h1>
          <p role="status">
            {error || "Loading the shared queue and event settings."}
          </p>
          {error && (
            <button className="primary" onClick={refresh}>
              Try again
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
            <Activity size={23} />
          </span>
          Merge<span>Poll</span>
        </a>
        <div className="workspace-label">YOUR EVENT</div>
        <button
          className="side-link selected"
          onClick={() => {
            setTab("active");
            setRaw(false);
          }}
        >
          <Radio size={18} /> Live room <span className="side-dot" />
        </button>
        <button className="side-link" onClick={() => setInspect(true)}>
          <FlaskConical size={18} /> Grouping lab
        </button>
        <button
          className="side-link"
          onClick={() => {
            setTab("saved");
            setRaw(false);
          }}
        >
          <Bookmark size={18} /> Answered questions{" "}
          <small>{new Set(saved.map((q) => q.group)).size}</small>
        </button>
        <div className="side-course">
          <span className="course-icon">
            <Leaf size={22} />
          </span>
          <small>DEMO EVENT</small>
          <strong>{room?.title || "Climate Change 101"}</strong>
          <p>
            Many voices.
            <br />
            Shared understanding.
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
            Space to ask freely<small>Names stay out of the queue.</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Event <ChevronRight size={14} />
            <strong>Live room</strong>
            <a className="about-link" href="/">
              About MergePoll
            </a>
          </div>
          <div className="top-actions">
            <button
              className="outline share-link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    location.origin + "/room?view=participant",
                  );
                  setNotice(
                    "Participant link copied. Anyone with the link can join as a participant.",
                  );
                } catch {
                  setError(
                    "Could not copy the link. Copy this page’s address instead.",
                  );
                }
              }}
            >
              <Copy size={14} /> Share room
            </button>
            <span className="demo-pill">INTERACTIVE DEMO</span>
            <div className="mode-switch">
              <button
                className={mode === "organizer" ? "on" : ""}
                onClick={() => {
                  setMode("organizer");
                  if (!room.canTeach) setLogin(true);
                }}
              >
                Organizer
              </button>
              <button
                className={mode === "participant" ? "on" : ""}
                onClick={() => setMode("participant")}
              >
                Participant
              </button>
            </div>
            {room.canTeach && !room.localDemo && (
              <button
                className="text-link"
                onClick={() => organizerSession(true)}
              >
                Sign out
              </button>
            )}
            <span className="avatar">{mode === "organizer" ? "O" : "P"}</span>
          </div>
        </header>
        <main>
          {room.localDemo && (
            <div className="notice" role="status">
              Local sandbox · Organizer controls are shared on this computer.
              Set an organizer token before hosting.
            </div>
          )}
          {mode === "organizer" && !room.canTeach && (
            <div className="notice" role="status">
              Join as a participant, or{" "}
              <button className="text-link" onClick={() => setLogin(true)}>
                sign in as the organizer
              </button>
              .
            </div>
          )}
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="status-dot" />{" "}
                {room?.published ? "ROOM IS LIVE" : "ROOM PAUSED"}{" "}
                <span className="muted">/ ROOM CC101</span>
              </div>
              <h1>
                {room?.title || "Climate Change 101"}
                <span className="title-dot">.</span>
              </h1>
              <p>
                {mode === "organizer"
                  ? "A clearer picture of what your audience wants to ask."
                  : "A small question can start a big conversation. Ask yours."}
              </p>
            </div>
            <button
              className="outline settings-trigger"
              onClick={openSettings}
              disabled={!room?.canTeach || mode !== "organizer"}
            >
              <Settings2 size={16} /> Room settings
            </button>
          </section>
          <section className="hero">
            <div className="hero-copy">
              <div className="hero-label">
                <Sparkles size={14} /> LESS REPETITION. MORE UNDERSTANDING.
              </div>
              <h2>
                Every question counts.
                <br />
                <span>Even the quiet ones.</span>
              </h2>
              <p>
                Different questions, shared answer? Jev brings them together.
                <br />
                Your audience decides what rises to the top.
              </p>
              <div className="hero-meta">
                <span>
                  <ShieldCheck size={14} /> Anonymous questions
                </span>
                <span>
                  <Layers3 size={14} /> Semantic merging
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
              <span className="art-note">ONE EVENT. MANY PERSPECTIVES.</span>
            </div>
          </section>
          <section className="stats">
            <div>
              <span>
                <MessageCircle size={16} /> Questions asked
              </span>
              <strong>
                {room?.questions.length || 0}
                <small>original voices</small>
              </strong>
            </div>
            <div>
              <span>
                <Layers3 size={16} /> Questions in queue
              </span>
              <strong>
                {new Set(active.map((q) => q.group)).size}
                <small>
                  {merged
                    ? `${merged} duplicate${merged === 1 ? "" : "s"} merged`
                    : "ready to group"}
                </small>
              </strong>
            </div>
            <div>
              <span>
                <Users size={16} /> Unique supporters
              </span>
              <strong>
                {unique}
                <small>across all questions</small>
              </strong>
            </div>
            <div>
              <span>
                <Clock3 size={16} /> Next grouping pass
              </span>
              <strong className="timer">
                {!room?.published
                  ? "Paused"
                  : busy || (room?.lock && now - room.lock < 300000)
                    ? "Working…"
                    : mode === "organizer" && now < retryAt.current
                      ? "Retrying…"
                      : room?.interval
                        ? clock(remaining)
                        : "Manual"}
                <small>
                  {mode === "organizer"
                    ? "cycle restarts after every check"
                    : "managed by organizer"}
                </small>
              </strong>
            </div>
          </section>
          {error && (
            <div className="error" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div
              className={
                "notice " + (notice === "No new questions" ? "idle-notice" : "")
              }
              role="status"
            >
              <CheckCircle2 size={16} />
              {notice}
            </div>
          )}
          <div className="content-grid">
            <section className="queue">
              <div className="queue-top">
                <div>
                  <h2>
                    {tab === "saved"
                      ? "Answered questions"
                      : mode === "organizer"
                        ? "The question queue"
                        : "What’s on everyone’s mind"}{" "}
                    <span>{list.length}</span>
                  </h2>
                  <p>Ranked by people who want the same answer.</p>
                </div>
                {mode === "organizer" && (
                  <button
                    className="primary"
                    disabled={busy || !room?.canTeach || !room?.published}
                    onClick={() => act("group")}
                  >
                    <Sparkles size={16} className={busy ? "spin" : ""} />
                    {busy ? "Working…" : "Group now"}
                  </button>
                )}
              </div>
              <div className="queue-toolbar">
                <div className="tabs">
                  <button
                    className={tab === "active" ? "active" : ""}
                    onClick={() => setTab("active")}
                  >
                    Open questions
                  </button>
                  <button
                    className={tab === "saved" ? "active" : ""}
                    onClick={() => setTab("saved")}
                  >
                    Answered{" "}
                    <span>{new Set(saved.map((q) => q.group)).size}</span>
                  </button>
                </div>
                <button
                  className={"raw-toggle " + (raw ? "chosen" : "")}
                  onClick={() => setRaw(!raw)}
                >
                  <Layers3 size={14} />
                  {raw ? "Raw questions" : "Merged view"}
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
                                {g.members.length} questions merged
                              </>
                            ) : (
                              <>
                                <MessageCircle size={12} />
                                Anonymous question
                              </>
                            )}
                          </span>
                          {index === 0 && tab === "active" && (
                            <em>MOST ASKED</em>
                          )}
                        </div>
                        <h3>{q.text}</h3>
                        {tab === "saved" && (
                          <span className="answered-badge">
                            <CheckCircle2 size={12} /> Answered
                          </span>
                        )}
                        <div className="question-bottom">
                          <span>
                            {g.supporters.length}{" "}
                            {g.supporters.length === 1
                              ? "person wants"
                              : "people want"}{" "}
                            to know
                          </span>
                          {match !== null && (
                            <span className="confidence">
                              <span className="tiny-dot" />
                              {Math.round(match * 100)}% minimum match
                            </span>
                          )}
                        </div>
                        {g.members.length > 1 && (
                          <details>
                            <summary>
                              See original questions <ChevronDown size={13} />
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
                                  <Split size={13} /> Keep these separate
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
                              aria-label={"Support question: " + q.text}
                            >
                              <ArrowUp size={19} />
                              <strong>{g.supporters.length}</strong>
                              <small>{voted ? "Joined" : "+1"}</small>
                            </button>
                            {mode === "organizer" && (
                              <button
                                className="save"
                                disabled={busy || !room?.canTeach}
                                onClick={() => act("answer", { id: q.group })}
                                title="Mark this question answered"
                              >
                                <Check size={14} /> Mark answered
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
                              <RefreshCw size={14} /> Reopen
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
                        ? "Your answered questions will live here."
                        : "A little space for curiosity."}
                    </h3>
                    <p>
                      {tab === "saved"
                        ? "Mark a question answered to revisit it here."
                        : "Ask a question to start the conversation."}
                    </p>
                  </div>
                )}
              </div>
              <div className="queue-footer">
                <ShieldCheck size={14} /> Original wording is always preserved.
                Votes count unique supporters.
              </div>
            </section>
            <aside className="right-column">
              <section className="composer">
                <div className="section-icon">
                  <Plus size={19} />
                </div>
                <h2>Wondering about something?</h2>
                <p>
                  No raised hands. No names.
                  <br />
                  Just your question or request.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    act("submit", { text });
                  }}
                >
                  <label className="sr-only" htmlFor="question">
                    Your question or request
                  </label>
                  <textarea
                    id="question"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                    placeholder="Ask a question or make a request…"
                    required
                    disabled={!room?.published}
                  />
                  <div className="composer-bottom">
                    <span>{text.length}/500</span>
                    <span>
                      <ShieldCheck size={12} /> Anonymous
                    </span>
                  </div>
                  <button
                    className="primary full"
                    disabled={busy || !text.trim() || !room?.published}
                  >
                    Post to the room <ArrowRight size={16} />
                  </button>
                </form>
                <small className="hint">
                  See your question already? Give it a +1.
                </small>
              </section>
              <section className="engine">
                <div className="engine-heading">
                  <span className="engine-icon">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <strong>Small model. Shared insight.</strong>
                    <span>Powered by TypeSafe Jev</span>
                  </div>
                  <span className="status-dot" />
                </div>
                <p>
                  Questions merge when one useful answer or action can satisfy
                  both.
                </p>
                <div className="engine-facts">
                  <span>
                    Connection{" "}
                    <b>{room?.connected ? "Ready" : "Not configured"}</b>
                  </span>
                  <span>
                    Merge threshold{" "}
                    <b>{Math.round((room?.threshold || 0.7) * 100)}%</b>
                  </span>
                  <span>
                    Last pass{" "}
                    <b>
                      {room?.metrics
                        ? `${(room.metrics.ms / 1000).toFixed(1)}s · ${room.metrics.pairs} new pairs`
                        : "Not run yet"}
                    </b>
                  </span>
                </div>
                <button className="text-link" onClick={() => setInspect(true)}>
                  Inspect the grouping <ArrowUpRight size={14} />
                </button>
              </section>
              <section className="demo-card">
                <div>
                  <FlaskConical size={17} />
                  <span>TRY THE EXPERIMENT</span>
                </div>
                <h3>10 questions. How many answers?</h3>
                <p>
                  Four paraphrase pairs and two distinct questions. Test how
                  well Jev understands the difference.
                </p>
                <button
                  disabled={busy || mode !== "organizer" || !room.canTeach}
                  onClick={() => setResetConfirm(true)}
                >
                  <RefreshCw size={14} /> Reset test questions
                </button>
              </section>
            </aside>
          </div>
          <footer className="page-footer">
            <span>
              MergePoll{" "}
              <span className="muted">/ Curiosity, without the spotlight.</span>
            </span>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">
              Source code · MergePoll
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
              aria-label="Close organizer login"
              onClick={() => {
                setLogin(false);
                setLoginToken("");
              }}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">ORGANIZER ACCESS</div>
            <h2 id="login-title">Welcome back.</h2>
            <p>
              Enter the private organizer token configured by the person hosting
              this room. Participants do not need a token.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void organizerSession();
              }}
            >
              <label htmlFor="organizer-token">Organizer token</label>
              {loginError && (
                <p className="error" role="alert">
                  {loginError}
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
                Sign in <ArrowRight size={16} />
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
              aria-label="Close settings"
              onClick={() => setSettings(false)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">YOUR EVENT</div>
            <h2 id="settings-title">Make room for questions.</h2>
            <p>An event name is all you need. Add context if you like.</p>
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
                Event name <span>Required</span>
              </label>
              <input
                id="course"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
              <label htmlFor="description">
                Event context <span>Optional</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Agenda, session topics, performance details, or event rules…"
              />
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setDescription(
                    title.toLowerCase().includes("climate")
                      ? "Explore weather and climate, greenhouse gases, evidence of human-caused warming, sea-level rise, and everyday climate action."
                      : `An introduction to ${title || "this event"}: what the event covers, what participants can ask or request, and how the organizer will respond.`,
                  )
                }
              >
                <Sparkles size={14} /> Use a starter outline{" "}
                <span className="muted">(template)</span>
              </button>
              <div className="form-row">
                <div>
                  <label htmlFor="interval">Grouping cycle</label>
                  <select
                    id="interval"
                    value={interval}
                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                  >
                    <option value={60}>Every 1 minute</option>
                    <option value={120}>Every 2 minutes · recommended</option>
                    <option value={180}>Every 3 minutes</option>
                    <option value={300}>Every 5 minutes</option>
                    <option value={0}>Manual only</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="threshold">Merge threshold</label>
                  <select
                    id="threshold"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  >
                    <option value={0.7}>
                      70% · shared answers · recommended
                    </option>
                    <option value={0.75}>75% · exploratory</option>
                    <option value={0.85}>85% · balanced</option>
                    <option value={0.95}>95% · conservative</option>
                  </select>
                </div>
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />{" "}
                Publish room · participants can post and vote
              </label>
              <p className="fine-print">
                Automatic passes run while the organizer view is open. Each
                cycle checks for new questions; idle cycles skip Jev and restart
                the timer. This single-room demo has a 30-active-question limit.
              </p>
              <button className="primary full" disabled={busy}>
                Save room <Check size={16} />
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
              aria-label="Close grouping lab"
              onClick={() => setInspect(false)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">
              <FlaskConical size={14} /> GROUPING LAB
            </div>
            <h2 id="lab-title">Different questions. Shared answers.</h2>
            <p>
              Jev judges whether one concise response naturally covers both
              posts. Broader and narrower questions can merge; a shared topic
              alone does not qualify.
            </p>
            <div className="lab-stats">
              <div>
                <strong>
                  {room?.metrics
                    ? `${tp + fp ? Math.round((tp / (tp + fp)) * 100) : 0}%`
                    : "—"}
                </strong>
                <span>Pair precision</span>
              </div>
              <div>
                <strong>
                  {room?.metrics
                    ? `${tp + fn ? Math.round((tp / (tp + fn)) * 100) : 0}%`
                    : "—"}
                </strong>
                <span>Pair recall</span>
              </div>
              <div>
                <strong>6</strong>
                <span>Expected seed groups</span>
              </div>
            </div>
            <p className="fine-print">
              Metrics use only the ten original test questions and their
              predefined equivalence labels. Zero predicted matches displays 0%
              precision. These original labels test paraphrases; the broader
              shared-answer policy can also accept overlap beyond those labels.
              This is a small sanity check, not a general accuracy benchmark.
            </p>
            <div className="lab-settings">
              <span>
                Model <b>{room?.metrics?.model || "jev-1.13.0"}</b>
              </span>
              <span>
                Last request{" "}
                <b>{room?.metrics?.usage?.input_tokens || 0} input tokens</b>
              </span>
              <span>
                Estimated request cost{" "}
                <b>
                  $
                  {(
                    ((room?.metrics?.usage?.input_tokens || 0) * 0.042) /
                    1e6
                  ).toFixed(6)}
                </b>
              </span>
            </div>
            <h3>Test questions & actual groups</h3>
            <div className="lab-questions">
              {seeded.map((q, i) => (
                <div key={q.id}>
                  <span>{i + 1}</span>
                  <p>
                    {q.text}
                    <small>
                      Expected: {samples[Number(q.id.slice(7))][1]} · Actual
                      group: {q.group}
                    </small>
                  </p>
                  <b>
                    {room?.metrics
                      ? q.group !== q.id
                        ? "Merged"
                        : "Representative"
                      : "Unprocessed"}
                  </b>
                </div>
              ))}
            </div>
            <details className="pair-details">
              <summary>
                Inspect all pair probabilities <ChevronDown size={14} />
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
              Complete-link merging: every pair inside a group must clear the
              threshold. Splitting a group blocks its pairs from being
              automatically merged again. Cost is estimated at the documented
              $0.042 per million input tokens; outputs are free.
            </p>
            {mode === "organizer" && (
              <button
                className="primary full"
                disabled={busy}
                onClick={() => act("group")}
              >
                <Sparkles size={16} />
                {busy ? "Evaluating…" : "Run real Jev grouping"}
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
            <h2 id="reset-title">Reset the experiment?</h2>
            <p>
              This replaces the room’s questions, votes, answered history, and
              match history with the ten test questions.
            </p>
            <div className="form-row">
              <button
                className="outline"
                onClick={() => setResetConfirm(false)}
              >
                Keep my questions
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => act("reset")}
              >
                Reset demo
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
