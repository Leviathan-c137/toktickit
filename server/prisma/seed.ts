import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

async function main() {
  const prisma = getPrisma();
  console.log("Starting idempotent Lab 3 seed process...");

  // Default initial password hash for all seeded accounts (Password123!)
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Seed Categories (4 standard incident categories)
  const categoryNames = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  const categories: Record<string, any> = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 2. Seed Related Systems (7 campus systems)
  const systemNames = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  const relatedSystems: Record<string, any> = {};
  for (const name of systemNames) {
    relatedSystems[name] = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 3. Seed Users across all 3 roles: Requester, ITStaff, Administrator
  const seedUsers = [
    // Requesters (4 active, 1 inactive)
    {
      fullName: "Jennifer Anderson",
      email: "janderson@toktickit.com",
      role: Role.Requester,
      department: "Computer Engineering",
      isActive: true,
      mustChangePassword: false, // active tested requester
    },
    {
      fullName: "Michael Chen",
      email: "mchen@toktickit.com",
      role: Role.Requester,
      department: "Applied Mathematics",
      isActive: true,
      mustChangePassword: true, // test first-login password change
    },
    {
      fullName: "Prapatsorn Katip",
      email: "pkatip@toktickit.com",
      role: Role.Requester,
      department: "Electrical Engineering",
      isActive: true,
      mustChangePassword: false,
    },
    {
      fullName: "Supachok Sangrod",
      email: "ssangrod@toktickit.com",
      role: Role.Requester,
      department: "Civil Engineering",
      isActive: true,
      mustChangePassword: false,
    },
    {
      fullName: "Inactive Requester",
      email: "inactive.req@toktickit.com",
      role: Role.Requester,
      department: "Alumni Affairs",
      isActive: false,
      mustChangePassword: true,
    },

    // IT Staff (3 active, 1 inactive)
    {
      fullName: "Michael Brown",
      email: "mbrown@toktickit.com",
      role: Role.ITStaff,
      department: "IT Infrastructure",
      isActive: true,
      mustChangePassword: false,
    },
    {
      fullName: "Sarah Johnson",
      email: "sjohnson@toktickit.com",
      role: Role.ITStaff,
      department: "IT Operations",
      isActive: true,
      mustChangePassword: false,
    },
    {
      fullName: "David Lee",
      email: "dlee@toktickit.com",
      role: Role.ITStaff,
      department: "Client Services",
      isActive: true,
      mustChangePassword: false,
    },
    {
      fullName: "Inactive IT Staff",
      email: "inactive.staff@toktickit.com",
      role: Role.ITStaff,
      department: "IT Support",
      isActive: false,
      mustChangePassword: true,
    },

    // Administrator (1 active)
    {
      fullName: "System Administrator",
      email: "admin@toktickit.com",
      role: Role.Administrator,
      department: "IT Administration",
      isActive: true,
      mustChangePassword: false,
    },
  ];

  const users: Record<string, any> = {};
  for (const u of seedUsers) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        department: u.department,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: defaultPasswordHash,
      },
      create: {
        ...u,
        passwordHash: defaultPasswordHash,
      },
    });
  }

  // 4. Seed Tickets with varied statuses, priorities, owners, and comments/notes
  const sampleTickets = [
    {
      ticketNumber: "TKT-2026-000001",
      summary: "Cannot connect to campus VPN from home",
      description: "When connecting via FortiClient VPN from off-campus network, error 403 authorization failed is displayed.",
      requestedPriority: Priority.High,
      itPriority: Priority.High,
      status: TicketStatus.InProgress,
      requesterEmail: "janderson@toktickit.com",
      ownerEmail: "mbrown@toktickit.com",
      categoryName: "Network",
      systemName: "VPN",
      publicComments: [
        {
          authorEmail: "mbrown@toktickit.com",
          content: "We checked your account permissions. Could you please verify if you can log in to LEB2?",
        },
        {
          authorEmail: "janderson@toktickit.com",
          content: "Yes, I can access LEB2 without issue. Only VPN is rejecting credentials.",
        },
      ],
      internalNotes: [
        {
          authorEmail: "mbrown@toktickit.com",
          content: "RADIUS server auth logs show timestamp skew on VPN gateway 2. Escalating to network admin.",
        },
      ],
      actionsTaken: [
        {
          performerEmail: "mbrown@toktickit.com",
          actionDateTime: new Date("2026-09-18T09:30:00Z"),
          description: "Inspected RADIUS authentication logs on primary and backup VPN gateways.",
          result: "Identified clock drift of 14 seconds causing Kerberos ticket validation failure.",
          followUpRequired: true,
          followUpNote: "Coordinate with network engineering team to resync NTP daemon on Gateway 2.",
          attachmentNotes: "radius_auth_drift_log.txt",
        },
        {
          performerEmail: "sjohnson@toktickit.com",
          actionDateTime: new Date("2026-09-18T14:15:00Z"),
          description: "Applied manual NTP resync on Gateway 2 and tested tunnel handshake with test client.",
          result: "Handshake completed successfully in 1.2s with AES-256 cipher.",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000002",
      summary: "Corporate laptop battery draining unusually fast",
      description: "My Lenovo ThinkPad battery drains from 100% to 10% in under 45 minutes since last Windows update.",
      requestedPriority: Priority.Medium,
      itPriority: Priority.Medium,
      status: TicketStatus.Open,
      requesterEmail: "janderson@toktickit.com",
      ownerEmail: "sjohnson@toktickit.com",
      categoryName: "Hardware",
      systemName: "Corporate Laptop",
      publicComments: [
        {
          authorEmail: "sjohnson@toktickit.com",
          content: "Please bring the device to IT Helpdesk Room 402 for a quick battery health test.",
        },
      ],
      internalNotes: [
        {
          authorEmail: "sjohnson@toktickit.com",
          content: "Replacement 57Wh batteries are currently in stock in cabinet B.",
        },
      ],
      actionsTaken: [
        {
          performerEmail: "sjohnson@toktickit.com",
          actionDateTime: new Date("2026-09-18T11:00:00Z"),
          description: "Ran Lenovo Vantage Hardware Diagnostic battery cycle test.",
          result: "Battery cycle count is 842; health report indicates 41% of original capacity.",
          followUpRequired: true,
          followUpNote: "Schedule battery replacement session when requester brings laptop in.",
          attachmentNotes: "lenovo_battery_health_report.pdf",
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000003",
      summary: "Department printer showing offline on 3rd floor",
      description: "The HP LaserJet in Room 308 shows offline for all faculty members on the 3rd floor.",
      requestedPriority: Priority.Medium,
      itPriority: Priority.Low,
      status: TicketStatus.New,
      requesterEmail: "pkatip@toktickit.com",
      ownerEmail: null,
      categoryName: "Hardware",
      systemName: "Printer",
      publicComments: [],
      internalNotes: [],
      actionsTaken: [], // Zero actions taken (empty state verification)
    },
    {
      ticketNumber: "TKT-2026-000004",
      summary: "Grade Submission App session timeout too short",
      description: "Session times out after 5 minutes of inactivity while reviewing student grading rubrics.",
      requestedPriority: Priority.Low,
      itPriority: Priority.Low,
      status: TicketStatus.WaitingForRequester,
      requesterEmail: "ssangrod@toktickit.com",
      ownerEmail: "dlee@toktickit.com",
      categoryName: "Software",
      systemName: "Grade Submission App",
      publicComments: [
        {
          authorEmail: "dlee@toktickit.com",
          content: "We increased the session timeout to 30 minutes on staging. Could you please confirm if this works for you?",
        },
      ],
      internalNotes: [
        {
          authorEmail: "dlee@toktickit.com",
          content: "Session config was updated in redis session store TTL parameter.",
        },
      ],
      actionsTaken: [
        {
          performerEmail: "dlee@toktickit.com",
          actionDateTime: new Date("2026-09-18T16:00:00Z"),
          description: "Updated session timeout in application configuration file to 1800 seconds.",
          result: "Config applied and verified on staging server.",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000005",
      summary: "Password reset request for university email",
      description: "Locked out of university email account after entering incorrect password multiple times.",
      requestedPriority: Priority.Urgent,
      itPriority: Priority.Urgent,
      status: TicketStatus.Resolved,
      requesterEmail: "mchen@toktickit.com",
      ownerEmail: "sjohnson@toktickit.com",
      categoryName: "Account and Access",
      systemName: "Email",
      publicComments: [
        {
          authorEmail: "sjohnson@toktickit.com",
          content: "Account lock has been cleared and initial password reset. Please sign in and set a new password.",
        },
      ],
      internalNotes: [
        {
          authorEmail: "sjohnson@toktickit.com",
          content: "Verified requester identity via phone call.",
        },
      ],
      actionsTaken: [
        {
          performerEmail: "sjohnson@toktickit.com",
          actionDateTime: new Date("2026-09-19T08:30:00Z"),
          description: "Verified employee ID over phone, unlocked Active Directory account, and issued temporary PIN.",
          result: "Requester successfully logged in and updated primary password.",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000006",
      summary: "Classroom projector HDMI port loose in Room 204",
      description: "HDMI signal keeps dropping when laptops are connected to the lectern projector.",
      requestedPriority: Priority.Medium,
      itPriority: Priority.Medium,
      status: TicketStatus.Closed,
      requesterEmail: "janderson@toktickit.com",
      ownerEmail: "mbrown@toktickit.com",
      categoryName: "Hardware",
      systemName: "LEB2 App",
      publicComments: [
        {
          authorEmail: "mbrown@toktickit.com",
          content: "Replaced the wall plate and HDMI pass-through cable. Tested with 1080p 60Hz feed.",
        },
      ],
      internalNotes: [],
      actionsTaken: [
        {
          performerEmail: "mbrown@toktickit.com",
          actionDateTime: new Date("2026-09-17T13:00:00Z"),
          description: "Inspected lectern cabling and swapped faulty HDMI cable with new braided cable.",
          result: "Signal stable for 45 minutes of continuous video playback.",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: "projector_test_pattern.png",
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000007",
      summary: "MATLAB license activation error after OS reinstallation",
      description: "Error 5032: Maximum number of activations reached for this campus license.",
      requestedPriority: Priority.High,
      itPriority: Priority.High,
      status: TicketStatus.Reopened,
      requesterEmail: "janderson@toktickit.com",
      ownerEmail: "dlee@toktickit.com",
      categoryName: "Software",
      systemName: "Corporate Laptop",
      publicComments: [],
      internalNotes: [],
      actionsTaken: [
        {
          performerEmail: "dlee@toktickit.com",
          actionDateTime: new Date("2026-09-19T10:00:00Z"),
          description: "Deactivated dormant machine ID from MathWorks portal and regenerated license file.",
          result: "License file downloaded; pending user confirmation.",
          followUpRequired: true,
          followUpNote: "Check if requester can run MATLAB toolboxes without error.",
          attachmentNotes: null,
        },
      ],
    },
  ];

  for (const t of sampleTickets) {
    const requester = users[t.requesterEmail];
    const owner = t.ownerEmail ? users[t.ownerEmail] : null;
    const category = categories[t.categoryName];
    const system = relatedSystems[t.systemName];

    if (!requester || !category || !system) continue;

    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        status: t.status,
        ownerId: owner?.id ?? null,
      },
      create: {
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        status: t.status,
        requesterId: requester.id,
        ownerId: owner?.id ?? null,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });

    // Seed Public Comments
    for (const c of t.publicComments) {
      const author = users[c.authorEmail];
      if (author) {
        const existingComment = await prisma.publicComment.findFirst({
          where: { ticketId: ticket.id, authorId: author.id, content: c.content },
        });
        if (!existingComment) {
          await prisma.publicComment.create({
            data: {
              ticketId: ticket.id,
              authorId: author.id,
              content: c.content,
            },
          });
        }
      }
    }

    // Seed Internal Notes
    for (const n of t.internalNotes) {
      const author = users[n.authorEmail];
      if (author) {
        const existingNote = await prisma.internalNote.findFirst({
          where: { ticketId: ticket.id, authorId: author.id, content: n.content },
        });
        if (!existingNote) {
          await prisma.internalNote.create({
            data: {
              ticketId: ticket.id,
              authorId: author.id,
              content: n.content,
            },
          });
        }
      }
    }

    // Seed Actions Taken
    if (t.actionsTaken && t.actionsTaken.length > 0) {
      for (const a of t.actionsTaken) {
        const performer = users[a.performerEmail];
        if (performer) {
          const existingAction = await prisma.actionTaken.findFirst({
            where: {
              ticketId: ticket.id,
              performedById: performer.id,
              description: a.description,
            },
          });
          if (!existingAction) {
            await prisma.actionTaken.create({
              data: {
                ticketId: ticket.id,
                performedById: performer.id,
                actionDateTime: a.actionDateTime,
                description: a.description,
                result: a.result,
                followUpRequired: a.followUpRequired,
                followUpNote: a.followUpNote,
                attachmentNotes: a.attachmentNotes,
              },
            });
          }
        }
      }
    }
  }

  console.log("Lab 4 idempotent seed completed successfully!");
  console.log(`- ${categoryNames.length} Categories`);
  console.log(`- ${systemNames.length} Related Systems`);
  console.log(`- ${seedUsers.length} Users (${seedUsers.filter(u => u.isActive).length} active, ${seedUsers.filter(u => !u.isActive).length} inactive)`);
  console.log(`- Sample tickets, public comments, internal notes, and actions taken populated.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
