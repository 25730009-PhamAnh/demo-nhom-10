import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit khong tu doc .env.local (do la quy uoc rieng cua Next.js),
// nen phai nap thu cong.
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("Thieu DATABASE_URL. Hay copy .env.example thanh .env.local.");
}

export default defineConfig({
  dialect: "mysql",
  // schema.ts duoc SINH RA tu database bang `npm run db:pull`, khong sua tay.
  // Nguon chan ly cua schema la cac script trong ../Scripts/.
  schema: "./src/db/schema.ts",
  out: "./src/db",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
