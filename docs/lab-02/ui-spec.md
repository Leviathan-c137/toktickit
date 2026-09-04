# Lab 2 User Interface Specification (Zen Green Theme)

## 1. Visual Identity & Design Tokens

TokTickIT adopts the **Zen Green Theme**, conveying reliability, clarity, and university professionalism.

### 1.1. Color Tokens

| Token / Element | Hex Code | Usage & Semantic Purpose |
|---|---|---|
| **Primary Green** | `#006B3C` | App header, primary CTA buttons (`+ Create Ticket`, `Submit Ticket`, `Continue`), brand badges. |
| **Secondary Green** | `#0B7A46` | Active navigation tabs, focus rings, interactive link states, button hover transitions. |
| **Pale Green** | `#EAF6EF` | Selected rows, success alerts, subtle section card headers, `New` / `Resolved` status badges. |
| **Page Background** | `#F5F7F6` | Quiet, glare-free background for all application views. |
| **Surface / Cards** | `#FFFFFF` | Clean card surfaces with subtle neutral border (`#E5E7EB`) and soft drop shadow. |
| **Text Primary** | `#1F2937` | Dark charcoal-green for high-contrast, comfortable readability. |
| **Text Secondary** | `#4B5563` | Subdued metadata, field helper labels, timestamps. |
| **Editable Field** | `#FFFFFF` | Form input backgrounds with clear neutral border (`#D1D5DB`). |
| **Read-Only Field** | `#F0F4F1` | Soft gray-green shading distinctly identifying non-editable elements while maintaining text clarity. |
| **Error** | `#DC2626` | Dark red border, field-level validation messages, error summary banners. |
| **Warning / Notice** | `#D97706` | Amber badges and callout notices (e.g. testing warning banners, file size notices). |
| **Success** | `#16A34A` | Green confirmation banners with checkmark icons. |

### 1.2. Typography & Spacing
- **Font Family**: System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
- **Headings**:
  - `h1`: 1.75rem (28px), Semi-bold (`font-weight: 600`), line-height 1.25.
  - `h2`: 1.25rem (20px), Semi-bold (`font-weight: 600`), line-height 1.3.
  - `h3`: 1.0rem (16px), Medium (`font-weight: 500`), line-height 1.4.
- **Form Controls & Spacing**:
  - Control height: 40px standard for single-line inputs and selects.
  - Textarea height: Min 120px for Description.
  - Input padding: 8px 12px.
  - Border radius: 6px standard (`rounded-md`).
  - Spacing scale: Standard 8px rhythm (4px, 8px, 16px, 24px, 32px).

---

## 2. Component System Conventions

### 2.1. Form Controls & States
1. **Labels**:
   - Rendered directly above input controls.
   - Required fields are marked with a distinct red asterisk `*` (`<span class="text-danger">*</span>`).
2. **Control States**:
   - **Default**: White background, `#D1D5DB` border.
   - **Focus**: `#0B7A46` border with 2px semi-transparent green outline (`box-shadow: 0 0 0 3px rgba(11, 122, 70, 0.2)`).
   - **Invalid**: `#DC2626` border. Validation message appears immediately below the input.
   - **Disabled / Read-Only**: Background `#F0F4F1`, text `#4B5563`, cursor `not-allowed`.
3. **Button Hierarchy**:
   - **Primary**: Background `#006B3C`, text white, hover `#0B7A46`.
   - **Secondary**: White background, border 1px solid `#D1D5DB`, text `#374151`, hover `#F3F4F6`.
   - **Destructive**: Background `#DC2626`, text white, hover `#B91C1C`.
   - **Busy / Loading**: Button is disabled with spinner icon and descriptive text (e.g. `Submitting...`, `Uploading...`).

### 2.2. Badges
- **Status Badges**:
  - `New`: Background `#EAF6EF`, text `#006B3C`, border `#A7F3D0`.
  - `InProgress`: Background `#EFF6FF`, text `#1D4ED8`, border `#BFDBFE`.
  - `Resolved`: Background `#ECFDF5`, text `#047857`, border `#A7F3D0`.
- **Priority Badges**:
  - `Low`: Background `#F3F4F6`, text `#4B5563`.
  - `Medium`: Background `#FEF3C7`, text `#B45309`.
  - `High`: Background `#FFEDD5`, text `#C2410C`.
  - `Urgent`: Background `#FEE2E2`, text `#B91C1C`.

---

## 3. Screen Specifications

### 3.1. Application Shell & Navigation
- **Top Header Bar**:
  - Left: TokTickIT logo icon + "TokTickIT" brand name.
  - Center/Nav: Links to "My Tickets" and "Create Ticket".
  - Right: Development Requester pill showing active user's name + avatar icon, with a "Change" button.
- **Mobile Drawer / Hamburger**: On viewports $< 768$px, navigation collapses into a accessible mobile header toggle.

### 3.2. Screen 1: Development Requester Selection Screen
- **Route**: `/select-requester`
- **Purpose**: Testing context selector simulating login.
- **Elements**:
  - Centered card layout on pale page background.
  - Notice callout: "Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3."
  - Dropdown select showing active requesters (`name - department`).
  - "Continue" primary button.
  - Safe API failure alert if requesters cannot be fetched.

