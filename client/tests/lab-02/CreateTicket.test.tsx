import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateTicket } from "../../src/components/CreateTicket.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

const mockCategories = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];

const mockSystems = [
  { id: 1, name: "Email" },
  { id: 7, name: "Corporate Laptop" },
];

const mockRequester = {
  id: 1,
  fullName: "Jennifer Anderson",
  email: "jennifer.anderson@kmutt.ac.th",
  department: "Computer Engineering",
};

describe("CreateTicket Component Tests (UI-02, UI-03, UI-04)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockSystems);
  });

  it("UI-02: shows inline field error when summary is less than 5 chars without calling API (AC-04, BR-06)", async () => {
    const createTicketSpy = vi.spyOn(api, "createTicket");

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    // Wait for categories to load
    await screen.findByDisplayValue("Account and Access");

    const summaryInput = screen.getByTestId("summary-input");
    const descriptionInput = screen.getByTestId("description-input");
    const submitBtn = screen.getByTestId("submit-ticket-btn");

    // Enter summary < 5 characters
    fireEvent.change(summaryInput, { target: { value: "Help" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Valid description longer than 10 characters." },
    });

    fireEvent.click(submitBtn);

    // Verify inline error beneath summary
    const errorMsg = await screen.findByTestId("summary-error");
    expect(errorMsg).toHaveTextContent(/Summary must be at least 5 characters/i);

    // Verify createTicket was NOT called
    expect(createTicketSpy).not.toHaveBeenCalled();
  });

  it("UI-03: displays immediate validation error when file exceeds 5 MB (AC-05, BR-10)", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await screen.findByDisplayValue("Account and Access");

    const fileInput = screen.getByTestId("file-input");

    // Create simulated file larger than 5 MB (5.5 MB)
    const largeFile = new File(["x".repeat(100)], "huge_log.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(largeFile, "size", { value: 5.5 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    // Verify immediate error message
    const errorMsg = await screen.findByTestId("file-error");
    expect(errorMsg).toHaveTextContent(/exceeds the maximum allowed limit of 5 MB/i);
  });

  it("UI-03 (b): rejects unsupported file extension (.exe) with client error", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await screen.findByDisplayValue("Account and Access");

    const fileInput = screen.getByTestId("file-input");
    const exeFile = new File(["dummy"], "malware.exe", {
      type: "application/x-msdownload",
    });

    fireEvent.change(fileInput, { target: { files: [exeFile] } });

    const errorMsg = await screen.findByTestId("file-error");
    expect(errorMsg).toHaveTextContent(/unsupported format/i);
  });

  it("UI-04: preserves all entered form values upon API failure (AC-06, BR-13)", async () => {
    vi.spyOn(api, "createTicket").mockRejectedValue(
      new Error("Internal Server Error (500)")
    );

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await screen.findByDisplayValue("Account and Access");

    const summaryInput = screen.getByTestId("summary-input") as HTMLInputElement;
    const descriptionInput = screen.getByTestId("description-input") as HTMLTextAreaElement;
    const prioritySelect = screen.getByTestId("priority-select") as HTMLSelectElement;
    const submitBtn = screen.getByTestId("submit-ticket-btn");

    fireEvent.change(summaryInput, {
      target: { value: "Preserve this summary after 500 error" },
    });
    fireEvent.change(descriptionInput, {
      target: { value: "Preserve this description after server failure happens." },
    });
    fireEvent.change(prioritySelect, { target: { value: "Urgent" } });

    fireEvent.click(submitBtn);

    // Verify error banner is shown
    expect(
      await screen.findByText(/Internal Server Error \(500\)/i)
    ).toBeInTheDocument();

    // Verify form input values are preserved!
    expect(summaryInput.value).toBe("Preserve this summary after 500 error");
    expect(descriptionInput.value).toBe(
      "Preserve this description after server failure happens."
    );
    expect(prioritySelect.value).toBe("Urgent");
  });

  it("successfully creates a ticket and renders the official ticket number view", async () => {
    vi.spyOn(api, "createTicket").mockResolvedValue({
      id: 42,
      ticketNumber: "TKT-2026-000042",
      summary: "Keyboard not working properly",
      description: "Keys are sticking and unresponsive.",
      requestedPriority: "High",
      itPriority: "Medium",
      status: "New",
      requesterId: 1,
      requester: {
        id: 1,
        fullName: "Jennifer Anderson",
        email: "jennifer.anderson@kmutt.ac.th",
      },
      categoryId: 2,
      category: { id: 2, name: "Hardware" },
      relatedSystemId: 7,
      relatedSystem: { id: 7, name: "Corporate Laptop" },
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await screen.findByDisplayValue("Account and Access");

    fireEvent.change(screen.getByTestId("summary-input"), {
      target: { value: "Keyboard not working properly" },
    });
    fireEvent.change(screen.getByTestId("description-input"), {
      target: { value: "Keys are sticking and unresponsive." },
    });

    fireEvent.click(screen.getByTestId("submit-ticket-btn"));

    // Verify success confirmation card with official ticket number
    expect(
      await screen.findByText(/Ticket Created Successfully/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("created-ticket-number")).toHaveTextContent(
      "TKT-2026-000042"
    );
  });
});
