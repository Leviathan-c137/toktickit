import { APIRequestContext } from "@playwright/test";

export interface TestTicket {
  id: number;
  ticketNumber: string;
  status: string;
  updatedAt: string;
  summary: string;
  description: string;
  requesterId: number;
}

export async function createIsolatedTicket(
  request: APIRequestContext,
  options: {
    summary: string;
    description: string;
    status?: "New" | "Open" | "InProgress";
    requesterEmail?: string;
  }
): Promise<TestTicket> {
  const email = options.requesterEmail || "janderson@toktickit.com";

  // 1. Authenticate Requester
  const reqLogin = await request.post("http://localhost:3000/api/auth/login", {
    data: { email, password: "Password123!" },
  });
  if (!reqLogin.ok()) {
    throw new Error(`Failed to login as requester: ${await reqLogin.text()}`);
  }
  const reqData = await reqLogin.json();
  const requesterId = reqData.user.id;

  // 2. Create ticket via API
  const createRes = await request.post("http://localhost:3000/api/tickets", {
    headers: { "x-requester-id": String(requesterId) },
    multipart: {
      categoryId: "1",
      relatedSystemId: "1",
      requestedPriority: "High",
      summary: options.summary,
      description: options.description,
    },
  });

  if (!createRes.ok()) {
    throw new Error(`Failed to create ticket: ${await createRes.text()}`);
  }
  const ticketData = await createRes.json();

  let ticket: TestTicket = {
    id: ticketData.id,
    ticketNumber: ticketData.ticketNumber,
    status: ticketData.status,
    updatedAt: ticketData.updatedAt,
    summary: options.summary,
    description: options.description,
    requesterId,
  };

  // 3. If target status is Open or InProgress, transition sequentially adhering to state machine
  if (options.status && options.status !== "New") {
    const staffLogin = await request.post("http://localhost:3000/api/auth/login", {
      data: { email: "mbrown@toktickit.com", password: "Password123!" },
    });
    const staffData = await staffLogin.json();
    const staffToken = staffData.token;

    // Transition New -> Open
    const openRes = await request.patch(`http://localhost:3000/api/staff/tickets/${ticket.id}/status`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      data: {
        status: "Open",
        expectedUpdatedAt: ticket.updatedAt,
      },
    });
    if (!openRes.ok()) {
      throw new Error(`Failed to transition to Open: ${await openRes.text()}`);
    }
    const openData = await openRes.json();
    ticket.updatedAt = openData.updatedAt;
    ticket.status = "Open";

    if (options.status === "InProgress") {
      // Transition Open -> InProgress
      const inProgRes = await request.patch(`http://localhost:3000/api/staff/tickets/${ticket.id}/status`, {
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        data: {
          status: "InProgress",
          expectedUpdatedAt: ticket.updatedAt,
        },
      });
      if (!inProgRes.ok()) {
        throw new Error(`Failed to transition to InProgress: ${await inProgRes.text()}`);
      }
      const inProgData = await inProgRes.json();
      ticket.updatedAt = inProgData.updatedAt;
      ticket.status = "InProgress";
    }
  }

  return ticket;
}
