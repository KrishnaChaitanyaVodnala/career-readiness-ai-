import { useState, useRef, useCallback } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// ─── GOOGLE FONTS ─────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ─── SKILLS TAXONOMY ──────────────────────────────────────────────────────
const SKILLS_TAXONOMY = {
  "Artificial Intelligence & ML": {
    icon: "🤖",
    color: "#00FFB2",
    subcategories: {
      "Machine Learning": ["Scikit-learn","XGBoost","LightGBM","CatBoost","Random Forest","SVM","KNN","Naive Bayes","Linear Regression","Logistic Regression"],
      "Deep Learning": ["TensorFlow","PyTorch","Keras","JAX","ONNX","TensorRT","Neural Networks","CNN","RNN","LSTM","Transformer","Diffusion Models"],
      "NLP": ["BERT","GPT","LangChain","HuggingFace","spaCy","NLTK","Tokenization","Embeddings","RAG","Vector Databases"],
      "MLOps": ["MLflow","Kubeflow","Weights & Biases","DVC","BentoML","Seldon","Feature Stores","Model Registry"],
      "Computer Vision": ["OpenCV","YOLO","Detectron2","MediaPipe","SAM","Stable Diffusion","Image Segmentation","Object Detection"],
      "Data Science": ["Pandas","NumPy","Matplotlib","Seaborn","Plotly","Jupyter","Statistics","Hypothesis Testing","A/B Testing"]
    }
  },
  "Web Development": {
    icon: "🌐",
    color: "#FF6B35",
    subcategories: {
      "Frontend": ["React","Vue.js","Angular","Next.js","Svelte","TypeScript","JavaScript","HTML5","CSS3","Tailwind CSS","SASS","Redux","Zustand","GraphQL Client"],
      "Backend": ["Node.js","Express.js","Django","FastAPI","Flask","Spring Boot","Laravel","Ruby on Rails","NestJS","Go/Gin","Rust/Actix"],
      "Full Stack": ["MERN","MEAN","JAMstack","T3 Stack","Remix","Nuxt.js","SvelteKit","Astro"],
      "Web3/Blockchain": ["Solidity","Web3.js","Ethers.js","Hardhat","Truffle","IPFS","Smart Contracts","DeFi Protocols"]
    }
  },
  "Cloud & DevOps": {
    icon: "☁️",
    color: "#4FC3F7",
    subcategories: {
      "Cloud Platforms": ["AWS","Azure","Google Cloud","Oracle Cloud","DigitalOcean","Vercel","Netlify","Heroku"],
      "Containers & Orchestration": ["Docker","Kubernetes","Helm","Istio","OpenShift","ECS","EKS","GKE"],
      "CI/CD": ["GitHub Actions","Jenkins","GitLab CI","CircleCI","ArgoCD","Tekton","Spinnaker"],
      "Infrastructure as Code": ["Terraform","Ansible","Pulumi","CloudFormation","Chef","Puppet"],
      "Monitoring": ["Prometheus","Grafana","Datadog","New Relic","ELK Stack","Jaeger","OpenTelemetry"]
    }
  },
  "Data Engineering": {
    icon: "⚙️",
    color: "#FFD166",
    subcategories: {
      "Data Pipelines": ["Apache Spark","Apache Kafka","Apache Airflow","dbt","Prefect","Dagster","Luigi","Flink"],
      "Databases": ["PostgreSQL","MySQL","MongoDB","Redis","Cassandra","Elasticsearch","Neo4j","ClickHouse","Snowflake","BigQuery","Redshift"],
      "Data Warehousing": ["Snowflake","BigQuery","Redshift","Azure Synapse","Databricks","Delta Lake","Apache Iceberg"]
    }
  },
  "Mobile Development": {
    icon: "📱",
    color: "#B39DDB",
    subcategories: {
      "Cross Platform": ["React Native","Flutter","Ionic","Xamarin","Expo","Capacitor"],
      "iOS": ["Swift","SwiftUI","Objective-C","Xcode","Core Data","ARKit"],
      "Android": ["Kotlin","Java Android","Jetpack Compose","Android SDK","Room DB","Retrofit"]
    }
  },
  "Cybersecurity": {
    icon: "🔐",
    color: "#EF5350",
    subcategories: {
      "Offensive Security": ["Penetration Testing","Metasploit","Burp Suite","Nmap","Wireshark","OSINT","Social Engineering"],
      "Defensive Security": ["SIEM","SOC","Incident Response","Threat Hunting","Malware Analysis","Forensics","Zero Trust"],
      "Compliance": ["ISO 27001","SOC 2","GDPR","HIPAA","PCI-DSS","NIST","OWASP"]
    }
  },
  "Programming Languages": {
    icon: "💻",
    color: "#26C6DA",
    subcategories: {
      "Systems": ["C","C++","Rust","Go","Zig","Assembly"],
      "General Purpose": ["Python","Java","C#","Kotlin","Swift","Ruby","PHP","Scala"],
      "Scripting": ["Bash","PowerShell","Perl","Lua","Groovy"],
      "Functional": ["Haskell","Erlang","Elixir","Clojure","F#","OCaml"]
    }
  },
  "Design & Product": {
    icon: "🎨",
    color: "#FF80AB",
    subcategories: {
      "UI/UX Design": ["Figma","Adobe XD","Sketch","Principle","Framer","Prototyping","Wireframing","Design Systems"],
      "Product Management": ["Agile","Scrum","Kanban","Roadmapping","OKRs","User Research","A/B Testing","Metrics"],
      "3D & Animation": ["Blender","Three.js","WebGL","Unity","Unreal Engine","After Effects","Lottie"]
    }
  },
  "Embedded & IoT": {
    icon: "🔌",
    color: "#66BB6A",
    subcategories: {
      "Embedded Systems": ["Arduino","Raspberry Pi","ESP32","STM32","RTOS","FreeRTOS","Embedded C","FPGA"],
      "IoT Protocols": ["MQTT","CoAP","Zigbee","LoRaWAN","BLE","Z-Wave","Thread","Matter"]
    }
  },
  "Quantum Computing": {
    icon: "⚛️",
    color: "#CE93D8",
    subcategories: {
      "Frameworks": ["Qiskit","Cirq","PennyLane","Q#","Forest SDK","Braket"],
      "Concepts": ["Quantum Gates","Superposition","Entanglement","Quantum Algorithms","Quantum Error Correction"]
    }
  }
};

