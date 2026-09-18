/**
 * Pickers for the alias commands that need a dialog.
 *
 * Every picker keeps the dialog rows and the real objects in the same order,
 * so a choice maps back by index. Never parse a label to recover a value.
 */

import {
	SessionManager,
	type ExtensionAPI,
	type ExtensionCommandContext,
	type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { formatModelLabel, formatSessionLabel } from "./aliases.ts";

const CURRENT_MARKER = " (current)";

type SessionModel = NonNullable<ExtensionContext["model"]>;
type SessionThinkingLevel = NonNullable<ExtensionContext["thinkingLevel"]>;

interface ModelRow {
	model: SessionModel;
	thinkingLevel?: SessionThinkingLevel;
}

/** Select a model, then apply it to the session. */
export async function pickModel(pi: ExtensionAPI, ctx: ExtensionCommandContext): Promise<void> {
	const rows: ModelRow[] =
		ctx.scopedModels.length > 0
			? ctx.scopedModels.map((scoped) => ({
					model: scoped.model,
					thinkingLevel: scoped.thinkingLevel,
				}))
			: ctx.modelRegistry.getAvailable().map((model) => ({ model }));

	if (rows.length === 0) {
		ctx.ui.notify("No models are available. Add a provider with /login.", "warning");
		return;
	}

	const labels = rows.map((row) => formatModelLabel(row.model));
	const active = ctx.model;
	const currentIndex = active
		? rows.findIndex((row) => row.model.provider === active.provider && row.model.id === active.id)
		: -1;
	const options = labels.map((label, index) => (index === currentIndex ? `${label}${CURRENT_MARKER}` : label));

	const choice = await ctx.ui.select("Select model", options);
	if (choice === undefined) return;

	const row = rows[options.indexOf(choice)];
	if (!row) return;

	const applied = await pi.setModel(row.model);
	if (!applied) {
		ctx.ui.notify(`No credentials for ${formatModelLabel(row.model)}. Use /login to add them.`, "error");
		return;
	}
	if (row.thinkingLevel) {
		pi.setThinkingLevel(row.thinkingLevel);
	}
	ctx.ui.notify(`Model: ${formatModelLabel(row.model)}`, "info");
}

/** Select a saved session in the current directory, then switch to it. */
export async function pickSession(ctx: ExtensionCommandContext): Promise<void> {
	const sessions = await SessionManager.list(ctx.cwd);
	if (sessions.length === 0) {
		ctx.ui.notify("No saved sessions for this directory.", "info");
		return;
	}

	const ordered = [...sessions].sort((a, b) => b.modified.getTime() - a.modified.getTime());
	const now = new Date();
	const currentFile = ctx.sessionManager.getSessionFile();
	const labels = ordered.map((session) => formatSessionLabel(session, now));
	const options = labels.map((label, index) => (ordered[index]?.path === currentFile ? `${label}${CURRENT_MARKER}` : label));

	const choice = await ctx.ui.select("Switch session", options);
	if (choice === undefined) return;

	const session = ordered[options.indexOf(choice)];
	if (!session) return;

	await ctx.switchSession(session.path);
}

/** Select a theme by name. The choice is saved to settings, like /settings. */
export async function pickTheme(ctx: ExtensionCommandContext): Promise<void> {
	const themes = ctx.ui.getAllThemes();
	if (themes.length === 0) {
		ctx.ui.notify("No themes are available.", "warning");
		return;
	}

	const names = themes.map((theme) => theme.name);
	const choice = await ctx.ui.select("Select theme", names);
	if (choice === undefined) return;

	const result = ctx.ui.setTheme(choice);
	if (!result.success) {
		ctx.ui.notify(result.error ?? `Cannot apply the theme "${choice}".`, "error");
		return;
	}
	ctx.ui.notify(`Theme: ${choice}`, "info");
}
