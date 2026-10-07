export interface Project {
  id: number;
  name: string;
  clientName: string;
  description?: string;
  contractValue: number;
  estimatedHours: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  scopeItems?: ScopeItem[];
  changeRequests?: ChangeRequest[];
}

export interface ScopeItem {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  isIncluded: boolean;
  createdAt: string;
}

export interface ChangeRequest {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  classification: string;
  estimatedHours?: number;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
  history?: ChangeRequestHistory[];
}

export interface ChangeRequestHistory {
  id: number;
  changeRequestId: number;
  action: string;
  description?: string;
  createdAt: string;
}