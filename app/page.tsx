import { env } from "cloudflare:workers";
import {
  ArrowRight,
  Layers3,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowUp,
} from "lucide-react";
import { SOURCE_URL } from "../lib/project";
import { BrandIcon } from "./brand-icon";
export const dynamic = "force-dynamic";
export default function Introduction() {
  const demo =
    (env as unknown as { PUBLIC_DEMO?: string }).PUBLIC_DEMO === "true";
  return (
    <div className="intro">
      <nav className="intro-nav">
        <a className="brand" href="/">
          <span className="brand-mark">
            <BrandIcon />
          </span>
          Merge<span>Poll</span>
        </a>
        <a className="outline" href="/room">
          Open demo <ArrowRight size={16} />
        </a>
      </nav>
      <main>
        <section className="intro-hero">
          <div>
            <div className="eyebrow">
              LIVE Q&A & AUDIENCE REQUESTS · AN EXPERIMENT IN SHARED
              UNDERSTANDING
            </div>
            <h1>
              Many ways to ask.
              <br />
              <em>One shared response.</em>
            </h1>
            <p>
              Give every voice a way in. MergePoll brings equivalent questions
              and requests together, so organizers can respond to what their
              audience actually wants.
            </p>
            <div className="intro-ctas">
              <a className="primary" href="/room">
                Try the Climate Change 101 demo <ArrowRight size={17} />
              </a>
              <a href="#how">How it works ↓</a>
            </div>
            <small>
              {demo
                ? "Live experiment · your own browser sandbox · no account or API key needed"
                : "Working prototype · one shared room · participants join without an account"}
            </small>
          </div>
          <div className="merge-example">
            <div className="example-label">ILLUSTRATIVE EXAMPLE</div>
            <div className="example-question">
              <MessageCircle size={17} /> Why is sea level rising?
            </div>
            <div className="example-question">
              <MessageCircle size={17} /> What makes the oceans rise?
            </div>
            <div className="merge-connector">
              <Layers3 size={21} /> Same intent
            </div>
            <div className="example-result">
              <span>
                <CheckCircle2 size={15} /> ONE QUESTION, ORIGINAL WORDING
                PRESERVED
              </span>
              <h3>Why is sea level rising?</h3>
              <p>
                <ArrowUp size={16} /> 2 people want to know
              </p>
            </div>
            <small>
              “How is a carbon footprint measured?” stays separate.
              <br />
              Related subject. Different answer.
            </small>
          </div>
        </section>
        <section className="intro-how" id="how">
          <div className="eyebrow">
            FOR CLASSES, CONFERENCES, CONCERTS & TOWN HALLS
          </div>
          <h2>An audience queue that understands the intent.</h2>
          <div className="steps">
            <article>
              <b>01</b>
              <MessageCircle />
              <h3>Ask without the spotlight</h3>
              <p>
                Participants write in their own words or give an existing
                question a +1. Names stay out of the room.
              </p>
            </article>
            <article>
              <b>02</b>
              <Layers3 />
              <h3>Find the shared response</h3>
              <p>
                TypeSafe Jev judges whether one concise answer or action
                naturally covers both posts, including broader and narrower
                questions. A shared topic alone is insufficient.
              </p>
            </article>
            <article>
              <b>03</b>
              <CheckCircle2 />
              <h3>Answer what matters</h3>
              <p>
                Organizers see a queue ranked by unique supporters, mark
                questions answered, and return to the answer history anytime.
              </p>
            </article>
          </div>
        </section>
        <section className="intro-detail">
          <div>
            <div className="eyebrow">SMALL DECISIONS. VISIBLE REASONING.</div>
            <h2>
              Trust the grouping.
              <br />
              Then challenge it.
            </h2>
            <p>
              Every original question is kept. Inspect pair probabilities in the
              grouping lab, adjust the merge threshold, or split a mistaken
              group. The organizer stays in control.
            </p>
            <p>
              Try ten climate questions: four intended paraphrase pairs and two
              distinct questions. These are test cases, not a claim of universal
              accuracy. At a concert, “Play an encore” and “One more song,
              please” can share a response; requests for different songs should
              stay separate.
            </p>
            <a className="text-link" href="/room">
              Run the experiment <ArrowRight size={16} />
            </a>
          </div>
          <div className="intro-notes">
            <h3>What this prototype does today</h3>
            <p>
              <ShieldCheck size={16} /> Anonymous audience questions and
              requests, with shared votes
            </p>
            <p>
              <Layers3 size={16} /> Real Jev decisions, cached to avoid repeat
              requests
            </p>
            <p>
              <CheckCircle2 size={16} /> Answered history and reversible
              organizer decisions
            </p>
            <hr />
            <small>
              {demo
                ? "Each browser gets a separate sandbox with 12 open questions and three live grouping passes. Grouping is manual, with a one-minute cooldown and a shared daily budget. Use synthetic questions; text is sent to TypeSafe."
                : "Automatic cycles run while organizer view is open. There is one room and a 30-open-question limit. Separate events, QR joining, and large-event scaling are future steps."}
            </small>
          </div>
        </section>
        <section className="intro-invite">
          <div>
            <h2>Bring your questions together.</h2>
            <p>
              Switch between participant and organizer views to explore the full
              flow.
            </p>
          </div>
          <a className="primary" href="/room">
            Enter the live demo <ArrowRight size={17} />
          </a>
        </section>
      </main>
      <footer className="intro-footer">
        <span>MergePoll · Curiosity, without the spotlight.</span>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          View source on GitHub ↗
        </a>
      </footer>
    </div>
  );
}
