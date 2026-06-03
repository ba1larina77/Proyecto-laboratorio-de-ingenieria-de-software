import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Limpieza del DOM entre tests
afterEach(() => {
  cleanup();
});

// Reset localStorage / sessionStorage entre tests para aislamiento total
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Polyfill mínimo de matchMedia (usado por Tailwind / next-themes)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock global de fetch — para tests que toquen Google Books API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ items: [] }),
  } as Response)
) as any;
