import "@testing-library/jest-dom";

// Firebase をモック（テスト時に実際の接続を避ける）
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
  isConfigValid: false,
}));

// next/navigation をモック
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
