import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PublicComments } from "../../src/components/PublicComments.js";
import * as api from "../../src/api.js";

describe("Lab 3 Issue 3: PublicComments Component", () => {
  const mockComments = [
    {
      id: 1,
      ticketId: 10,
      author: { id: 1, fullName: "Jennifer Anderson", role: "Requester" as const },
      content: "Hello, I am following up on this ticket.",
      createdAt: "2026-09-18T10:00:00.000Z",
    },
    {
      id: 2,
      ticketId: 10,
      author: { id: 5, fullName: "Michael Brown", role: "ITStaff" as const },
      content: "We are currently investigating the issue.",
      createdAt: "2026-09-18T10:30:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders existing public comments with author name and role badge", async () => {
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue(mockComments);

    render(<PublicComments ticketId={10} />);

    expect(screen.getByText(/Loading comments/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
      expect(screen.getByText("Michael Brown")).toBeInTheDocument();
      expect(screen.getByText("IT Support")).toBeInTheDocument();
      expect(screen.getByText("Hello, I am following up on this ticket.")).toBeInTheDocument();
      expect(screen.getByText("We are currently investigating the issue.")).toBeInTheDocument();
    });
  });

  it("allows entering a new comment and submitting", async () => {
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue(mockComments);
    const createSpy = vi.spyOn(api, "createPublicComment").mockResolvedValue({
      id: 3,
      ticketId: 10,
      author: { id: 1, fullName: "Jennifer Anderson", role: "Requester" as const },
      content: "Thank you for the quick reply!",
      createdAt: new Date().toISOString(),
    });

    render(<PublicComments ticketId={10} />);

    await waitFor(() => {
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const submitBtn = screen.getByRole("button", { name: /Post Comment/i });

    // Type new comment
    fireEvent.change(textarea, { target: { value: "Thank you for the quick reply!" } });
    expect(submitBtn).not.toBeDisabled();

    // Submit
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(10, "Thank you for the quick reply!");
      expect(screen.getByText("Thank you for the quick reply!")).toBeInTheDocument();
    });
  });
});
