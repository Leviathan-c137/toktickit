export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type TicketStatus =
  | "New"
  | "Open"
  | "InProgress"
  | "Pending"
  | "Resolved"
  | "Closed"
  | "Cancelled";

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

export interface Attachment {
  id: number;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  isRemoved: boolean;
  removedAt?: string | null;
  removalReason?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: Priority;
  itPriority: Priority;
  status: TicketStatus;
  requesterId: number;
  requester: {
    id: number;
    fullName: string;
    email: string;
    department?: string | null;
  };
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
  relatedSystemId: number;
  relatedSystem: {
    id: number;
    name: string;
  };
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  category: {
    id: number;
    name: string;
  };
  relatedSystem: {
    id: number;
    name: string;
  };
  requestedPriority: Priority;
  itPriority: Priority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  activeAttachmentsCount: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTickets {
  items: TicketListItem[];
  pagination: PaginationMetadata;
}

export interface TicketFilters {
  search?: string;
  categoryId?: number;
  requestedPriority?: Priority;
  status?: TicketStatus;
  sortBy?: "createdAt" | "ticketNumber" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

