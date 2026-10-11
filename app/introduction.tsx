"use client";
import { useLanguage, LanguageSwitch } from "./language";
import {
  ArrowRight,
  Layers3,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowUp,
} from "lucide-react";
import { SOURCE_URL } from "../lib/project";
import { GithubIcon } from "./github-icon";
import { BrandIcon } from "./brand-icon";

export default function Introduction({ demo }: { demo: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="intro">
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
          <GithubIcon size={19} /> GitHub <span>{t("Source code ↗")}</span>
        </a>
        <div className="nav-actions">
          <LanguageSwitch />
          <a className="outline" href="/room">
            {t("Open demo")}
            <ArrowRight size={16} />
          </a>
        </div>
      </nav>
      <main>
        <section className="intro-hero">
          <div>
            <div className="eyebrow">
              {t(
                "LIVE Q&A & AUDIENCE REQUESTS · AN EXPERIMENT IN SHARED UNDERSTANDING",
              )}
            </div>
            <h1>
              {t("Many ways to ask.")}
              <br />
              <em>{t("One shared response.")}</em>
            </h1>
            <p>
              {t(
                "Give every voice a way in. MergePoll brings equivalent questions and requests together, so organizers can respond to what their audience actually wants.",
              )}
            </p>
            <div className="intro-ctas">
              <a className="primary" href="/room">
                {t("Try the Climate Change 101 demo")}
                <ArrowRight size={17} />
              </a>
              <a className="outline own-task" href="/new">
                {t("Try it with your own task")}
                <ArrowRight size={17} />
              </a>
              <a href="#how">{t("How it works ↓")}</a>
            </div>
            <small>
              {demo
                ? t(
                    "Live experiment · your own browser sandbox · no account or API key needed",
                  )
                : t(
                    "Working prototype · one shared room · participants join without an account",
                  )}
            </small>
          </div>
          <div className="merge-example">
            <div className="example-label">{t("ILLUSTRATIVE EXAMPLE")}</div>
            <div className="example-question">
              <MessageCircle size={17} /> {t("Why is sea level rising?")}
            </div>
            <div className="example-question">
              <MessageCircle size={17} /> {t("What makes the oceans rise?")}
            </div>
            <div className="merge-connector">
              <Layers3 size={21} /> {t("Same intent")}
            </div>
            <div className="example-result">
              <span>
                <CheckCircle2 size={15} />{" "}
                {t("ONE QUESTION, ORIGINAL WORDING PRESERVED")}
              </span>
              <h3>{t("Why is sea level rising?")}</h3>
              <p>
                <ArrowUp size={16} /> {t("2 people want to know")}
              </p>
            </div>
            <small>
              {t("“How is a carbon footprint measured?” stays separate.")}
              <br />
              {t("Related subject. Different answer.")}
            </small>
          </div>
        </section>
        <section className="intro-how" id="how">
          <div className="eyebrow">
            {t("FOR CLASSES, CONFERENCES, CONCERTS & TOWN HALLS")}
          </div>
          <h2>{t("An audience queue that understands the intent.")}</h2>
          <div className="steps">
            <article>
              <b>01</b>
              <MessageCircle />
              <h3>{t("Ask without the spotlight")}</h3>
              <p>
                {t(
                  "Participants write in their own words or give an existing question a +1. Names stay out of the room.",
                )}
              </p>
            </article>
            <article>
              <b>02</b>
              <Layers3 />
              <h3>{t("Find the shared response")}</h3>
              <p>
                {t(
                  "TypeSafe Jev judges whether one concise answer or action naturally covers both posts, including broader and narrower questions. A shared topic alone is insufficient.",
                )}
              </p>
            </article>
            <article>
              <b>03</b>
              <CheckCircle2 />
              <h3>{t("Answer what matters")}</h3>
              <p>
                {t(
                  "Organizers see a queue ranked by unique supporters, mark questions answered, and return to the answer history anytime.",
                )}
              </p>
            </article>
          </div>
        </section>
        <section className="intro-detail">
          <div>
            <div className="eyebrow">
              {t("SMALL DECISIONS. VISIBLE REASONING.")}
            </div>
            <h2>
              {t("Trust the grouping.")}
              <br />
              {t("Then challenge it.")}
            </h2>
            <p>
              {t(
                "Every original question is kept. Inspect pair probabilities in the grouping lab, adjust the merge threshold, or split a mistaken group. The organizer stays in control.",
              )}
            </p>
            <p>
              {t(
                "Try ten climate questions: four intended paraphrase pairs and two distinct questions. These are test cases, not a claim of universal accuracy. At a concert, “Play an encore” and “One more song, please” can share a response; requests for different songs should stay separate.",
              )}
            </p>
            <a className="text-link" href="/room">
              {t("Run the experiment")}
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="intro-notes">
            <h3>{t("What this prototype does today")}</h3>
            <p>
              <ShieldCheck size={16} />{" "}
              {t(
                "Anonymous audience questions and requests, with shared votes",
              )}
            </p>
            <p>
              <Layers3 size={16} />{" "}
              {t("Real Jev decisions, cached to avoid repeat requests")}
            </p>
            <p>
              <CheckCircle2 size={16} />{" "}
              {t("Answered history and reversible organizer decisions")}
            </p>
            <hr />
            <small>
              {demo
                ? t(
                    "Each browser gets a separate sandbox with 100 questions per task and ten live grouping passes. Grouping is manual, with a one-minute cooldown and a shared daily budget. Use synthetic questions; text is sent to TypeSafe.",
                  )
                : t(
                    "Automatic cycles run while organizer view is open. There is one shared room with no application question-count or grouping quota. Separate events, QR joining, and large-event scaling are future steps.",
                  )}
            </small>
          </div>
        </section>
        <section className="intro-invite">
          <div>
            <h2>{t("Bring your questions together.")}</h2>
            <p>
              {t(
                "Switch between participant and organizer views to explore the full flow.",
              )}
            </p>
          </div>
          <a className="primary" href="/room">
            {t("Enter the live demo")}
            <ArrowRight size={17} />
          </a>
        </section>
      </main>
      <footer className="intro-footer">
        <span>{t("MergePoll · Curiosity, without the spotlight.")}</span>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          {t("View source on GitHub ↗")}
        </a>
      </footer>
    </div>
  );
}
