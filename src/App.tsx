import { useState, type ReactNode } from "react";

type Topic = {
  title: string;
  description: string;
  lessons: string[];
  count: number;
  duration: string;
  icon: ReactNode;
  color: string;
  softColor: string;
};

const Icon = ({
  children,
  size = 24,
  className = "",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
  >
    {children}
  </svg>
);

const topics: Topic[] = [
  {
    title: "Functions",
    description: "Understand how quantities relate and change together",
    count: 12,
    duration: "~8 hours",
    color: "#7c5cff",
    softColor: "#eeeaff",
    icon: (
      <Icon size={34}>
        <path d="M4 19V5m0 14h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M6.5 15.5c2.4-.2 3.1-2.4 4.3-5.1C12 7.7 14 6.4 18.5 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="11" cy="10" fill="currentColor" r="1.6" />
      </Icon>
    ),
    lessons: [
      "Function notation and evaluation",
      "Domain and range",
      "Linear, quadratic, and exponential functions",
      "Function transformations",
      "Inverse functions",
      "Composite functions",
    ],
  },
  {
    title: "Algebra",
    description: "Master symbolic manipulation and equation solving",
    count: 14,
    duration: "~10 hours",
    color: "#ef5da8",
    softColor: "#ffeaf5",
    icon: (
      <Icon size={34}>
        <path d="M5 7h14M5 17h14M8 4v6m8-6v6M8 14v6m8-6v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </Icon>
    ),
    lessons: [
      "Polynomial operations",
      "Factoring techniques",
      "Rational expressions",
      "Solving equations and inequalities",
      "Systems of equations",
      "Complex numbers",
    ],
  },
  {
    title: "Trigonometry",
    description: "Explore relationships between angles and sides",
    count: 11,
    duration: "~9 hours",
    color: "#ff9d42",
    softColor: "#fff2e5",
    icon: (
      <Icon size={34}>
        <path d="M4 19 12 5l8 14H4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M9.5 19a5.4 5.4 0 0 1 2.7-4.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </Icon>
    ),
    lessons: [
      "Unit circle and radian measure",
      "Trigonometric ratios",
      "Trigonometric identities",
      "Graphs of trig functions",
      "Solving trigonometric equations",
      "Law of sines and cosines",
    ],
  },
  {
    title: "Geometry",
    description: "Study shapes, spaces, and their properties",
    count: 10,
    duration: "~7 hours",
    color: "#2db7a3",
    softColor: "#e5faf7",
    icon: (
      <Icon size={34}>
        <circle cx="10" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m13.5 6.5 6 3.5-3.2 6.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </Icon>
    ),
    lessons: [
      "Coordinate geometry",
      "Lines and slopes",
      "Circles and conic sections",
      "Geometric proofs",
      "Transformations",
      "3D geometry basics",
    ],
  },
  {
    title: "Statistics",
    description: "Learn to collect, analyze, and interpret data",
    count: 9,
    duration: "~6 hours",
    color: "#3f8cff",
    softColor: "#e8f2ff",
    icon: (
      <Icon size={34}>
        <path d="M5 19V9m7 10V5m7 14v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
        <path d="M3 19h18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </Icon>
    ),
    lessons: [
      "Measures of central tendency",
      "Measures of spread",
      "Data visualization",
      "Normal distribution",
      "Correlation and regression",
      "Statistical inference basics",
    ],
  },
  {
    title: "Probability",
    description: "Quantify uncertainty and predict outcomes",
    count: 8,
    duration: "~6 hours",
    color: "#7857c8",
    softColor: "#f0ebff",
    icon: (
      <Icon size={34}>
        <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="5" />
        <circle cx="9" cy="9" fill="currentColor" r="1.2" />
        <circle cx="15" cy="9" fill="currentColor" r="1.2" />
        <circle cx="9" cy="15" fill="currentColor" r="1.2" />
        <circle cx="15" cy="15" fill="currentColor" r="1.2" />
      </Icon>
    ),
    lessons: [
      "Probability fundamentals",
      "Compound events",
      "Conditional probability",
      "Permutations and combinations",
      "Binomial probability",
      "Expected value",
    ],
  },
];

const paths = [
  ["Functions", "Start here to build a strong foundation in mathematical relationships"],
  ["Algebra", "Develop symbolic reasoning and problem-solving skills"],
  ["Trigonometry", "Apply algebraic skills to circular and periodic phenomena"],
  ["Geometry", "Visualize and prove relationships in space"],
  ["Statistics & Probability", "Apply mathematical thinking to real-world data and uncertainty"],
];

const resources = [
  {
    title: "Formula Explorer",
    text: "Browse formulas, generate examples, and check your answers.",
    label: "Explore formulas",
    href: "explore.html",
    icon: "ƒx",
  },
  {
    title: "Mathematical Reasoning",
    text: "Understand why key mathematical ideas and formulas work.",
    label: "Read explanations",
    href: "proofs.html",
    icon: "∵",
  },
  {
    title: "Worked Examples",
    text: "Practice with generated questions and guided solutions.",
    label: "Start practicing",
    href: "explore.html",
    icon: "✓",
  },
  {
    title: "Curriculum Topics",
    text: "Review the Grade 11 topics and suggested learning path.",
    label: "Review topics",
    href: "#curriculum",
    icon: "∑",
  },
];

function HeroArtwork() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="formula-chip chip-one">a² + b² = c²</div>
      <div className="formula-chip chip-two">sin θ</div>
      <div className="formula-chip chip-three">π</div>
      <div className="art-board">
        <div className="board-dots">
          <i />
          <i />
          <i />
        </div>
        <div className="board-title">y = f(x)</div>
        <svg className="board-graph" viewBox="0 0 220 110">
          <path d="M15 94H210M26 101V10" stroke="rgba(255,255,255,.3)" strokeWidth="2" />
          <path d="M33 85c33 0 28-55 60-55 31 0 34 52 64 52 20 0 27-24 43-57" fill="none" stroke="#ffcd5d" strokeLinecap="round" strokeWidth="5" />
          <circle cx="93" cy="30" fill="#fff" r="5" />
          <circle cx="157" cy="82" fill="#fff" r="5" />
        </svg>
      </div>
      <div className="art-base" />
      <div className="art-books">
        <span />
        <span />
        <span />
      </div>
      <div className="art-pencil" />
    </div>
  );
}

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const exploreTopic = () => {
    const match = topics.find((topic) =>
      topic.title.toLowerCase().includes(search.trim().toLowerCase()),
    );
    if (match) setSelectedTopic(match.title);
    document.querySelector("#curriculum")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="learn-page">

      <main>
        <section className="hero">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow"><span /> Grade 11 curriculum</div>
              <h1>
                Mathematics is
                <br />
                <em>waiting to be explored.</em>
              </h1>
              <p>
                Master the foundations of advanced mathematics through structured lessons,
                visual discovery, and guided exploration.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#curriculum">
                  Explore courses
                  <Icon size={18}>
                    <path d="m7 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </Icon>
                </a>
                <a className="text-button" href="#learning-path">
                  View learning path
                </a>
              </div>
            </div>
            <HeroArtwork />
          </div>

          <div className="course-finder">
            <div>
              <span className="finder-kicker">Not sure where to begin?</span>
              <strong>Find your next mathematics course</strong>
            </div>
            <label className="search-box">
              <Icon size={20}>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              </Icon>
              <input
                aria-label="Search mathematics topics"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && exploreTopic()}
                placeholder="What do you want to learn?"
                value={search}
              />
              <button onClick={exploreTopic} type="button">Search course</button>
            </label>
          </div>
        </section>

        <section className="topic-strip" aria-label="Course topics">
          <span>Explore by topic</span>
          {topics.map((topic) => (
            <a href={`#${topic.title.toLowerCase()}`} key={topic.title}>
              <i style={{ color: topic.color }}>{topic.icon}</i>
              {topic.title}
            </a>
          ))}
        </section>

        <section className="curriculum section" id="curriculum">
          <div className="section-heading reveal">
            <div>
              <span className="section-label">Popular courses</span>
              <h2>Build skills that <em>last.</em></h2>
            </div>
            <p>
              Six carefully structured areas make complex mathematics approachable, useful,
              and rewarding.
            </p>
          </div>

          <div className="topics-grid">
            {topics.map((topic, index) => (
              <article
                className={`topic-card reveal ${selectedTopic === topic.title ? "is-selected" : ""}`}
                id={topic.title.toLowerCase()}
                key={topic.title}
                style={{ "--topic-color": topic.color, "--topic-soft": topic.softColor } as React.CSSProperties}
              >
                <div className="card-cover">
                  <span className="card-number">0{index + 1}</span>
                  <div className="topic-icon">{topic.icon}</div>
                  <div className="cover-formula">
                    {index === 0 && "f(x)"}
                    {index === 1 && "x²"}
                    {index === 2 && "θ"}
                    {index === 3 && "○"}
                    {index === 4 && "μ"}
                    {index === 5 && "P"}
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-tags">
                    <span>{topic.count} lessons</span>
                    <span>{topic.duration}</span>
                  </div>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                  <ul>
                    {topic.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}
                  </ul>
                  <button
                    className="start-button"
                    onClick={() => setSelectedTopic(topic.title)}
                    type="button"
                  >
                    {selectedTopic === topic.title ? "Course selected" : "Start learning"}
                    <Icon size={17}>
                      {selectedTopic === topic.title ? (
                        <path d="m5 12 4 4 10-10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      ) : (
                        <path d="m7 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      )}
                    </Icon>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="learning-path" id="learning-path">
          <div className="path-intro reveal">
            <span className="section-label light">Your roadmap</span>
            <h2>A clear path to mathematical confidence.</h2>
            <p>Follow the sequence from core relationships to real-world data and uncertainty.</p>
            <a href="#path-steps">See the full path <span>↓</span></a>
          </div>
          <div className="path-steps" id="path-steps">
            {paths.map(([title, text], index) => (
              <article className="path-step reveal" key={title}>
                <div className="path-number">{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <span>Step {index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="resources section">
          <div className="section-heading centered reveal">
            <div>
              <span className="section-label">Study resources</span>
              <h2>Everything you need to <em>go further.</em></h2>
            </div>
            <p>Useful tools and clear explanations, designed to support every lesson.</p>
          </div>
          <div className="resources-grid">
            {resources.map((resource, index) => (
              <a className="resource-card reveal" href={resource.href} key={resource.title}>
                <span className={`resource-icon resource-icon-${index + 1}`}>{resource.icon}</span>
                <span className="resource-index">0{index + 1}</span>
                <h3>{resource.title}</h3>
                <p>{resource.text}</p>
                <strong>{resource.label} <span>→</span></strong>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand brand-light" href="index.html">
              <span className="brand-mark">
                <Icon size={23}>
                  <path d="M5 17c3.8-9.6 6.2-9.6 7.7-3.2 1.3 5.5 3 5.3 6.3-4.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </Icon>
              </span>
              <span>The Mathematics <b>Observatory</b></span>
            </a>
            <p>A Grade 11 exploration project for curious minds.</p>
          </div>
          <div className="footer-links">
            <div>
              <h3>Quick links</h3>
              <a href="index.html">Home</a>
              <a href="learn.html">Learn</a>
              <a href="explore.html">Explore</a>
              <a href="history.html">History</a>
              <a href="proofs.html">Why It Works</a>
            </div>
            <div>
              <h3>Resources</h3>
              <a href="index.html#about">About</a>
              <a href="docs/references/G11-General-Mathematics.pdf">Curriculum source</a>
              <a href="explore.html">Formula practice</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 The Mathematics Observatory.</span>
          <span>Created with precision and passion.</span>
        </div>
      </footer>
    </div>
  );
}

