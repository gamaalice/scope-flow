import type {
  ChangeRequest,
  Project,
  ScopeItem,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || "Não foi possível concluir a operação."
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  getProjects: () =>
    request<Project[]>("/api/projects"),

  getProject: (id: number) =>
    request<Project>(`/api/projects/${id}`),

  createProject: (data: {
    name: string;
    clientName: string;
    description?: string;
    contractValue: number;
    estimatedHours: number;
    deadline?: string;
  }) =>
    request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getScopeItems: (projectId: number) =>
    request<ScopeItem[]>(
      `/api/projects/${projectId}/scope-items`
    ),

  createScopeItem: (
    projectId: number,
    data: {
      name: string;
      description?: string;
      isIncluded: boolean;
    }
  ) =>
    request<ScopeItem>(
      `/api/projects/${projectId}/scope-items`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  deleteScopeItem: (
    projectId: number,
    id: number
  ) =>
    request<void>(
      `/api/projects/${projectId}/scope-items/${id}`,
      {
        method: "DELETE",
      }
    ),

  getChangeRequests: (projectId: number) =>
    request<ChangeRequest[]>(
      `/api/projects/${projectId}/change-requests`
    ),

  getChangeRequest: (
    projectId: number,
    id: number
  ) =>
    request<ChangeRequest>(
      `/api/projects/${projectId}/change-requests/${id}`
    ),

  createChangeRequest: (
    projectId: number,
    data: {
      title: string;
      description: string;
    }
  ) =>
    request<ChangeRequest>(
      `/api/projects/${projectId}/change-requests`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  deleteChangeRequest: (
    projectId: number,
    id: number
  ) =>
    request<void>(
      `/api/projects/${projectId}/change-requests/${id}`,
      {
        method: "DELETE",
      }
    ),

  analyzeChangeRequest: (
    projectId: number,
    id: number,
    data: {
      estimatedHours: number;
      estimatedCost: number;
    }
  ) =>
    request<ChangeRequest>(
      `/api/projects/${projectId}/change-requests/${id}/analyze`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  updateChangeRequestStatus: (
    projectId: number,
    id: number,
    status: string
  ) =>
    request<ChangeRequest>(
      `/api/projects/${projectId}/change-requests/${id}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status }),
      }
    ),
};