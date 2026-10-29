# Lab 4 User Interface Specification (Zen Green Theme)

## 1. Visual Identity & Design Tokens

TokTickIT preserves and deepens the **Zen Green Theme** established in Lab 2 and Lab 3. The interface emphasizes clarity, calm operational efficiency, role-based visual hierarchies, and strict WCAG 2.1 AA accessibility standards.

### 1.1. Color Tokens & Semantic Usage

| Token / Element | Hex Code | Usage & Semantic Purpose |
|---|---|---|
| **Primary Brand Green** | `#006B3C` | App header, primary CTAs (`+ Add Action Taken`, `Create Ticket`), brand indicators. |
| **Secondary Accent Green**| `#0B7A46` | Interactive hover states, active navigation tabs, focused inputs. |
| **Soft Surface Green** | `#EAF6EF` | Selected rows, success banners, positive status pill backgrounds. |
| **Background Quiet** | `#F5F7F6` | Universal page background providing low-fatigue contrast. |
| **Card Surface** | `#FFFFFF` | Elevated surfaces with neutral border (`#E5E7EB`) and subtle shadow (`0 1px 3px rgba(0,0,0,0.06)`). |
| **Text Primary** | `#1F2937` | High-contrast dark charcoal for primary content and labels. |
| **Text Secondary** | `#4B5563` | Subtitles, helper text, and secondary timestamps. |
| **Text Muted** | `#6B7280` | Tertiary metadata and disabled placeholders. |
| **Follow-Up Amber Accent**| `#FEF3C7` / `#B45309` | Follow-up required badges, pending follow-up cards, and reminder notes. |
| **Action Performed Pill** | `#DBEAFE` / `#1E40AF` | IT Staff performer identity pill in Actions Taken entries. |

### 1.2. Metric Card Semantic Palettes

| Metric Status | Counter Text | Card Accent Border | Light Tint Background |
|---|---|---|---|
| **New** | `#006B3C` | `#10B981` | `#ECFDF5` |
| **Open** | `#1D4ED8` | `#3B82F6` | `#EFF6FF` |
| **In Progress** | `#2563EB` | `#60A5FA` | `#F0F9FF` |
| **Waiting for Requester** | `#B45309` | `#F59E0B` | `#FFFBEB` |
| **My Assigned** | `#4338CA` | `#6366F1` | `#EEF2FF` |
| **Resolved** | `#047857` | `#059669` | `#ECFDF5` |
| **Closed** | `#4B5563` | `#9CA3AF` | `#F3F4F6` |

---

## 2. Component Conventions

### 2.1. Operational Metric Cards
- **Structure**: Rounded rectangular card (`border-radius: 12px`), elevated on `#FFFFFF`, with a 4px top or left accent border color corresponding to the status.
- **Content**:
  - Small uppercase label (`font-size: 0.75rem`, `font-weight: 600`, `letter-spacing: 0.05em`).
  - Large numerical count (`font-size: 2.25rem`, `font-weight: 700`, tabular numerals).
  - Secondary context label or subtext (e.g., "Assigned to me" or "Active in queue").
  - Drill-down click cue: Subtle arrow icon or underline on hover.
- **Interaction**:
  - Hover: Elevation increases (`transform: translateY(-2px)`, shadow intensifies).
  - Focus: Clear 2px outline in Secondary Green (`#006B3C`) with 2px offset.
  - Click: Seamlessly navigates to the ticket list with appropriate pre-filtered query parameters.

### 2.2. Actions Taken Sub-Section on Ticket Detail
- **Header**:
  - Title: "Actions Taken" with item counter badge.
  - Action CTA: "+ Add Action Taken" button (rendered only for IT Staff and Administrator roles; hidden for Requesters).
- **List / Table Presentation**:
  - Chronological list of past actions with stable sorting.
  - Columns / Fields:
    1. **Date/Time**: Formatted local date and time.
    2. **Performed By**: User badge pill showing IT Staff name and role.
    3. **Description**: Clear description of technical tasks performed.
    4. **Result**: Outcome of the action.
    5. **Follow-Up Badge**: Amber badge "Follow-Up Required" if checked, accompanied by `followUpNote`.
    6. **Attachment Notes**: Note indicating referenced diagnostic images or logs.
    7. **Edit Action**: "Edit" button for IT Staff and Admin.
- **Requester Mode**:
  - Requesters see all completed actions clearly formatted for transparency.
  - No "+ Add Action Taken" or "Edit" buttons are rendered.
  - Explicit read-only badge indicating "Actions recorded by IT Staff".

### 2.3. Modal / Drawer for Creating & Editing Actions Taken
- **Inputs**:
  - Action Date/Time (defaults to current date-time picker).
  - Action Description (textarea, required, min 5 chars).
  - Result (textarea, required, min 3 chars).
  - Follow-Up Required (checkbox / toggle switch).
  - Follow-Up Note (textarea, conditionally required if toggle is ON; validation error displayed if empty).
  - Attachment Notes (optional text input).
- **Validation & Safe Failure**:
  - Real-time inline feedback preventing form submission until all mandatory fields are valid.
  - Submit button shows loading spinner during transit to prevent double-click submissions.

