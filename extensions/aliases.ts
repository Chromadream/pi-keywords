/**
 * Pure data for the OpenCode command aliases.
 *
 * This module has no Pi imports so the test runner can load it directly.
 * `extensions/index.ts` owns the handlers; keep the two in sync through
 * `AliasActionKind`, which the dispatch map uses as an exhaustive key set.
 */

export const ALIAS_ACTION_KINDS = [
	"shutdown",
	"newSession",
	"compact",
	"toggleDetails",
	"editMessage",
	"pickModel",
	"pickSession",
	"pickTheme",
	"notify",
] as const;

export type AliasActionKind = (typeof ALIAS_ACTION_KINDS)[number];

/** Action kinds that show a dialog and therefore need an interactive session. */
export const UI_KINDS: ReadonlySet<AliasActionKind> = new Set([
	"editMessage",
	"pickModel",
	"pickSession",
	"pickTheme",
	"notify",
]);

export interface AliasAction {
	kind: AliasActionKind;
	/** Pi command or key that does the same job. Shown in /aliases and in pointer notices. */
	pi: string;
	/** Text for the "notify" kind. */
	hint?: string;
}

export interface Alias {
	/** Command name without the leading slash. */
	name: string;
	description: string;
	action: AliasAction;
}

/**
 * Pi's interactive slash commands as of Pi 0.85.1. Pi hides extension commands
 * that use these names from autocomplete, so no alias may collide with one.
 */
export const PI_BUILTIN_COMMANDS: readonly string[] = [
	"settings",
	"model",
	"tree",
	"thinking",
	"scoped-models",
	"export",
	"import",
	"share",
	"copy",
	"name",
	"session",
	"changelog",
	"hotkeys",
	"fork",
	"clone",
	"trust",
	"login",
	"logout",
	"new",
	"compact",
	"resume",
	"reload",
	"quit",
];

/**
 * OpenCode command names that differ from Pi's names.
 *
 * Commands that are spelled the same in both tools (`/new`, `/compact`,
 * `/share`, `/export`, `/resume`, `/thinking`, `/model`) are not listed.
 * OpenCode commands with no Pi equivalent (`/undo`, `/redo`, `/unshare`,
 * `/init`) are also not listed; the README explains those.
 */
export const OPENCODE_ALIASES: readonly Alias[] = [
	{
		name: "exit",
		description: "Exit Pi",
		action: { kind: "shutdown", pi: "/quit" },
	},
	{
		name: "q",
		description: "Exit Pi",
		action: { kind: "shutdown", pi: "/quit" },
	},
	{
		name: "clear",
		description: "Start a new session",
		action: { kind: "newSession", pi: "/new" },
	},
	{
		name: "summarize",
		description: "Compact the session, with optional instructions",
		action: { kind: "compact", pi: "/compact" },
	},
	{
		name: "details",
		description: "Show or hide tool output",
		action: { kind: "toggleDetails", pi: "ctrl+o" },
	},
	{
		name: "editor",
		description: "Edit the prompt in an editor",
		action: { kind: "editMessage", pi: "ctrl+g" },
	},
	{
		name: "themes",
		description: "Select a theme",
		action: { kind: "pickTheme", pi: "/settings" },
	},
	{
		name: "models",
		description: "Select a model",
		action: { kind: "pickModel", pi: "/model" },
	},
	{
		name: "sessions",
		description: "Switch to another session",
		action: { kind: "pickSession", pi: "/resume" },
	},
	{
		name: "continue",
		description: "Switch to another session",
		action: { kind: "pickSession", pi: "/resume" },
	},
	{
		name: "help",
		description: "Show keyboard shortcuts",
		action: { kind: "notify", pi: "/hotkeys", hint: "Pi shows every keyboard shortcut with /hotkeys." },
	},
	{
		name: "connect",
		description: "Configure provider authentication",
		action: { kind: "notify", pi: "/login", hint: "Pi configures provider authentication with /login." },
	},
];

const LABEL_LIMIT = 60;

/** Shorten a label for a picker row. Cut on a code point, not a UTF-16 unit. */
export function truncateLabel(text: string, limit: number = LABEL_LIMIT): string {
	const trimmed = text.trim();
	const characters = [...trimmed];
	if (characters.length <= limit) return trimmed;
	return `${characters.slice(0, limit - 1).join("").trimEnd()}…`;
}

/** Label for a model row, for example `anthropic/claude-sonnet-4-5`. */
export function formatModelLabel(model: { provider: string; id: string }): string {
	return `${model.provider}/${model.id}`;
}

/** Short age for a session row, for example `3h ago`. */
export function formatRelativeTime(from: Date, now: Date): string {
	const seconds = Math.max(0, Math.round((now.getTime() - from.getTime()) / 1000));
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return from.toISOString().slice(0, 10);
}

/** Label for a session row. The name wins; the first message is the fallback. */
export function formatSessionLabel(
	session: { name?: string; firstMessage: string; modified: Date },
	now: Date,
): string {
	const title = session.name?.trim() || session.firstMessage.trim() || "(unnamed session)";
	return `${truncateLabel(title)} · ${formatRelativeTime(session.modified, now)}`;
}