### 3.3. Screen 2: Create Ticket Screen (Create Mode)
- **Route**: `/tickets/new`
- **Layout**:
  - Breadcrumbs: `Home > Create Ticket`
  - Top Section: System-generated read-only info (Requester Name, Date, Status: `New`).
  - Main Fields Grid:
    - Row 1: Category (select) + Related System (select)
    - Row 2: Requested Priority (select: Low/Medium/High/Urgent)
    - Row 3: Ticket Summary (text input, min 5, max 150 chars)
    - Row 4: Description (multiline textarea, min 10, max 2000 chars)
  - Attachments Area:
    - Dropzone / file picker accepting JPG, PNG, WEBP, PDF up to 5 MB.
    - List of staged files with file size, remove button, and validation badges.
  - Actions Bar:
    - "Cancel" button (returns to `/tickets`).
    - "Submit Ticket" primary button with busy spinner.
  - Feedback States:
    - Inline field errors.
    - Server error banner (form data preserved!).
    - Success confirmation modal/banner with official Ticket Number.

### 3.4. Screen 3: My Tickets Screen
- **Route**: `/tickets`
- **Layout**:
  - Top Bar: Page title "My Tickets" + summary count + "+ Create Ticket" CTA.
  - Filter Bar:
    - Search input (Ticket Number or Summary)
    - Category dropdown filter
    - Priority dropdown filter
    - Status dropdown filter
    - "Clear Filters" secondary action
  - Desktop View ($\ge 768$px):
    - Clean table with columns: `Ticket No.`, `Created Date`, `Summary`, `Category`, `Requested Priority`, `IT Priority`, `Status`, `Last Updated`.
    - Clicking a row navigates to Ticket Detail.
  - Mobile View ($< 768$px):
    - Responsive card list displaying primary metadata, summary, badges, and tap target to open detail.
  - Pagination Controls:
    - Showing X of Y tickets, Previous / Next buttons, page indicators.
  - Zero-State Representations:
    - **Empty State**: When user has 0 tickets total ("No tickets yet. Need help from IT? [Create Ticket]").
    - **No-Results State**: When filters yield 0 matches ("No tickets match your search. [Clear Filters]").

### 3.5. Screen 4: Requester Ticket Detail Screen (View Mode)
- **Route**: `/tickets/:id`
- **Layout**:
  - Header: Ticket Number (`TKT-2026-000042`) + Status Badge + Back to My Tickets link.
  - Read-Only Ticket Info Grid: Category, Related System, Requester, Created Date, Requested Priority, IT Priority, Last Updated.
  - Summary and Description displayed in read-only text containers.
  - Attachment Section:
    - Active Attachments list: filename, file size, upload date, "Download" button, "Remove" action button.
    - Soft-Removed Attachments list: filename, removal date, removal reason banner, download disabled/blocked badge.
    - "Add Attachment" button: opens modal/form to upload new files (if active count $< 5$).
    - Soft-removal confirmation modal: requires user to enter removal reason before confirming.
  - Explicit Boundary: No comment forms or IT staff controls are shown.

---

## 4. Responsive Viewport Specifications

| Viewport | Width | Layout Adjustments |
|---|---|---|
| **Desktop** | $\ge 992$px | Max container width 1200px centered; 2-column form grids; full multi-column data table. |
| **Tablet** | $768 - 991$px | Container width 100% with 24px gutters; form inputs adapt to 2 columns where practical; responsive table with scroll or condensed columns. |
| **Mobile** | $< 768$px | Container with 16px gutters; single-column form inputs; My Tickets rendered as mobile card stack; touch targets $\ge 44$px. |

---

## 5. Visual Inspection Checklist

- [ ] All primary actions use `#006B3C` and hover to `#0B7A46`.
- [ ] Active tabs and focus states show green indicators.
- [ ] Read-only fields have distinct pale gray-green background (`#F0F4F1`).
- [ ] Asterisk `*` appears on all mandatory form labels in red `#DC2626`.
- [ ] Error messages display directly beneath erroneous inputs.
- [ ] Submitting buttons display busy spinners and disable clicks.
- [ ] No horizontal scrolling or text clipping on Desktop, Tablet, or Mobile.
- [ ] Empty state and No-results state display correct copy and actions.

---

## 6. Screenshot Artifact Paths

Screenshots for lab submission evidence will be placed in:
- `artifacts/lab-02/screenshots/create-ticket/`
  - `initial-desktop.png`
  - `validation-errors.png`
  - `invalid-attachment.png`
  - `submitting-state.png`
  - `success-confirmation.png`
  - `api-failure-preserved.png`
- `artifacts/lab-02/screenshots/my-tickets/`
  - `requester-a-list.png`
  - `requester-b-list.png`
  - `search-and-filter.png`
  - `empty-state.png`
  - `no-results-state.png`
- `artifacts/lab-02/screenshots/ticket-detail/`
  - `detail-view-desktop.png`
  - `attachment-list-and-download.png`
  - `soft-remove-modal.png`
  - `soft-removed-state.png`
  - `unauthorized-access-denied.png`
- `artifacts/lab-02/screenshots/responsive/`
  - `desktop-view.png`
  - `tablet-view.png`
  - `mobile-view.png`
