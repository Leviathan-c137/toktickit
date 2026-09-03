import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App.js";
import { RequesterSelector } from "../../src/components/RequesterSelector.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

const mockRequesters = [
  {
    id: 1,
    fullName: "Jennifer Anderson",
    email: "jennifer.anderson@kmutt.ac.th",
    department: "Computer Engineering",
  },
  {
    id: 2,
    fullName: "Michael Brown",
    email: "michael.brown@kmutt.ac.th",
    department: "Information Technology",
  },
];

describe("UI-01: Development Requester Selector", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the notice disclaimer and populates the dropdown with active requesters", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue(mockRequesters);

    render(
      <RequesterProvider>
        <RequesterSelector />
      </RequesterProvider>
    );

    // Verifies notice disclaimer is displayed
    expect(
      screen.getByText(/Select a Development Requester to test requester-specific ticket behavior/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/This is not a login screen/i)).toBeInTheDocument();

    // Verifies loading state finishes and options populate
    const select = await screen.findByTestId("requester-select");
    expect(select).toBeInTheDocument();

    expect(screen.getByText(/Jennifer Anderson/i)).toBeInTheDocument();
    expect(screen.getByText(/Michael Brown/i)).toBeInTheDocument();
  });

  it("stores selected requester to context and localStorage upon clicking Continue", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue(mockRequesters);
    const onSuccess = vi.fn();

    render(
      <RequesterProvider>
        <RequesterSelector onSuccess={onSuccess} />
      </RequesterProvider>
    );

    const select = (await screen.findByTestId("requester-select")) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "2" } });

    const continueBtn = screen.getByTestId("continue-btn");
    fireEvent.click(continueBtn);

    expect(onSuccess).toHaveBeenCalled();

    const stored = JSON.parse(localStorage.getItem("toktickit_requester") || "{}");
    expect(stored.id).toBe(2);
    expect(stored.fullName).toBe("Michael Brown");
  });

  it("displays an error message with a retry option if fetching requesters fails", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockRejectedValue(
      new Error("Network connection error")
    );

    render(
      <RequesterProvider>
        <RequesterSelector />
      </RequesterProvider>
    );

    expect(
      await screen.findByText(/Network connection error/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  it("AC-01 & AC-02: Enforces Requester Gate and updates AppHeader when selected", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue(mockRequesters);

    render(<App />);

    // Initially no user selected -> shows selector
    expect(
      await screen.findByText(/Development Requester Selector/i)
    ).toBeInTheDocument();

    // Select Jennifer Anderson and click continue
    const continueBtn = await screen.findByTestId("continue-btn");
    fireEvent.click(continueBtn);

    // Now header and welcome banner display Jennifer Anderson
    await waitFor(() => {
      expect(screen.getByText(/Welcome, Jennifer Anderson/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId("change-requester-btn")).toBeInTheDocument();

    // Click Change Requester button to reopen selector
    fireEvent.click(screen.getByTestId("change-requester-btn"));
    expect(
      await screen.findByText(/Development Requester Selector/i)
    ).toBeInTheDocument();
  });
});
