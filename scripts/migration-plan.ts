/** Offline metadata file -> reviewable plan. Never connects to any service. */
import { readFileSync } from "node:fs";
import { planMvp3Migration } from "../src/lib/migrations/mvp3";
const index = process.argv.indexOf("--snapshot");
if (index < 0 || !process.argv[index + 1]) {
  console.log(
    JSON.stringify({
      status: "blocked",
      missing: ["--snapshot <operator-metadata.json>"],
      networkRequests: 0,
      cloudExecuted: false,
    }),
  );
  process.exitCode = 2;
} else {
  try {
    console.log(
      JSON.stringify(
        planMvp3Migration(
          JSON.parse(readFileSync(process.argv[index + 1], "utf8")),
        ),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "blocked",
        reason:
          error instanceof Error &&
          /^(Migration target|Duplicate table|Core table|Wait for|Index name|Unsafe table|Incompatible (?:legacy )?column|Nullable column|Content column|Required unique|Required column|Unmapped required|Unsupported|Unexpected)/.test(
            error.message,
          )
            ? error.message
            : "Invalid metadata snapshot",
        cloudExecuted: false,
        networkRequests: 0,
      }),
    );
    process.exitCode = 2;
  }
}
