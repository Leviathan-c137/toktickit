export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type TicketStatus =
  | "New"
  | "Open"
  | "InProgress"
  | "Pending"
  | "WaitingForRequester"
  | "Resolved"
  | "Closed"
  | "Reopened"
  | "Cancelled";

export type Role = "Requester" | "ITStaff" | "Administrator";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  department?: string | null;
  isActive: boolean;
}

export interface PublicComment {
  id: number;
  ticketId: number;
  author: {
    id: number;
    fullName: string;
    role: Role;
    email?: string;
  };
  content: string;
  createdAt: string;
}

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
  actionsTaken?: ActionTaken[];
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

export interface StaffTicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  requestedPriority: Priority;
  itPriority: Priority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: number;
    fullName: string;
    email: string;
    department?: string | null;
  };
  owner: {
    id: number;
    fullName: string;
    email: string;
  } | null;
  category: {
    id: number;
    name: string;
  };
  relatedSystem: {
    id: number;
    name: string;
  };
  _count?: {
    attachments: number;
    publicComments: number;
    internalNotes: number;
  };
}

export interface StaffTicketPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedStaffTickets {
  tickets: StaffTicketItem[];
  pagination: StaffTicketPagination;
}

export interface StaffQueueFilters {
  search?: string;
  categoryId?: number | string;
  status?: string;
  itPriority?: string;
  ownerId?: string | number;
  sortBy?: "createdAt" | "ticketNumber" | "updatedAt" | "itPriority";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface InternalNote {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    fullName: string;
    email?: string;
    role: Role;
  };
}

export interface StaffUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  department?: string | null;
}

export interface StaffTicketDetailData extends StaffTicketItem {
  description: string;
  attachments: Attachment[];
  publicComments?: PublicComment[];
  internalNotes?: InternalNote[];
  actionsTaken?: ActionTaken[];
}

// ---------------------------------------------------------------------------
// Lab 3 Issue 6 — Administrator User Management Types
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  department?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedAdminUsers {
  users: AdminUser[];
  pagination: AdminUserPagination;
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface CreateAdminUserInput {
  fullName: string;
  email: string;
  role: Role;
  department?: string;
  isActive?: boolean;
  initialPassword: string;
}

export interface UpdateAdminUserInput {
  fullName?: string;
  email?: string;
  role?: Role;
  department?: string;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Lab 4 — Actions Taken Types
// ---------------------------------------------------------------------------

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionDateTime: string;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  performedBy: {
    id: number;
    fullName: string;
    email: string;
    role: Role;
  };
}

export interface CreateActionTakenInput {
  description: string;
  result: string;
  actionDateTime?: string;
  followUpRequired?: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
}

export interface UpdateActionTakenInput {
  description?: string;
  result?: string;
  actionDateTime?: string;
  followUpRequired?: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
  expectedUpdatedAt?: string;
}

// ---------------------------------------------------------------------------
// Lab 4 — Dashboard Types (FR-10, FR-11, BR-09, BR-10)
// ---------------------------------------------------------------------------

export interface RequesterDashboardMetrics {
  openTickets: number;
  inProgress: number;
  waitingForRequester: number;
  resolved: number;
  closed: number;
}

export interface RequesterRecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: TicketStatus;
  requestedPriority: Priority;
  category: { id: number; name: string };
  updatedAt: string;
}

export interface RequesterDashboardData {
  metrics: RequesterDashboardMetrics;
  recentTickets: RequesterRecentTicket[];
}

export interface StaffDashboardMetrics {
  newTickets: number;
  openTickets: number;
  inProgressTickets: number;
  waitingForRequesterTickets: number;
  myAssignedTickets: number;
  unassignedTickets: number;
}

export interface StaffRecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: TicketStatus;
  itPriority: Priority;
  requester: { id: number; fullName: string };
  owner?: { id: number; fullName: string } | null;
  updatedAt: string;
}

export interface StaffDashboardData {
  metrics: StaffDashboardMetrics;
  recentTickets: StaffRecentTicket[];
}
