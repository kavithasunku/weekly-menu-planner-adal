import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      // Dummy value so modules that eagerly read DATABASE_URL (e.g. src/lib/prisma.ts)
      // don't throw on import. Tests never issue real queries against this.
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
  },
});
