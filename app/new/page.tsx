"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { GithubIcon } from "../github-icon";
import { BrandIcon } from "../brand-icon";
import { SOURCE_URL } from "../../lib/project";
import { useLanguage, LanguageSwitch } from "../language";
export default function NewTask() {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [demo, setDemo] = useState(true);
  const [ready, setReady] = useState(false);
  const [canTeach, setCanTeach] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/room", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as {
          error?: string;
          publicDemo?: boolean;
          canTeach: boolean;
        };
        if (!r.ok) throw new Error(d.error);
        setDemo(!!d.publicDemo);
        setCanTeach(d.canTeach);
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="intro setup-page">
      <nav className="intro-nav">
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
          <GithubIcon size={19} /> {t("GitHub · Source code ↗")}
        </a>
        <LanguageSwitch />
      </nav>
      <main className="setup-main">
        <div className="section-icon">
          <Plus size={24} />
        </div>
        <div className="eyebrow">{t("YOUR OWN TASK")}</div>
        <h1>{t("Make room for your audience.")}</h1>
        <p>
          {t(
            "Start with a name. Add a little context so related questions find the right shared response.",
          )}
        </p>
        <form
          className="setup-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const r = await fetch("/api/room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "start",
                  title,
                  description,
                  interval: 0,
                  threshold: 0.7,
                  published: true,
                }),
              });
              const d = (await r.json()) as {
                error?: string;
                publicDemo?: boolean;
                canTeach: boolean;
              };
              if (!r.ok) throw new Error(d.error);
              location.assign("/room");
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          }}
        >
          <label htmlFor="task-title">
            {t("Event or task name")}
            <span>{t("Required")}</span>
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            placeholder={t("Workshop, team Q&A, song requests…")}
          />
          <label htmlFor="task-context">
            {t("Context")}
            <span>{t("Optional")}</span>
          </label>
          <textarea
            id="task-context"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            placeholder={t(
              "What is this event about? What can people ask or request?",
            )}
          />
          <small>{description.length}/2000</small>
          <div className="notice">
            {demo
              ? t(
                  "Hosted trial: 100 questions per task, 500 characters each. Ten live grouping passes per browser session, one minute apart, plus shared daily budgets. Starting a task preserves used model allowances. Each browser has its own sandbox; this is not a shared event link.",
                )
              : t(
                  "Docker: one shared room, your own TypeSafe key, no application question-count or grouping quota. Each question can contain up to 500 characters.",
                )}
          </div>
          <p className="fine-print">
            {t(
              "Creating this task replaces the current room’s questions, votes and history. Nothing changes until you click Create task.",
            )}
          </p>
          {ready && !canTeach && (
            <p>
              <a href="/room">
                {t("Sign in as the organizer to create a task.")}
              </a>
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {t(error)}
            </p>
          )}
          <button
            className="primary full"
            disabled={!ready || !canTeach || busy || !title.trim()}
          >
            {busy ? t("Creating…") : t("Create task")}
            <ArrowRight size={17} />
          </button>
          <a className="text-link" href="/room">
            {t("Return to the current room")}
          </a>
        </form>
      </main>
    </div>
  );
}
