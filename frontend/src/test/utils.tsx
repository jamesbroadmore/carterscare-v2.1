import React, { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Custom render function that includes providers
 */

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ["/"],
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const testQueryClient = createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return {
    user: null,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export * from "@testing-library/react";
export { renderWithProviders as render };

/**
 * Mock data generators
 */

export const createMockStaff = (overrides = {}) => ({
  id: "staff-1",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  phone: "+61234567890",
  status: "active" as const,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockClient = (overrides = {}) => ({
  id: "client-1",
  name: "Client Name",
  email: "client@example.com",
  phone: "+61234567890",
  status: "active" as const,
  address: "123 Main St",
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock Supabase client
 */

export const mockSupabaseClient = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  auth: {
    getSession: vi
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ subscription: { unsubscribe: () => {} } }),
  },
};
