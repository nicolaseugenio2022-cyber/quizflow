import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "@/app/(external)/_components/password-input";

describe("PasswordInput", () => {
  it("toggles visibility with an accessible pressed button", () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password", { selector: "input" });
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveProperty("type", "password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);
    expect(input).toHaveProperty("type", "text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });
});