// ─── WEIGHTS ──────────────────────────────────────────────────────────────
const WEIGHTS = { skills: 30, certificates: 15, projects: 25, internships: 20, resume: 10 };

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── SCORE COLOR ──────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return "#00FFB2";
  if (s >= 60) return "#FFD166";
  if (s >= 40) return "#FF6B35";
  return "#EF5350";
}
function scoreLabel(s) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Needs Work";
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────
function AnimCounter({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const start = performance.now();
    const from = display;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{display}</>;
}

// ─── RADIAL GAUGE ─────────────────────────────────────────────────────────
function RadialGauge({ score, size = 220 }) {
  const color = scoreColor(score);
  const data = [{ value: score, fill: color }];
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="70%" outerRadius="90%" data={data} startAngle={225} endAngle={-45} barSize={16}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#1a1a2e" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-52%)", textAlign: "center"
      }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: size * 0.2, fontWeight: 800, color, lineHeight: 1 }}>
          <AnimCounter value={score} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: size * 0.075, color: "#888", marginTop: 2 }}>/ 100</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: size * 0.09, color, fontWeight: 600, marginTop: 4 }}>
          {scoreLabel(score)}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────
function SectionCard({ children, style = {} }) {
  return (
    <div style={{
      background: "linear-gradient(135deg,#0d1117 0%,#161b22 100%)",
      border: "1px solid #30363d",
      borderRadius: 16,
      padding: "28px 32px",
      ...style
    }}>{children}</div>
  );
}

// ─── PILL TAG ─────────────────────────────────────────────────────────────
function Pill({ label, onRemove, color = "#00FFB2" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: color + "18", border: `1px solid ${color}44`,
      color: color, borderRadius: 20, padding: "4px 12px",
      fontFamily: "'JetBrains Mono',monospace", fontSize: 12, margin: "3px"
    }}>
      {label}
      {onRemove && <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.7, fontSize: 14, lineHeight: 1 }}>×</span>}
    </span>
  );
}

// ─── SCORE BADGE ──────────────────────────────────────────────────────────
function ScoreBadge({ score, loading }) {
  const color = scoreColor(score || 0);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: (color) + "15", border: `1px solid ${color}55`,
      borderRadius: 10, padding: "6px 16px"
    }}>
      {loading
        ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#888" }}>Analyzing…</span>
        : <>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color }}>{score}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#666" }}>/ 100</span>
        </>}
    </div>
  );
}

