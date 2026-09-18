# Lab 3 User Interface Specification (Zen Green Theme)

## 1. Visual Identity & Design Tokens

TokTickIT extends the **Zen Green Theme** introduced in Lab 2, maintaining visual consistency across Requester, IT Staff, and Administrator screens.

### 1.1. Color Tokens

| Token / Element | Hex Code | Usage & Semantic Purpose |
|---|---|---|
| **Primary Green** | `#006B3C` | App header, primary CTA buttons (`Sign In`, `+ Create User`, `Claim Ticket`), brand badges. |
| **Secondary Green** | `#0B7A46` | Active navigation tabs, focus rings, interactive link states, button hover transitions. |
| **Pale Green** | `#EAF6EF` | Selected rows, success alerts, section headers, Public Comment card background. |
| **Amber Accent** | `#FEF3C7` / `#B45309` | Internal Note header, note badge, IT Priority badges (`Medium`). |
| **Page Background** | `#F5F7F6` | Quiet background for all application views. |
| **Surface / Cards** | `#FFFFFF` | Card surfaces with subtle neutral border (`#E5E7EB`) and soft drop shadow. |
| **Text Primary** | `#1F2937` | Dark charcoal for high-contrast readability. |
| **Text Secondary** | `#4B5563` | Metadata, helper text, timestamps. |
| **Editable Field** | `#FFFFFF` | Form input background with neutral border (`#D1D5DB`). |
| **Read-Only Field** | `#F0F4F1` | Soft gray-green shading identifying immutable operational fields. |
| **Error / Alert** | `#DC2626` | Validation messages, error banners, inactive status badge. |
| **Role Pill - Requester** | `#E5E7EB` / `#374151` | Neutral gray badge for Requester role. |
| **Role Pill - IT Staff** | `#DBEAFE` / `#1E40AF` | Light blue badge for IT Staff role. |
| **Role Pill - Admin** | `#FEF3C7` / `#92400E` | Amber badge for Administrator role. |

---

## 2. Component Conventions & Visual Hierarchy

### 2.1. Public Comments vs. Internal Notes Visual Distinction
To prevent accidental public leakage of private operational comments:
- **Public Comments**:
  - Container background: Light green tint (`#F4FBF7`) with `#006B3C` left accent border (3px).
  - Header badge: Green pill `Public Comment` (`#EAF6EF` bg, `#006B3C` text).
  - Author tag: Displays user name and role badge.
- **Internal Notes**:
  - Container background: Light amber tint (`#FFFBEB`) with `#D97706` left accent border (3px).
  - Header badge: Amber pill `Internal Note - Staff Only` (`#FEF3C7` bg, `#92400E` text).
  - Prominent padlock icon indicating internal privacy restriction.

### 2.2. Badges & Status Indicators
- **Ticket Status Badges**:
  - `New`: Background `#EAF6EF`, text `#006B3C`, border `#A7F3D0`.
  - `Open` / `InProgress`: Background `#EFF6FF`, text `#1D4ED8`, border `#BFDBFE`.
  - `Waiting for Requester`: Background `#FEF3C7`, text `#B45309`, border `#FDE68A`.
  - `Resolved` / `Closed`: Background `#ECFDF5`, text `#047857`, border `#A7F3D0`.
  - `Cancelled`: Background `#F3F4F6`, text `#6B7280`, border `#E5E7EB`.
- **Priority Badges**:
  - `Low`: `#F3F4F6` bg, `#4B5563` text.
  - `Medium`: `#FEF3C7` bg, `#B45309` text.
  - `High`: `#FFEDD5` bg, `#C2410C` text.
  - `Urgent`: `#FEE2E2` bg, `#B91C1C` text.

---

## 3. Screen Specifications

### 3.1. Screen 1: Login & Mandatory Password Change
- **Route**: `/login` & `/change-password`
- **Login View**:
  - Center card container on `#F5F7F6` background.
  - Inputs: Email address, Password.
  - Validation: Real-time inline feedback + alert summary for invalid credentials or inactive accounts.
- **Mandatory Password Change View**:
  - Displayed immediately after login when `mustChangePassword == true`.
  - Inputs: Current (Initial) Password, New Password, Confirm New Password.
  - Password Strength Indicator checklist (min 8 chars, uppercase, lowercase, number/special).
  - Disables application navigation header until valid new password is saved.

### 3.2. Screen 2: App Shell Header & Role Navigation
- **App Bar Header**:
  - Brand Logo + "TokTickIT".
  - Dynamic Navigation Links per Role:
    - **Requester**: `My Tickets`, `+ Create Ticket`
    - **IT Staff**: `Ticket Queue`, `My Queue`
    - **Administrator**: `User Management`, `Ticket Queue`
  - User Badge Pill (Right side):
    - User Full Name + Role Pill (`Requester` / `IT Staff` / `Admin`).
    - `Logout` button (ends session and redirects to `/login`).

### 3.3. Screen 3: IT Staff Ticket Queue (`/staff/tickets`)
- **Header Section**: Page Title "IT Staff Ticket Queue" + Active Queue Summary counter.
- **Filter Toolbar**:
  - Search Input: Real-time search across Ticket Number and Summary.
  - Dropdown Filters: Category, IT Priority, Status, Owner (`All`, `Unassigned`, `Assigned to Me`).
  - Sort Dropdown: Created Date (Newest/Oldest), IT Priority, Last Updated.
- **Data Table Layout**:
  - Columns: Ticket No, Created Date, Summary, Category, Requested Priority, IT Priority, Status, Owner, Actions (`View Detail`).
  - Empty & Filter No-Results states with clear illustrations/action buttons.
  - Pagination Controls: Previous/Next buttons, page number buttons, page count text.

### 3.4. Screen 4: IT Staff Ticket Detail (`/staff/tickets/:id`)
- **Breadcrumb Navigation**: `Ticket Queue > Ticket Detail (TKT-YYYY-NNNNNN)`.
- **Top Action Bar**:
  - Claim Ticket button (`Claim Ownership` / `Reassign Owner`).
  - IT Priority Dropdown selector.
  - Status Transition Dropdown selector.
- **Two-Column Grid Layout**:
  - **Left Column (Ticket Content)**: Summary, Description, Requester Info, Attachments, Resolution Summary.
  - **Right Column (Activity & Notes)**:
    - Tab 1: **Public Comments** (Post comment form + comment thread).
    - Tab 2: **Internal Notes** (Post internal note form + note thread).

### 3.5. Screen 5: Administrator User Management (`/admin/users`)
- **Header Section**: "User Management" title + `+ Create New User` button.
- **Filter Toolbar**: Search by Name or Email, Filter by Role (`All`, `Requester`, `IT Staff`, `Admin`).
- **User Data Table**:
  - Columns: Name, Email, Role Pill, Status (`Active` / `Inactive`), Actions (`Edit`, `Reset Password`).
- **Create / Edit User Drawer / Modal**:
  - Inputs: Full Name, Email, Role Select, Active Switch Toggle.
  - Reset Password section with explicit notice: "Sets a new initial password. User must change password on next login."

---

## 4. Responsive & Accessibility Standards

- **Breakpoints**:
  - Desktop: $\ge 992$px (full table views, side-by-side detail columns).
  - Tablet: $768\text{px} - 991\text{px}$ (stacked queue filters, scrollable tables).
  - Mobile: $< 768$px (collapsible hamburger menu, card-based queue item view, full-screen modals).
- **Accessibility**:
  - All interactive elements must have unique `id` attributes.
  - Contrast ratios $\ge 4.5:1$ for all body text and badges.
  - Focus outlines clearly visible (`2px solid #0B7A46`).
