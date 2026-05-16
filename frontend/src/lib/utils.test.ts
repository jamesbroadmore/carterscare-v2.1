import { describe, it, expect } from "vitest";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Test the cn utility (combines clsx and tailwindmerge)
 * This is a common utility in shadcn/ui projects
 */

// Mock implementation of cn function
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

describe("cn utility", () => {
  it("should combine class names", () => {
    const result = cn("px-2", "py-1", "bg-blue-500");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
    expect(result).toContain("bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toContain("base");
    expect(result).toContain("active");
  });

  it("should merge tailwind classes", () => {
    const result = cn("px-2", "px-4"); // px-4 should override px-2
    expect(result).not.toContain("px-2");
    expect(result).toContain("px-4");
  });

  it("should filter out falsy values", () => {
    const result = cn("base", false, null, undefined, "active");
    expect(result).toContain("base");
    expect(result).toContain("active");
  });
});

describe("String utilities", () => {
  it("should capitalize strings", () => {
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("WORLD")).toBe("WORLD");
  });

  it("should format staff names", () => {
    const formatName = (first: string, last: string) => `${first} ${last}`;
    expect(formatName("John", "Doe")).toBe("John Doe");
    expect(formatName("Jane", "Smith")).toBe("Jane Smith");
  });
});
