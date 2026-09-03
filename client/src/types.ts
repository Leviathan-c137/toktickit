export interface Requester {
  id: number;
  fullName: string;
  email: string;
  department?: string | null;
  isActive?: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}
