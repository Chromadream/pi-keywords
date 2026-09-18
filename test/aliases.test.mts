/**
 * Unit tests for the pure alias table and label helpers.
 * Run with:  npm test   (node --experimental-strip-types test/aliases.test.mts)
 * Not loaded by Pi: the package manifest points at extensions/index.ts only.
 */

import {
	ALIAS_ACTION_KINDS,
	OPENCODE_ALIASES,
	PI_BUILTIN_COMMANDS,
	UI_KINDS,
	formatModelLabel,
	formatRelativeTime,
	formatSessionLabel,
	truncateLabel,
} from "../extensions/aliases.ts";

let failures = 0;
function check(name: string, condition: boolean): void {
	if (condition) {
		console.log(`ok   ${name}`);
	} else {
		failures += 1;
		console.error(`FAIL ${name}`);
	}
}

const names = OPENCODE_ALIASES.map((alias) => alias.name);

check("alias names are unique", new Set(names).size === names.length);
check("alias names are lowercase words", names.every((name) => /^[a-z][a-z0-9-]*$/.test(name)));
check("action kinds are unique", new Set(ALIAS_ACTION_KINDS).size === ALIAS_ACTION_KINDS.length);

for (const name of names) {
	check(`/${name} does not collide with a Pi built-in`, !PI_BUILTIN_COMMANDS.includes(name));
}

check(
	"every alias has a description",
	OPENCODE_ALIASES.every((alias) => alias.description.trim().length > 0),
);
check(
	"every alias names a Pi command or key",
	OPENCODE_ALIASES.every((alias) => alias.action.pi.trim().length > 0),
);
check(
	"every action kind is known",
	OPENCODE_ALIASES.every((alias) => (ALIAS_ACTION_KINDS as readonly string[]).includes(alias.action.kind)),
);
check(
	"every notify alias carries a hint",
	OPENCODE_ALIASES.filter((alias) => alias.action.kind === "notify").every(
		(alias) => (alias.action.hint ?? "").trim().length > 0,
	),
);
check(
	"UI kinds are action kinds",
	[...UI_KINDS].every((kind) => (ALIAS_ACTION_KINDS as readonly string[]).includes(kind)),
);

check("model label uses provider and id", formatModelLabel({ provider: "anthropic", id: "claude" }) === "anthropic/claude");

const now = new Date("2026-01-10T12:00:00.000Z");
check("30 seconds ago reads as just now", formatRelativeTime(new Date("2026-01-10T11:59:30.000Z"), now) === "just now");
check("a future date clamps to just now", formatRelativeTime(new Date("2026-01-10T12:05:00.000Z"), now) === "just now");
check("5 minutes reads as 5m ago", formatRelativeTime(new Date("2026-01-10T11:55:00.000Z"), now) === "5m ago");
check("3 hours reads as 3h ago", formatRelativeTime(new Date("2026-01-10T09:00:00.000Z"), now) === "3h ago");
check("2 days reads as 2d ago", formatRelativeTime(new Date("2026-01-08T12:00:00.000Z"), now) === "2d ago");
check("30 days reads as a date", formatRelativeTime(new Date("2025-12-11T12:00:00.000Z"), now) === "2025-12-11");

check(
	"session label prefers the name",
	formatSessionLabel({ name: "Refactor auth", firstMessage: "hello", modified: now }, now) ===
		"Refactor auth · just now",
);
check(
	"session label falls back to the first message",
	formatSessionLabel({ firstMessage: "fix the build", modified: now }, now) === "fix the build · just now",
);
check(
	"session label handles an empty session",
	formatSessionLabel({ firstMessage: "   ", modified: now }, now) === "(unnamed session) · just now",
);

const longName = "a".repeat(100);
const longLabel = formatSessionLabel({ name: longName, firstMessage: "x", modified: now }, now);
check("session label truncates a long name", longLabel.startsWith("a".repeat(59)) && longLabel.includes("…"));

check("short labels stay unchanged", truncateLabel("  hello  ") === "hello");
check("labels cut on a code point", truncateLabel("😀".repeat(70), 10) === `${"😀".repeat(9)}…`);

if (failures > 0) {
	console.error(`\n${failures} failure(s)`);
	process.exit(1);
}
console.log("\nall tests passed");
