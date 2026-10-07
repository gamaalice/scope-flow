import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FolderKanban,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Target,
  X,
} from "lucide-react";

import { api } from "./services/api";
import type {
  ChangeRequest,
  Project,
  ScopeItem,
} from "./types";

type Page =
  | "dashboard"
  | "projects"
  | "scope"
  | "requests"
  | "analysis";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [darkMode, setDarkMode] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<ChangeRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => project.id === selectedProjectId
      ) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );
  }, [darkMode]);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getProjects();

      setProjects(data);

      if (data.length > 0 && selectedProjectId === null) {
        setSelectedProjectId(data[0].id);
      }
    } catch {
      setError(
        "Não foi possível conectar com a API. Verifique se o backend está rodando."
      );
    } finally {
      setLoading(false);
    }
  }

  async function selectProject(id: number) {
    setSelectedProjectId(id);

    try {
      const [scope, changeRequests] = await Promise.all([
        api.getScopeItems(id),
        api.getChangeRequests(id),
      ]);

      setScopeItems(scope);
      setRequests(changeRequests);
    } catch {
      setError("Não foi possível carregar os dados do projeto.");
    }
  }

  async function openProject(id: number) {
    await selectProject(id);
    setPage("scope");
  }

  async function openRequests(id: number) {
    await selectProject(id);
    setPage("requests");
  }

  async function openAnalysis(request: ChangeRequest) {
    setSelectedRequest(request);

    if (selectedProjectId !== request.projectId) {
      await selectProject(request.projectId);
    }

    setPage("analysis");
  }

  const stats = useMemo(() => {
    const totalRequests = projects.reduce(
      (total, project) =>
        total + (project.changeRequests?.length ?? 0),
      0
    );

    const pendingRequests = requests.filter(
      (request) => request.status === "Pending"
    ).length;

    const outOfScope = requests.filter(
      (request) => request.classification === "OutOfScope"
    ).length;

    return {
      projects: projects.length,
      totalRequests,
      pendingRequests,
      outOfScope,
    };
  }, [projects, requests]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setPage("dashboard")}
        >
          <span className="brand-mark">
            <Sparkles size={17} />
          </span>

          <span>
            <strong>Scope</strong>Flow
          </span>
        </button>

        <nav className="main-nav">
          <NavButton
            active={page === "dashboard"}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </NavButton>

          <NavButton
            active={page === "projects"}
            onClick={() => setPage("projects")}
          >
            Projetos
          </NavButton>

          <NavButton
            active={page === "scope"}
            onClick={() => {
              if (selectedProjectId) {
                selectProject(selectedProjectId);
              }

              setPage("scope");
            }}
          >
            Escopo
          </NavButton>

          <NavButton
            active={
              page === "requests" ||
              page === "analysis"
            }
            onClick={() => {
              if (selectedProjectId) {
                selectProject(selectedProjectId);
              }

              setPage("requests");
            }}
          >
            Solicitações
          </NavButton>
        </nav>

        <div className="topbar-actions">
          <button
            className="icon-button"
            onClick={() => setDarkMode(!darkMode)}
            title={
              darkMode
                ? "Ativar tema claro"
                : "Ativar tema escuro"
            }
          >
            {darkMode ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <CircleAlert size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : (
          <>
            {page === "dashboard" && (
              <Dashboard
                projects={projects}
                stats={stats}
                requests={requests}
                onProjects={() => setPage("projects")}
                onRequests={() => {
                  if (selectedProjectId) {
                    openRequests(selectedProjectId);
                  } else {
                    setPage("projects");
                  }
                }}
                onAnalysis={openAnalysis}
              />
            )}

            {page === "projects" && (
              <ProjectsPage
                projects={projects}
                onOpenProject={openProject}
                onOpenRequests={openRequests}
                onCreated={loadProjects}
              />
            )}

            {page === "scope" && (
              <ScopePage
                project={selectedProject}
                scopeItems={scopeItems}
                onBack={() => setPage("projects")}
                onCreated={async () => {
                  if (selectedProjectId) {
                    await selectProject(selectedProjectId);
                  }
                }}
              />
            )}

            {page === "requests" && (
              <RequestsPage
                project={selectedProject}
                requests={requests}
                onBack={() => setPage("projects")}
                onAnalyze={openAnalysis}
                onCreated={async () => {
                  if (selectedProjectId) {
                    await selectProject(selectedProjectId);
                  }
                }}
              />
            )}

            {page === "analysis" && selectedRequest && (
              <AnalysisPage
                request={selectedRequest}
                project={selectedProject}
                onBack={() => setPage("requests")}
                onUpdated={async (updated) => {
                  setSelectedRequest(updated);

                  if (selectedProjectId) {
                    await selectProject(selectedProjectId);
                  }
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Dashboard({
  projects,
  stats,
  requests,
  onProjects,
  onRequests,
  onAnalysis,
}: {
  projects: Project[];
  stats: {
    projects: number;
    totalRequests: number;
    pendingRequests: number;
    outOfScope: number;
  };
  requests: ChangeRequest[];
  onProjects: () => void;
  onRequests: () => void;
  onAnalysis: (request: ChangeRequest) => void;
}) {
  const recentRequests = requests.slice(0, 4);

  return (
    <section>
      <PageIntro
        eyebrow="VISÃO GERAL"
        title="Controle o escopo sem perder o controle do projeto."
        description="Tenha uma visão rápida do que foi contratado, do que mudou e do que precisa ser analisado."
      />

      <div className="stats-grid">
        <StatCard
          icon={<FolderKanban size={20} />}
          label="Projetos"
          value={stats.projects}
          detail="projetos cadastrados"
        />

        <StatCard
          icon={<Target size={20} />}
          label="Solicitações"
          value={stats.totalRequests}
          detail="mudanças registradas"
        />

        <StatCard
          icon={<Clock3 size={20} />}
          label="Pendentes"
          value={stats.pendingRequests}
          detail="aguardando análise"
          accent
        />

        <StatCard
          icon={<CircleAlert size={20} />}
          label="Fora do escopo"
          value={stats.outOfScope}
          detail="identificadas"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                PROJETOS
              </span>
              <h2>Seus projetos</h2>
            </div>

            <button
              className="text-button"
              onClick={onProjects}
            >
              Ver todos
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="project-list">
            {projects.length === 0 ? (
              <EmptyState
                title="Nenhum projeto ainda"
                description="Crie seu primeiro projeto para começar."
              />
            ) : (
              projects.slice(0, 4).map((project) => (
                <button
                  className="project-row"
                  key={project.id}
                  onClick={() => {
                    onRequests();
                  }}
                >
                  <span className="project-icon">
                    <FolderKanban size={18} />
                  </span>

                  <span className="project-row-info">
                    <strong>{project.name}</strong>
                    <small>{project.clientName}</small>
                  </span>

                  <ChevronRight size={17} />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="panel highlight-panel">
          <span className="panel-kicker">
            FLUXO DE ANÁLISE
          </span>

          <h2>Uma solicitação não precisa virar problema.</h2>

          <p>
            Registre a mudança, estime o impacto e decida
            com clareza se ela está dentro ou fora do escopo.
          </p>

          <div className="flow-steps">
            <FlowStep number="01" text="Solicitação" />
            <FlowStep number="02" text="Análise" />
            <FlowStep number="03" text="Decisão" />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">
              ATIVIDADE
            </span>
            <h2>Solicitações recentes</h2>
          </div>

          <button
            className="text-button"
            onClick={onRequests}
          >
            Ver solicitações
            <ArrowRight size={16} />
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <EmptyState
            title="Nenhuma solicitação registrada"
            description="As solicitações dos seus projetos aparecerão aqui."
          />
        ) : (
          <div className="request-list">
            {recentRequests.map((request) => (
              <button
                className="request-row"
                key={request.id}
                onClick={() => onAnalysis(request)}
              >
                <span>
                  <strong>{request.title}</strong>
                  <small>{request.description}</small>
                </span>

                <StatusBadge
                  status={
                    request.classification === "OutOfScope"
                      ? "OutOfScope"
                      : request.status
                  }
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectsPage({
  projects,
  onOpenProject,
  onOpenRequests,
  onCreated,
}: {
  projects: Project[];
  onOpenProject: (id: number) => void;
  onOpenRequests: (id: number) => void;
  onCreated: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section>
      <PageIntro
        eyebrow="PROJETOS"
        title="Seus projetos"
        description="Organize o que foi contratado e acompanhe as mudanças de cada projeto."
        action={
          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} />
            Novo projeto
          </button>
        }
      />

      {showForm && (
        <ProjectForm
          onCancel={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false);
            await onCreated();
          }}
        />
      )}

      {projects.length === 0 ? (
        <div className="panel empty-panel">
          <EmptyState
            title="Comece criando um projeto"
            description="Você poderá definir o escopo e registrar solicitações de mudança."
          />
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <span className="project-icon large">
                  <FolderKanban size={21} />
                </span>

                <span className="status-dot">
                  Ativo
                </span>
              </div>

              <h2>{project.name}</h2>

              <p>{project.clientName}</p>

              {project.description && (
                <span className="project-description">
                  {project.description}
                </span>
              )}

              <div className="project-meta">
                <div>
                  <small>Contrato</small>
                  <strong>
                    {formatCurrency(project.contractValue)}
                  </strong>
                </div>

                <div>
                  <small>Horas</small>
                  <strong>
                    {project.estimatedHours}h
                  </strong>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    onOpenProject(project.id)
                  }
                >
                  Escopo
                </button>

                <button
                  className="primary-button small"
                  onClick={() =>
                    onOpenRequests(project.id)
                  }
                >
                  Solicitações
                  <ArrowRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ScopePage({
  project,
  scopeItems,
  onBack,
  onCreated,
}: {
  project: Project | null;
  scopeItems: ScopeItem[];
  onBack: () => void;
  onCreated: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!project) {
    return (
      <EmptyProject onBack={onBack} />
    );
  }

  return (
    <section>
      <PageIntro
        eyebrow="ESCOPO"
        title={project.name}
        description={`Escopo contratado para ${project.clientName}.`}
        back={onBack}
        action={
          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} />
            Adicionar item
          </button>
        }
      />

      {showForm && (
        <ScopeForm
          projectId={project.id}
          onCancel={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false);
            await onCreated();
          }}
        />
      )}

      <div className="scope-summary">
        <div className="scope-summary-item">
          <span>Total de itens</span>
          <strong>{scopeItems.length}</strong>
        </div>

        <div className="scope-summary-item">
          <span>Incluídos</span>
          <strong>
            {
              scopeItems.filter(
                (item) => item.isIncluded
              ).length
            }
          </strong>
        </div>

        <div className="scope-summary-item">
          <span>Contrato</span>
          <strong>
            {formatCurrency(project.contractValue)}
          </strong>
        </div>

        <div className="scope-summary-item">
          <span>Horas estimadas</span>
          <strong>
            {project.estimatedHours}h
          </strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">
              ITENS CONTRATADOS
            </span>
            <h2>O que faz parte do escopo?</h2>
          </div>
        </div>

        {scopeItems.length === 0 ? (
          <EmptyState
            title="Nenhum item de escopo"
            description="Adicione os itens que foram combinados com o cliente."
          />
        ) : (
          <div className="scope-list">
            {scopeItems.map((item) => (
              <div className="scope-row" key={item.id}>
                <div className="scope-check">
                  {item.isIncluded ? (
                    <Check size={16} />
                  ) : (
                    <X size={16} />
                  )}
                </div>

                <div>
                  <strong>{item.name}</strong>
                  {item.description && (
                    <small>{item.description}</small>
                  )}
                </div>

                <span
                  className={
                    item.isIncluded
                      ? "included-label"
                      : "excluded-label"
                  }
                >
                  {item.isIncluded
                    ? "Incluído"
                    : "Não incluído"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RequestsPage({
  project,
  requests,
  onBack,
  onAnalyze,
  onCreated,
}: {
  project: Project | null;
  requests: ChangeRequest[];
  onBack: () => void;
  onAnalyze: (request: ChangeRequest) => void;
  onCreated: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!project) {
    return <EmptyProject onBack={onBack} />;
  }

  return (
    <section>
      <PageIntro
        eyebrow="SOLICITAÇÕES"
        title="Mudanças de escopo"
        description={`Solicitações registradas em ${project.name}.`}
        back={onBack}
        action={
          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} />
            Nova solicitação
          </button>
        }
      />

      {showForm && (
        <RequestForm
          projectId={project.id}
          onCancel={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false);
            await onCreated();
          }}
        />
      )}

      <div className="panel">
        {requests.length === 0 ? (
          <EmptyState
            title="Nenhuma solicitação"
            description="Quando o cliente pedir uma mudança, registre aqui para analisar o impacto."
          />
        ) : (
          <div className="requests-table">
            <div className="table-header">
              <span>Solicitação</span>
              <span>Classificação</span>
              <span>Status</span>
              <span>Estimativa</span>
              <span />
            </div>

            {requests.map((request) => (
              <div
                className="table-row"
                key={request.id}
              >
                <div>
                  <strong>{request.title}</strong>
                  <small>{request.description}</small>
                </div>

                <StatusBadge
                  status={request.classification}
                />

                <StatusBadge
                  status={request.status}
                />

                <span className="estimate-cell">
                  {request.estimatedHours
                    ? `${request.estimatedHours}h`
                    : "—"}
                </span>

                <button
                  className="table-action"
                  onClick={() => onAnalyze(request)}
                >
                  Analisar
                  <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysisPage({
  request,
  project,
  onBack,
  onUpdated,
}: {
  request: ChangeRequest;
  project: Project | null;
  onBack: () => void;
  onUpdated: (request: ChangeRequest) => Promise<void>;
}) {
  const [hours, setHours] = useState(
    request.estimatedHours?.toString() ?? ""
  );

  const [cost, setCost] = useState(
    request.estimatedCost?.toString() ?? ""
  );

  const [saving, setSaving] = useState(false);

  async function analyze() {
    if (!project) return;

    setSaving(true);

    try {
      const updated = await api.analyzeChangeRequest(
        project.id,
        request.id,
        {
          estimatedHours: Number(hours),
          estimatedCost: Number(cost),
        }
      );

      await onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: string) {
    if (!project) return;

    setSaving(true);

    try {
      const updated =
        await api.updateChangeRequestStatus(
          project.id,
          request.id,
          status
        );

      await onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageIntro
        eyebrow="ANÁLISE"
        title={request.title}
        description={
          project
            ? `Solicitação em ${project.name}.`
            : "Análise da solicitação."
        }
        back={onBack}
      />

      <div className="analysis-grid">
        <div className="panel analysis-main">
          <div className="analysis-header">
            <div>
              <span className="panel-kicker">
                SOLICITAÇÃO
              </span>

              <h2>{request.title}</h2>
            </div>

            <StatusBadge
              status={request.classification}
            />
          </div>

          <div className="request-description">
            {request.description}
          </div>

          <div className="analysis-form">
            <div className="field">
              <label>Horas estimadas</label>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(event) =>
                    setHours(event.target.value)
                  }
                  placeholder="0"
                />
                <span>horas</span>
              </div>
            </div>

            <div className="field">
              <label>Custo estimado</label>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(event) =>
                    setCost(event.target.value)
                  }
                  placeholder="0,00"
                />
                <span>R$</span>
              </div>
            </div>
          </div>

          <button
            className="primary-button"
            disabled={saving}
            onClick={analyze}
          >
            <BarChart3 size={17} />
            {saving
              ? "Salvando..."
              : "Salvar análise"}
          </button>
        </div>

        <div className="analysis-side">
          <div className="decision-card">
            <span className="panel-kicker">
              DECISÃO
            </span>

            <h3>O que fazer com essa solicitação?</h3>

            <p>
              Depois da análise, você pode aprovar ou
              rejeitar a mudança.
            </p>

            <div className="decision-buttons">
              <button
                className="approve-button"
                disabled={saving}
                onClick={() =>
                  updateStatus("Approved")
                }
              >
                <Check size={17} />
                Aprovar
              </button>

              <button
                className="reject-button"
                disabled={saving}
                onClick={() =>
                  updateStatus("Rejected")
                }
              >
                <X size={17} />
                Rejeitar
              </button>
            </div>
          </div>

          <div className="panel">
            <span className="panel-kicker">
              STATUS ATUAL
            </span>

            <div className="current-status">
              <StatusBadge status={request.status} />
            </div>

            {request.estimatedCost != null && (
              <div className="analysis-result">
                <span>Impacto estimado</span>
                <strong>
                  {formatCurrency(
                    request.estimatedCost
                  )}
                </strong>
                <small>
                  {request.estimatedHours} horas adicionais
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {request.history &&
        request.history.length > 0 && (
          <div className="panel history-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  HISTÓRICO
                </span>
                <h2>O que aconteceu</h2>
              </div>
            </div>

            <div className="history-list">
              {request.history
                .slice()
                .reverse()
                .map((item) => (
                  <div
                    className="history-item"
                    key={item.id}
                  >
                    <span className="history-dot" />

                    <div>
                      <strong>{item.action}</strong>

                      {item.description && (
                        <p>{item.description}</p>
                      )}

                      <small>
                        {formatDate(item.createdAt)}
                      </small>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
    </section>
  );
}

function ProjectForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [estimatedHours, setEstimatedHours] =
    useState("");
  const [deadline, setDeadline] = useState("");

  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);

    try {
      await api.createProject({
        name,
        clientName,
        description,
        contractValue: Number(contractValue),
        estimatedHours: Number(estimatedHours),
        deadline: deadline || undefined,
      });

      await onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      <div className="form-panel-header">
        <div>
          <span className="panel-kicker">
            NOVO PROJETO
          </span>
          <h2>Adicionar projeto</h2>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onCancel}
        >
          <X size={18} />
        </button>
      </div>

      <div className="form-grid">
        <Field
          label="Nome do projeto"
          value={name}
          onChange={setName}
          placeholder="Ex.: Site institucional"
          required
        />

        <Field
          label="Cliente"
          value={clientName}
          onChange={setClientName}
          placeholder="Ex.: Empresa XPTO"
          required
        />

        <Field
          label="Valor do contrato"
          value={contractValue}
          onChange={setContractValue}
          placeholder="5000"
          type="number"
          required
        />

        <Field
          label="Horas estimadas"
          value={estimatedHours}
          onChange={setEstimatedHours}
          placeholder="80"
          type="number"
          required
        />

        <Field
          label="Prazo"
          value={deadline}
          onChange={setDeadline}
          type="date"
        />

        <div className="field full">
          <label>Descrição</label>
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Descreva brevemente o projeto..."
            rows={3}
          />
        </div>
      </div>

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

function ScopeForm({
  projectId,
  onCancel,
  onCreated,
}: {
  projectId: number;
  onCancel: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [isIncluded, setIsIncluded] =
    useState(true);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);

    try {
      await api.createScopeItem(projectId, {
        name,
        description,
        isIncluded,
      });

      await onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      <div className="form-panel-header">
        <div>
          <span className="panel-kicker">
            NOVO ITEM
          </span>
          <h2>Adicionar ao escopo</h2>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onCancel}
        >
          <X size={18} />
        </button>
      </div>

      <div className="form-grid">
        <Field
          label="Nome"
          value={name}
          onChange={setName}
          placeholder="Ex.: Página inicial"
          required
        />

        <div className="field">
          <label>Status</label>

          <select
            value={isIncluded ? "included" : "excluded"}
            onChange={(event) =>
              setIsIncluded(
                event.target.value === "included"
              )
            }
          >
            <option value="included">
              Faz parte do escopo
            </option>

            <option value="excluded">
              Não faz parte do escopo
            </option>
          </select>
        </div>

        <div className="field full">
          <label>Descrição</label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Detalhe o que está incluído..."
            rows={3}
          />
        </div>
      </div>

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

function RequestForm({
  projectId,
  onCancel,
  onCreated,
}: {
  projectId: number;
  onCancel: () => void;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);

    try {
      await api.createChangeRequest(projectId, {
        title,
        description,
      });

      await onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      <div className="form-panel-header">
        <div>
          <span className="panel-kicker">
            NOVA SOLICITAÇÃO
          </span>
          <h2>Registrar mudança</h2>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onCancel}
        >
          <X size={18} />
        </button>
      </div>

      <div className="form-grid">
        <Field
          label="Título"
          value={title}
          onChange={setTitle}
          placeholder="Ex.: Adicionar página de orçamento"
          required
        />

        <div className="field full">
          <label>Descrição</label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Descreva o que o cliente solicitou..."
            rows={4}
            required
          />
        </div>
      </div>

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function FormActions({
  onCancel,
  saving,
}: {
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="secondary-button"
        onClick={onCancel}
      >
        Cancelar
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={saving}
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
  back,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  back?: () => void;
}) {
  return (
    <div className="page-intro">
      <div>
        {back && (
          <button
            className="back-button"
            onClick={back}
          >
            ← Voltar
          </button>
        )}

        <span className="page-eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>

      {action}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card ${accent ? "accent" : ""}`}>
      <div className="stat-card-top">
        <span className="stat-icon">{icon}</span>
        <span>{label}</span>
      </div>

      <strong>{value}</strong>

      <small>{detail}</small>
    </div>
  );
}

function FlowStep({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flow-step">
      <span>{number}</span>
      <strong>{text}</strong>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<string, string> = {
    Pending: "Pendente",
    Analyzed: "Analisado",
    Approved: "Aprovado",
    Rejected: "Rejeitado",
    InScope: "Dentro do escopo",
    OutOfScope: "Fora do escopo",
  };

  const normalized = status
    .toLowerCase()
    .replace("inscope", "in-scope")
    .replace("outofscope", "out-of-scope");

  return (
    <span className={`status-badge ${normalized}`}>
      {labels[status] ?? status}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loader" />
      <span>Carregando ScopeFlow...</span>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <Search size={25} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function EmptyProject({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <div className="panel empty-panel">
      <EmptyState
        title="Nenhum projeto selecionado"
        description="Volte para projetos e escolha um projeto."
      />

      <button
        className="secondary-button"
        onClick={onBack}
      >
        Voltar
      </button>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default App;