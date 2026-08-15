import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({test:{environment:"jsdom",setupFiles:["./vitest.setup.ts"],include:["features/**/*.test.ts","features/**/*.test.tsx"]},resolve:{alias:{"@":fileURLToPath(new URL("./",import.meta.url))}}});