### 2.4. Ticket Status Workflow Controls
- Status dropdown / buttons displaying exclusively permitted next states according to BR-06.
- Clear confirmation dialog if moving to terminal/irreversible states (`Cancelled` or `Closed`).
- Resolution gate: If Requester is viewing, status dropdown is disabled or absent; only "Problem Appears Resolved" advisory toggle is present.

---

## 3. Screen Layouts & Specifications

### 3.1. IT Staff Dashboard (`/staff/dashboard`)
```
+-----------------------------------------------------------------------------------+
|  [Logo] TokTickIT    Dashboard    Ticket Queue    My Queue         [User: IT Staff v] |
+-----------------------------------------------------------------------------------+
|  Welcome back, Michael!                                            [ Refresh Data ]|
|  Here is what's happening with your queue today:                                  |
|                                                                                   |
|  +-------------+  +-------------+  +-------------+  +-------------+  +-------------+  |
|  | NEW         |  | OPEN        |  | IN PROGRESS |  | WAITING REQ |  | MY ASSIGNED |  |
|  |     14      |  |     23      |  |     18      |  |      7      |  |     16      |  |
|  | [View all]  |  | [View all]  |  | [View all]  |  | [View all]  |  | [View all]  |  |
|  +-------------+  +-------------+  +-------------+  +-------------+  +-------------+  |
|                                                                                   |
|  +---------------------------------------------+  +-------------------------------+  |
|  | My Recent Tickets               [ View all ] |  | Quick Actions                 |  |
|  |---------------------------------------------|  |-------------------------------|  |
|  | TXT-001  Laptop battery dying   [In Prog]   |  | [+] Create Ticket             |  |
|  | TXT-002  VPN connection drops   [Open]      |  | [Q] Search Tickets            |  |
|  | TXT-003  Printer offline        [Resolved]  |  | [B] My Queue                  |  |
|  +---------------------------------------------+  +-------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### 3.2. Requester Dashboard (`/requester/dashboard`)
```
+-----------------------------------------------------------------------------------+
|  [Logo] TokTickIT    Dashboard    My Tickets    + Create Ticket     [User: Jennifer v] |
+-----------------------------------------------------------------------------------+
|  Welcome back, Jennifer!                                           [ Refresh Data ]|
|  Here is the latest on your service requests:                                     |
|                                                                                   |
|  +----------------+  +----------------+  +----------------+  +----------------+  |
|  | MY OPEN        |  | IN PROGRESS    |  | RESOLVED       |  | CLOSED         |  |
|  |       3        |  |       2        |  |       5        |  |       12       |  |
|  | [View all]     |  | [View all]     |  | [View all]     |  | [View all]     |  |
|  +----------------+  +----------------+  +----------------+  +----------------+  |
|                                                                                   |
|  +---------------------------------------------+  +-------------------------------+  |
|  | My Recent Tickets               [ View all ] |  | Quick Actions                 |  |
|  |---------------------------------------------|  |-------------------------------|  |
|  | TXT-001  Laptop battery dying   [In Prog]   |  | [+] Create Ticket             |  |
|  | TXT-004  Software access        [Resolved]  |  | [=] View My Tickets           |  |
|  +---------------------------------------------+  +-------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Responsive Layout Rules & Breakpoints

### 4.1. Desktop Breakpoint (1280px and wider)
- App max-width: 1200px centered with auto margins.
- IT Staff Dashboard: 5 metric cards across in a single 5-column grid (`grid-template-columns: repeat(5, 1fr)`).
- Requester Dashboard: 4 metric cards across in a 4-column grid (`grid-template-columns: repeat(4, 1fr)`).
- Two-column bottom section: 70% Recent Tickets table, 30% Quick Actions sidebar.

### 4.2. Tablet Breakpoint (820px)
- Metric cards wrap: 3 cards on top row, 2 cards on bottom row for IT Staff; 2x2 grid for Requester.
- Recent Tickets and Quick Actions stack vertically (Quick actions placed below or above table).
- Table columns adjust with horizontal scrolling allowed exclusively within the table wrapper if needed.

### 4.3. Mobile Breakpoint (375px)
- Metric cards stack in a 2-column or 1-column card grid.
- All actionable buttons expand to full container width with min-height of 44px for touch targets.
- Navigation collapses into mobile-friendly drawer or stacked navigation.
- Zero horizontal window scrolling (`overflow-x: hidden` enforced at body level).

---

## 5. Accessibility (A11y) & Usability Checklist

- [x] **Color Contrast**: All text elements satisfy WCAG AA ratio (>= 4.5:1 for body text, >= 3:1 for large text and icons).
- [x] **Non-Color Indicators**: Every status and priority pill uses both distinct text and badges, not color alone.
- [x] **Focus Ring**: Interactive elements (buttons, inputs, cards) exhibit `#006B3C` 2px solid focus rings.
- [x] **Keyboard Navigation**: Form modals, status selectors, and metric cards are operable via Tab and Enter/Space.
- [x] **No Clipping / Overlapping**: Cards and tables gracefully reflow without clipping text or overlapping controls.
- [x] **Screen Reader Labels**: Metric cards feature descriptive `aria-label` tags (e.g. `aria-label="14 New Tickets, click to view"`).