// ─── STEP INDICATOR ───────────────────────────────────────────────────────
const STEPS = [
  { key: "skills", label: "Skills", icon: "🧠", weight: 30 },
  { key: "certificates", label: "Certs", icon: "🏅", weight: 15 },
  { key: "projects", label: "Projects", icon: "🚀", weight: 25 },
  { key: "internships", label: "Experience", icon: "🏢", weight: 20 },
  { key: "resume", label: "Resume", icon: "📄", weight: 10 },
  { key: "results", label: "Results", icon: "📊", weight: null },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(false);

  // ── Skills state ──
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [openDept, setOpenDept] = useState(null);
  const [openSub, setOpenSub] = useState(null);
  const [experience, setExperience] = useState("0-1");

  // ── Certs state ──
  const [certs, setCerts] = useState([{ name: "", issuer: "", year: "" }]);

  // ── Projects state ──
  const [projects, setProjects] = useState([{ title: "", description: "", github: "", tech: "" }]);

  // ── Internships state ──
  const [internships, setInternships] = useState([{ company: "", role: "", duration: "", achievements: "" }]);

  // ── Resume state ──
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const fileRef = useRef();

  // ─── Computed overall ───
  const overall = Object.keys(WEIGHTS).reduce((sum, k) => {
    if (scores[k] != null) sum += (scores[k] * WEIGHTS[k]) / 100;
    return sum;
  }, 0);
  const overallRounded = Math.round(overall);

  // ─── Skill helpers ───
  const filteredSkills = useCallback(() => {
    if (!skillSearch) return null;
    const q = skillSearch.toLowerCase();
    const results = [];
    Object.entries(SKILLS_TAXONOMY).forEach(([dept, deptData]) => {
      Object.entries(deptData.subcategories).forEach(([sub, skills]) => {
        skills.filter(s => s.toLowerCase().includes(q)).forEach(s => {
          results.push({ skill: s, dept, sub, color: deptData.color });
        });
      });
    });
    return results.slice(0, 20);
  }, [skillSearch]);

  const addSkill = (skill, dept, color) => {
    if (!selectedSkills.find(s => s.skill === skill)) {
      setSelectedSkills(p => [...p, { skill, dept, color }]);
    }
    setSkillSearch("");
  };

  // ─── Score Skills ───
  const scoreSkills = async () => {
    setLoading(true);
    const sys = `You are an expert career coach and ML scoring engine pre-trained on market data for 2024-2025 tech skills. 
Evaluate skills based on: market demand, salary impact, industry prevalence, future relevance, skill depth.
Return ONLY valid JSON. No markdown.`;
    const prompt = `Skills selected: ${selectedSkills.map(s => `${s.skill}(${s.dept})`).join(", ")}
Experience level: ${experience} years.
Return: {"score": <0-100>, "breakdown": {"marketDemand": <0-100>, "diversity": <0-100>, "depth": <0-100>, "futureProof": <0-100>}, "topSkills": [<3 strongest>], "suggestions": [<3 specific improvements>], "summary": "<2 sentences>"}`;
    const res = await callClaude(sys, prompt);
    if (res) { setScores(p => ({ ...p, skills: res.score })); setFeedback(p => ({ ...p, skills: res })); }
    setLoading(false);
  };

  // ─── Score Certs ───
  const scoreCerts = async () => {
    setLoading(true);
    const sys = `You are an expert certification evaluator pre-trained on industry cert rankings, job market data, and hiring trends 2024-2025.
Score based on: issuer prestige, market demand, difficulty, recency, relevance.
Return ONLY valid JSON.`;
    const prompt = `Certifications: ${certs.filter(c => c.name).map(c => `${c.name} by ${c.issuer} (${c.year})`).join("; ")}
Return: {"score": <0-100>, "certRankings": [{"name": "<cert>", "score": <0-100>, "tier": "<elite|high|mid|basic>", "notes": "<why>"}], "suggestions": [<3 improvements>], "summary": "<2 sentences>"}`;
    const res = await callClaude(sys, prompt);
    if (res) { setScores(p => ({ ...p, certificates: res.score })); setFeedback(p => ({ ...p, certificates: res })); }
    setLoading(false);
  };

  // ─── Score Projects ───
  const scoreProjects = async () => {
    setLoading(true);
    const sys = `You are an expert technical project evaluator pre-trained on GitHub metrics, project complexity, and hiring manager preferences.
Score based on: technical complexity, relevance, impact, documentation, tech stack modernity, scale.
Return ONLY valid JSON.`;
    const prompt = `Projects: ${projects.filter(p => p.title).map(p => `Title: ${p.title}. Description: ${p.description}. GitHub: ${p.github}. Tech: ${p.tech}`).join(" | ")}
Return: {"score": <0-100>, "projectRankings": [{"title": "<title>", "score": <0-100>, "complexity": "<high|mid|low>", "notes": "<evaluation>"}], "suggestions": [<3 improvements>], "summary": "<2 sentences>"}`;
    const res = await callClaude(sys, prompt);
    if (res) { setScores(p => ({ ...p, projects: res.score })); setFeedback(p => ({ ...p, projects: res })); }
    setLoading(false);
  };

  // ─── Score Internships ───
  const scoreInternships = async () => {
    setLoading(true);
    const sys = `You are an expert career evaluator pre-trained on company prestige data, role impact metrics, and hiring trends.
Score based on: company tier, role relevance, achievements quality, duration, impact.
Return ONLY valid JSON.`;
    const prompt = `Internships/Experience: ${internships.filter(i => i.company).map(i => `Company: ${i.company}, Role: ${i.role}, Duration: ${i.duration}, Achievements: ${i.achievements}`).join(" | ")}
Return: {"score": <0-100>, "experienceBreakdown": [{"company": "<co>", "score": <0-100>, "tier": "<FAANG|unicorn|startup|other>", "notes": "<eval>"}], "suggestions": [<3 improvements>], "summary": "<2 sentences>"}`;
    const res = await callClaude(sys, prompt);
    if (res) { setScores(p => ({ ...p, internships: res.score })); setFeedback(p => ({ ...p, internships: res })); }
    setLoading(false);
  };

  // ─── Score Resume ───
  const scoreResume = async () => {
    setLoading(true);
    const sys = `You are an ATS expert and resume evaluator pre-trained on 100,000+ resumes, ATS algorithms, and recruiter feedback.
Provide detailed section-by-section ATS scoring.
Return ONLY valid JSON.`;
    const prompt = `Resume content: """${resumeText.slice(0, 3000)}"""
Return: {"score": <0-100>, "atsBreakdown": {"contactInfo": <0-100>, "summary": <0-100>, "experience": <0-100>, "skills": <0-100>, "education": <0-100>, "formatting": <0-100>, "keywords": <0-100>}, "keywordsMissing": [<5 missing important keywords>], "suggestions": [<5 specific improvements>], "summary": "<2 sentences>"}`;
    const res = await callClaude(sys, prompt);
    if (res) { setScores(p => ({ ...p, resume: res.score })); setFeedback(p => ({ ...p, resume: res })); }
    setLoading(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setResumeText(ev.target.result);
    reader.readAsText(file);
  };

  // ─── Bar chart data for final results ───
  const barData = STEPS.slice(0, 5).map(s => ({
    name: s.label,
    score: scores[s.key] || 0,
    weight: s.weight,
    fill: scoreColor(scores[s.key] || 0)
  }));

  const allScored = STEPS.slice(0, 5).every(s => scores[s.key] != null);
  const allSuggestions = STEPS.slice(0, 5).flatMap(s =>
    (feedback[s.key]?.suggestions || []).map(sg => ({ section: s.label, icon: s.icon, text: sg }))
  );

  // ─── STYLES ───
  const S = {
    app: {
      minHeight: "100vh", background: "#060910",
      fontFamily: "'Syne', sans-serif",
      color: "#e6edf3", overflowX: "hidden"
    },
    header: {
      padding: "28px 40px 0",
      display: "flex", alignItems: "center", justifyContent: "space-between"
    },
    logo: {
      display: "flex", alignItems: "center", gap: 14
    },
    logoText: {
      fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22,
      background: "linear-gradient(90deg,#00FFB2,#4FC3F7)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
    },
    stepBar: {
      display: "flex", gap: 0, padding: "28px 40px 0",
      overflowX: "auto", scrollbarWidth: "none"
    },
    stepItem: (active, done) => ({
      display: "flex", alignItems: "center", cursor: done || active ? "pointer" : "default",
      gap: 8, padding: "10px 18px", borderRadius: 12,
      background: active ? "#00FFB218" : done ? "#4FC3F715" : "transparent",
      border: active ? "1px solid #00FFB244" : done ? "1px solid #4FC3F733" : "1px solid transparent",
      transition: "all 0.2s", whiteSpace: "nowrap", marginRight: 8
    }),
    stepNum: (active, done) => ({
      width: 26, height: 26, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: active ? "#00FFB2" : done ? "#4FC3F7" : "#21262d",
      color: active || done ? "#060910" : "#666",
      fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600,
      flexShrink: 0
    }),
    main: { padding: "32px 40px 60px", maxWidth: 900, margin: "0 auto" },
    h2: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, margin: "0 0 6px" },
    sub: { color: "#768390", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, margin: "0 0 28px" },
    input: {
      width: "100%", background: "#0d1117", border: "1px solid #30363d",
      borderRadius: 10, padding: "12px 16px", color: "#e6edf3",
      fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
      outline: "none", boxSizing: "border-box",
      transition: "border-color 0.2s"
    },
    textarea: {
      width: "100%", background: "#0d1117", border: "1px solid #30363d",
      borderRadius: 10, padding: "12px 16px", color: "#e6edf3",
      fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
      outline: "none", boxSizing: "border-box", resize: "vertical"
    },
    label: {
      fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
      color: "#768390", marginBottom: 6, display: "block"
    },
    btn: (variant = "primary") => ({
      padding: "12px 28px", borderRadius: 10, border: "none",
      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14,
      cursor: "pointer", transition: "all 0.2s",
      background: variant === "primary"
        ? "linear-gradient(135deg,#00FFB2,#4FC3F7)"
        : variant === "ghost"
          ? "transparent"
          : "#21262d",
      color: variant === "primary" ? "#060910"
        : variant === "ghost" ? "#768390" : "#e6edf3",
      border: variant === "ghost" ? "1px solid #30363d" : "none"
    }),
    navRow: {
      display: "flex", justifyContent: "space-between",
      alignItems: "center", marginTop: 32
    }
  };

  // ─── SKILL BROWSER ───
  const skillResults = filteredSkills();

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* BG grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(#00FFB208 1px,transparent 1px),linear-gradient(90deg,#00FFB208 1px,transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      {/* Header */}
      <div style={{ ...S.header, position: "relative", zIndex: 1 }}>
        <div style={S.logo}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg,#00FFB2,#4FC3F7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20
          }}>⚡</div>
          <div>
            <div style={S.logoText}>CareerScore AI</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#444", marginTop: -2 }}>
              ML-POWERED READINESS ENGINE
            </div>
          </div>
        </div>
        {allScored && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#768390" }}>Overall</span>
            <ScoreBadge score={overallRounded} />
          </div>
        )}
      </div>

      {/* Step bar */}
      <div style={{ ...S.stepBar, position: "relative", zIndex: 1 }}>
        {STEPS.map((s, i) => {
          const active = step === i;
          const done = scores[s.key] != null || (s.key === "results" && allScored);
          return (
            <div key={s.key} style={S.stepItem(active, done)}
              onClick={() => (done || active || i === 0) && setStep(i)}>
              <div style={S.stepNum(active, done)}>
                {done && !active ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <span style={{
                fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13,
                color: active ? "#00FFB2" : done ? "#4FC3F7" : "#768390"
              }}>{s.label}</span>
              {s.weight && (
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  color: active ? "#00FFB2" : "#444",
                  background: active ? "#00FFB215" : "#21262d",
                  padding: "2px 7px", borderRadius: 6
                }}>{s.weight}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div style={{ ...S.main, position: "relative", zIndex: 1 }}>

        {/* ══════════ STEP 0: SKILLS ══════════ */}
        {step === 0 && (
          <div>
            <h2 style={S.h2}>🧠 Technical Skills</h2>
            <p style={S.sub}>Select all skills you're proficient in. Browse by category or search directly.</p>

            {/* Score badge if scored */}
            {scores.skills != null && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <ScoreBadge score={scores.skills} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#768390" }}>
                  {feedback.skills?.summary}
                </span>
              </div>
            )}

            <SectionCard style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>EXPERIENCE LEVEL</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["0-1","1-3","3-5","5+"].map(y => (
                    <button key={y} onClick={() => setExperience(y)} style={{
                      padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                      background: experience === y ? "#00FFB2" : "#21262d",
                      color: experience === y ? "#060910" : "#768390",
                      fontWeight: experience === y ? 700 : 400
                    }}>{y} yrs</button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <label style={S.label}>SEARCH & ADD SKILLS</label>
              <div style={{ position: "relative" }}>
                <input style={S.input} placeholder="e.g. React, PyTorch, Kubernetes…"
                  value={skillSearch} onChange={e => setSkillSearch(e.target.value)} />
                {skillResults && skillResults.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    background: "#0d1117", border: "1px solid #30363d", borderRadius: 10,
                    marginTop: 4, maxHeight: 260, overflowY: "auto"
                  }}>
                    {skillResults.map((r, i) => (
                      <div key={i} onClick={() => addSkill(r.skill, r.dept, r.color)}
                        style={{
                          padding: "10px 16px", cursor: "pointer", display: "flex",
                          alignItems: "center", gap: 12,
                          borderBottom: "1px solid #21262d"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#161b22"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#e6edf3"
                        }}>{r.skill}</span>
                        <span style={{
                          fontSize: 11, color: r.color, fontFamily: "'JetBrains Mono',monospace",
                          background: r.color + "15", padding: "2px 8px", borderRadius: 6
                        }}>{r.dept}</span>
                        <span style={{ fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono',monospace" }}>{r.sub}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected skills */}
              {selectedSkills.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <label style={S.label}>SELECTED ({selectedSkills.length})</label>
                  <div>{selectedSkills.map(s => (
                    <Pill key={s.skill} label={s.skill} color={s.color}
                      onRemove={() => setSelectedSkills(p => p.filter(x => x.skill !== s.skill))} />
                  ))}</div>
                </div>
              )}
            </SectionCard>

            {/* Dept Browser */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Object.entries(SKILLS_TAXONOMY).map(([dept, deptData]) => (
                <div key={dept} style={{
                  background: "#0d1117", border: `1px solid ${openDept === dept ? deptData.color + "55" : "#21262d"}`,
                  borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s"
                }}>
                  <div style={{
                    padding: "12px 16px", cursor: "pointer", display: "flex",
                    justifyContent: "space-between", alignItems: "center"
                  }} onClick={() => setOpenDept(openDept === dept ? null : dept)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{deptData.icon}</span>
                      <span style={{
                        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
                        color: openDept === dept ? deptData.color : "#e6edf3"
                      }}>{dept}</span>
                    </div>
                    <span style={{ color: "#555", fontSize: 12 }}>{openDept === dept ? "▲" : "▼"}</span>
                  </div>
                  {openDept === dept && (
                    <div style={{ padding: "0 16px 16px" }}>
                      {Object.entries(deptData.subcategories).map(([sub, skills]) => (
                        <div key={sub} style={{ marginBottom: 10 }}>
                          <div style={{
                            fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                            color: "#555", marginBottom: 6, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6
                          }} onClick={() => setOpenSub(openSub === sub ? null : sub)}>
                            {openSub === sub ? "▼" : "▶"} {sub}
                          </div>
                          {openSub === sub && (
                            <div style={{ display: "flex", flexWrap: "wrap" }}>
                              {skills.map(sk => {
                                const selected = selectedSkills.find(s => s.skill === sk);
                                return (
                                  <span key={sk} onClick={() => selected
                                    ? setSelectedSkills(p => p.filter(x => x.skill !== sk))
                                    : addSkill(sk, dept, deptData.color)}
                                    style={{
                                      display: "inline-block", margin: 2,
                                      padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                                      fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                                      background: selected ? deptData.color + "25" : "#161b22",
                                      color: selected ? deptData.color : "#768390",
                                      border: `1px solid ${selected ? deptData.color + "55" : "#30363d"}`,
                                      transition: "all 0.15s"
                                    }}>{sk}</span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={S.navRow}>
              <div />
              <button style={S.btn("primary")} disabled={loading || selectedSkills.length === 0}
                onClick={async () => { await scoreSkills(); setStep(1); }}>
                {loading ? "Analyzing Skills…" : "Analyze & Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 1: CERTIFICATES ══════════ */}
        {step === 1 && (
          <div>
            <h2 style={S.h2}>🏅 Certifications</h2>
            <p style={S.sub}>Enter your certifications. Our AI will rank them against market value data.</p>

            {scores.certificates != null && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <ScoreBadge score={scores.certificates} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#768390" }}>
                  {feedback.certificates?.summary}
                </span>
              </div>
            )}

            {certs.map((cert, i) => (
              <SectionCard key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                    color: "#00FFB2", background: "#00FFB215", padding: "4px 12px", borderRadius: 6
                  }}>CERT #{i + 1}</span>
                  {i > 0 && <button style={{ ...S.btn("ghost"), padding: "4px 12px", fontSize: 12 }}
                    onClick={() => setCerts(p => p.filter((_, j) => j !== i))}>Remove</button>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={S.label}>CERTIFICATION NAME</label>
                    <input style={S.input} placeholder="e.g. AWS Solutions Architect"
                      value={cert.name} onChange={e => setCerts(p => p.map((c, j) => j === i ? { ...c, name: e.target.value } : c))} />
                  </div>
                  <div>
                    <label style={S.label}>ISSUING BODY</label>
                    <input style={S.input} placeholder="e.g. Amazon, Google"
                      value={cert.issuer} onChange={e => setCerts(p => p.map((c, j) => j === i ? { ...c, issuer: e.target.value } : c))} />
                  </div>
                  <div>
                    <label style={S.label}>YEAR OBTAINED</label>
                    <input style={S.input} placeholder="2024"
                      value={cert.year} onChange={e => setCerts(p => p.map((c, j) => j === i ? { ...c, year: e.target.value } : c))} />
                  </div>
                </div>
              </SectionCard>
            ))}

            <button style={{ ...S.btn("ghost"), marginBottom: 24 }}
              onClick={() => setCerts(p => [...p, { name: "", issuer: "", year: "" }])}>
              + Add Another Certification
            </button>

            {/* Cert rankings if scored */}
            {feedback.certificates?.certRankings && (
              <SectionCard style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#00FFB2" }}>
                  Certification Rankings
                </div>
                {feedback.certificates.certRankings.map((cr, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: "1px solid #21262d"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{cr.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#555", marginTop: 2 }}>{cr.notes}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                        color: cr.tier === "elite" ? "#00FFB2" : cr.tier === "high" ? "#4FC3F7" : cr.tier === "mid" ? "#FFD166" : "#768390",
                        background: "#21262d", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase"
                      }}>{cr.tier}</span>
                      <ScoreBadge score={cr.score} />
                    </div>
                  </div>
                ))}
              </SectionCard>
            )}

            <div style={S.navRow}>
              <button style={S.btn("ghost")} onClick={() => setStep(0)}>← Back</button>
              <button style={S.btn("primary")} disabled={loading || !certs.some(c => c.name)}
                onClick={async () => { await scoreCerts(); setStep(2); }}>
                {loading ? "Analyzing…" : "Analyze & Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 2: PROJECTS ══════════ */}
        {step === 2 && (
          <div>
            <h2 style={S.h2}>🚀 Projects</h2>
            <p style={S.sub}>Share your projects. Our AI evaluates complexity, tech stack, and impact.</p>

            {scores.projects != null && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <ScoreBadge score={scores.projects} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#768390" }}>
                  {feedback.projects?.summary}
                </span>
              </div>
            )}

            {projects.map((proj, i) => (
              <SectionCard key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                    color: "#FF6B35", background: "#FF6B3515", padding: "4px 12px", borderRadius: 6
                  }}>PROJECT #{i + 1}</span>
                  {i > 0 && <button style={{ ...S.btn("ghost"), padding: "4px 12px", fontSize: 12 }}
                    onClick={() => setProjects(p => p.filter((_, j) => j !== i))}>Remove</button>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={S.label}>PROJECT TITLE</label>
                    <input style={S.input} placeholder="e.g. AI Resume Analyzer"
                      value={proj.title} onChange={e => setProjects(p => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                  </div>
                  <div>
                    <label style={S.label}>GITHUB / LIVE LINK</label>
                    <input style={S.input} placeholder="https://github.com/..."
                      value={proj.github} onChange={e => setProjects(p => p.map((x, j) => j === i ? { ...x, github: e.target.value } : x))} />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={S.label}>TECH STACK USED</label>
                  <input style={S.input} placeholder="e.g. React, Python, FastAPI, PostgreSQL, Docker"
                    value={proj.tech} onChange={e => setProjects(p => p.map((x, j) => j === i ? { ...x, tech: e.target.value } : x))} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={S.label}>PROJECT DESCRIPTION & IMPACT</label>
                  <textarea style={{ ...S.textarea, minHeight: 80 }}
                    placeholder="Describe what the project does, its scale, challenges solved, and impact (users, performance gains, etc.)"
                    value={proj.description}
                    onChange={e => setProjects(p => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                </div>
              </SectionCard>
            ))}

            <button style={{ ...S.btn("ghost"), marginBottom: 24 }}
              onClick={() => setProjects(p => [...p, { title: "", description: "", github: "", tech: "" }])}>
              + Add Another Project
            </button>

            {feedback.projects?.projectRankings && (
              <SectionCard style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#FF6B35" }}>
                  Project Evaluations
                </div>
                {feedback.projects.projectRankings.map((pr, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #21262d" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 600 }}>{pr.title}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                          color: pr.complexity === "high" ? "#00FFB2" : pr.complexity === "mid" ? "#FFD166" : "#768390",
                          background: "#21262d", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase"
                        }}>{pr.complexity}</span>
                        <ScoreBadge score={pr.score} />
                      </div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#555", marginTop: 4 }}>{pr.notes}</div>
                  </div>
                ))}
              </SectionCard>
            )}

            <div style={S.navRow}>
              <button style={S.btn("ghost")} onClick={() => setStep(1)}>← Back</button>
              <button style={S.btn("primary")} disabled={loading || !projects.some(p => p.title)}
                onClick={async () => { await scoreProjects(); setStep(3); }}>
                {loading ? "Analyzing…" : "Analyze & Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 3: INTERNSHIPS ══════════ */}
        {step === 3 && (
          <div>
            <h2 style={S.h2}>🏢 Experience & Internships</h2>
            <p style={S.sub}>Our AI evaluates company prestige, role impact, and achievement quality.</p>

            {scores.internships != null && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <ScoreBadge score={scores.internships} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#768390" }}>
                  {feedback.internships?.summary}
                </span>
              </div>
            )}

            {internships.map((intern, i) => (
              <SectionCard key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                    color: "#4FC3F7", background: "#4FC3F715", padding: "4px 12px", borderRadius: 6
                  }}>EXPERIENCE #{i + 1}</span>
                  {i > 0 && <button style={{ ...S.btn("ghost"), padding: "4px 12px", fontSize: 12 }}
                    onClick={() => setInternships(p => p.filter((_, j) => j !== i))}>Remove</button>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 14 }}>
                  <div>
                    <label style={S.label}>COMPANY NAME</label>
                    <input style={S.input} placeholder="e.g. Google, Startup XYZ"
                      value={intern.company} onChange={e => setInternships(p => p.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} />
                  </div>
                  <div>
                    <label style={S.label}>ROLE / POSITION</label>
                    <input style={S.input} placeholder="e.g. SWE Intern, ML Research Intern"
                      value={intern.role} onChange={e => setInternships(p => p.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} />
                  </div>
                  <div>
                    <label style={S.label}>DURATION</label>
                    <input style={S.input} placeholder="3 months"
                      value={intern.duration} onChange={e => setInternships(p => p.map((x, j) => j === i ? { ...x, duration: e.target.value } : x))} />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={S.label}>KEY ACHIEVEMENTS & IMPACT</label>
                  <textarea style={{ ...S.textarea, minHeight: 80 }}
                    placeholder="e.g. Built X feature used by Y users, improved performance by Z%, received return offer, won hackathon, published paper…"
                    value={intern.achievements}
                    onChange={e => setInternships(p => p.map((x, j) => j === i ? { ...x, achievements: e.target.value } : x))} />
                </div>
              </SectionCard>
            ))}

            <button style={{ ...S.btn("ghost"), marginBottom: 24 }}
              onClick={() => setInternships(p => [...p, { company: "", role: "", duration: "", achievements: "" }])}>
              + Add Another Experience
            </button>

            {feedback.internships?.experienceBreakdown && (
              <SectionCard style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#4FC3F7" }}>
                  Experience Breakdown
                </div>
                {feedback.internships.experienceBreakdown.map((exp, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #21262d" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{exp.company}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, textTransform: "uppercase",
                          color: exp.tier === "FAANG" ? "#00FFB2" : exp.tier === "unicorn" ? "#FFD166" : "#768390",
                          background: "#21262d", padding: "2px 8px", borderRadius: 6
                        }}>{exp.tier}</span>
                        <ScoreBadge score={exp.score} />
                      </div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#555", marginTop: 4 }}>{exp.notes}</div>
                  </div>
                ))}
              </SectionCard>
            )}

            <div style={S.navRow}>
              <button style={S.btn("ghost")} onClick={() => setStep(2)}>← Back</button>
              <button style={S.btn("primary")} disabled={loading || !internships.some(i => i.company)}
                onClick={async () => { await scoreInternships(); setStep(4); }}>
                {loading ? "Analyzing…" : "Analyze & Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 4: RESUME ══════════ */}
        {step === 4 && (
          <div>
            <h2 style={S.h2}>📄 Resume ATS Analysis</h2>
            <p style={S.sub}>Upload your resume or paste the text. Get a detailed ATS score across all sections.</p>

            {scores.resume != null && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <ScoreBadge score={scores.resume} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#768390" }}>
                  {feedback.resume?.summary}
                </span>
              </div>
            )}

            <SectionCard style={{ marginBottom: 16 }}>
              <label style={S.label}>UPLOAD RESUME (TXT / PDF text)</label>
              <div style={{
                border: "2px dashed #30363d", borderRadius: 12, padding: "32px",
                textAlign: "center", cursor: "pointer", marginBottom: 16,
                transition: "border-color 0.2s"
              }} onClick={() => fileRef.current?.click()}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#00FFB244"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#30363d"}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📤</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, marginBottom: 4 }}>
                  {resumeFile || "Click to upload resume"}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#555" }}>
                  Supports .txt files or paste content below
                </div>
                <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: "none" }} onChange={handleFileUpload} />
              </div>

              <label style={S.label}>OR PASTE RESUME TEXT</label>
              <textarea style={{ ...S.textarea, minHeight: 220 }}
                placeholder="Paste your full resume content here including all sections: Contact, Summary, Experience, Education, Skills, Projects…"
                value={resumeText} onChange={e => setResumeText(e.target.value)} />
            </SectionCard>

            {/* ATS Breakdown */}
            {feedback.resume?.atsBreakdown && (
              <SectionCard style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 18, color: "#FFD166" }}>
                  📊 ATS Section Breakdown
                </div>
                {Object.entries(feedback.resume.atsBreakdown).map(([section, score]) => (
                  <div key={section} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                        textTransform: "uppercase", color: "#768390"
                      }}>{section.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={{
                        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
                        color: scoreColor(score)
                      }}>{score}/100</span>
                    </div>
                    <div style={{ height: 6, background: "#21262d", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${score}%`,
                        background: `linear-gradient(90deg, ${scoreColor(score)}, ${scoreColor(score)}88)`,
                        borderRadius: 3, transition: "width 1s ease"
                      }} />
                    </div>
                  </div>
                ))}
                {feedback.resume.keywordsMissing?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#555", marginBottom: 6 }}>
                      MISSING KEYWORDS
                    </div>
                    <div>{feedback.resume.keywordsMissing.map(kw => (
                      <Pill key={kw} label={kw} color="#EF5350" />
                    ))}</div>
                  </div>
                )}
              </SectionCard>
            )}

            <div style={S.navRow}>
              <button style={S.btn("ghost")} onClick={() => setStep(3)}>← Back</button>
              <button style={S.btn("primary")} disabled={loading || !resumeText.trim()}
                onClick={async () => { await scoreResume(); setStep(5); }}>
                {loading ? "Analyzing Resume…" : "Analyze & View Results →"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 5: RESULTS ══════════ */}
        {step === 5 && (
          <div>
            <h2 style={S.h2}>📊 Career Readiness Report</h2>
            <p style={S.sub}>Your comprehensive ML-powered career readiness assessment.</p>

            {/* Main score + bar chart */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              {/* Overall gauge */}
              <SectionCard style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#555", marginBottom: 12, textTransform: "uppercase" }}>
                  Overall Career Readiness
                </div>
                <RadialGauge score={overallRounded} size={200} />
                <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                  {STEPS.slice(0, 5).map(s => (
                    <div key={s.key} style={{ textAlign: "center" }}>
                      <Pill label={`${s.label}: ${scores[s.key] || 0}`}
                        color={scoreColor(scores[s.key] || 0)} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Bar chart */}
              <SectionCard>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#555", marginBottom: 16, textTransform: "uppercase" }}>
                  Component Breakdown
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fill: "#768390", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}
                      labelStyle={{ color: "#e6edf3" }}
                      itemStyle={{ color: "#768390" }}
                      formatter={(v, n, props) => [`${v}/100 (weight: ${props.payload.weight}%)`, "Score"]}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* Weighted score breakdown */}
            <SectionCard style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 18, color: "#e6edf3" }}>
                Weighted Score Calculation
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {STEPS.slice(0, 5).map(s => {
                  const raw = scores[s.key] || 0;
                  const weighted = ((raw * s.weight) / 100).toFixed(1);
                  const color = scoreColor(raw);
                  return (
                    <div key={s.key} style={{
                      background: color + "08", border: `1px solid ${color}22`,
                      borderRadius: 12, padding: "16px 12px", textAlign: "center"
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, color: "#768390", marginBottom: 8 }}>
                        {s.label.toUpperCase()}
                      </div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{raw}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#444", marginTop: 2 }}>raw score</div>
                      <div style={{ margin: "8px 0", height: 1, background: "#21262d" }} />
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#768390" }}>
                        ×{s.weight}% =
                      </div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color, marginTop: 2 }}>{weighted}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                marginTop: 16, padding: "16px 20px",
                background: scoreColor(overallRounded) + "10",
                border: `1px solid ${scoreColor(overallRounded)}33`,
                borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>
                  Total Career Readiness Score
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{
                    fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 42,
                    color: scoreColor(overallRounded)
                  }}><AnimCounter value={overallRounded} /></span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#555", fontSize: 16 }}>/100</span>
                </div>
              </div>
            </SectionCard>

            {/* Improvement suggestions */}
            {allSuggestions.length > 0 && (
              <SectionCard style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 18 }}>
                  🎯 Personalized Improvement Plan
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {allSuggestions.map((s, i) => (
                    <div key={i} style={{
                      background: "#0d1117", border: "1px solid #21262d",
                      borderRadius: 10, padding: "14px 16px",
                      display: "flex", gap: 12, alignItems: "flex-start"
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                      <div>
                        <div style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                          color: "#555", textTransform: "uppercase", marginBottom: 4
                        }}>{s.section}</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, lineHeight: 1.5, color: "#c9d1d9" }}>
                          {s.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Readiness tier */}
            <SectionCard>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>
                  {overallRounded >= 80 ? "🏆" : overallRounded >= 60 ? "🚀" : overallRounded >= 40 ? "📈" : "🌱"}
                </div>
                <div style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24,
                  color: scoreColor(overallRounded), marginBottom: 8
                }}>
                  {overallRounded >= 80 ? "Job-Ready Champion" :
                    overallRounded >= 60 ? "Strong Candidate" :
                      overallRounded >= 40 ? "Developing Professional" : "Early Career Builder"}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#768390", maxWidth: 500, margin: "0 auto" }}>
                  {overallRounded >= 80
                    ? "You're highly competitive for senior roles. Focus on specialization and leadership skills."
                    : overallRounded >= 60
                      ? "You're competitive for most roles. Strengthen weaker areas to stand out in interviews."
                      : overallRounded >= 40
                        ? "You have a solid foundation. Prioritize the improvement suggestions to accelerate growth."
                        : "Great start! Focus on building core skills, getting internship experience, and personal projects."}
                </div>
                <button style={{ ...S.btn("primary"), marginTop: 20 }}
                  onClick={() => { setStep(0); }}>
                  ↺ Start New Assessment
                </button>
              </div>
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  );
}
