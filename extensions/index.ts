/**
 * pi-keywords - OpenCode command aliases for Pi.
 *
 * Registers the OpenCode command names that differ from Pi's names and maps
 * each one to the Pi command, key, or picker that does the same job. Commands
 * that Pi spells the same way (`/new`, `/compact`, `/share`, `/resume`) are
 * left to Pi. OpenCode commands with no Pi equivalent are not registered and
 * are listed in the README.
 */

import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
	OPENCODE_ALIASES,
	UI_KINDS,
	type Alias,
	type AliasActionKind,
} from "./aliases.ts";
import { pickModel, pickSession, pickTheme } from "./pickers.ts";

type AliasHandler = (
	alias: Alias,
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	args: string,
) => Promise<void> | void;

/** One handler per action kind. The Record type makes a missing handler a type error. */
const HANDLERS: Record<AliasActionKind, AliasHandler> = {
	shutdown: (_alias, _pi, ctx) => {
		ctx.shutdown();
	},

	newSession: async (_alias, _pi, ctx) => {
		// Do not touch ctx after this call. Pi rebinds the session and the old
		// context is stale.
		await ctx.newSession();
	},

	compact: (_alias, _pi, ctx, args) => {
		const customInstructions = args.trim();
		ctx.compact(customInstructions ? { customInstructions } : {});
	},

	toggleDetails: (_alias, _pi, ctx) => {
		const expanded = ctx.ui.getToolsExpanded();
		ctx.ui.setToolsExpanded(!expanded);
		ctx.ui.notify(expanded ? "Tool output collapsed" : "Tool output expanded", "info");
	},

	editMessage: async (_alias, _pi, ctx) => {
		const edited = await ctx.ui.editor("Edit message", ctx.ui.getEditorText());
		if (edited !== undefined) {
			ctx.ui.setEditorText(edited);
		}
	},

	pickModel: (_alias, pi, ctx) => pickModel(pi, ctx),
	pickSession: (_alias, _pi, ctx) => pickSession(ctx),
	pickTheme: (_alias, _pi, ctx) => pickTheme(ctx),

	notify: (alias, _pi, ctx) => {
		ctx.ui.notify(alias.action.hint ?? `Pi uses ${alias.action.pi}.`, "info");
	},
};

/**
 * Commands that need a dialog. Print and JSON modes have no dialogs, so the
 * command reports the Pi equivalent instead of failing.
 */
function lacksInteractiveUI(alias: Alias, ctx: ExtensionContext): boolean {
	if (!UI_KINDS.has(alias.action.kind) || ctx.hasUI) return false;
	ctx.ui.notify(`/${alias.name} needs an interactive session. Pi uses ${alias.action.pi}.`, "warning");
	return true;
}

export default function keywordsExtension(pi: ExtensionAPI): void {
	for (const alias of OPENCODE_ALIASES) {
		pi.registerCommand(alias.name, {
			description: `${alias.description} (alias of ${alias.action.pi})`,
			handler: async (args, ctx) => {
				if (lacksInteractiveUI(alias, ctx)) return;
				await HANDLERS[alias.action.kind](alias, pi, ctx, args);
			},
		});
	}

	pi.registerCommand("aliases", {
		description: "List the OpenCode aliases and their Pi commands",
		handler: async (_args, ctx) => {
			const lines = OPENCODE_ALIASES.map(
				(alias) => `/${alias.name} -> ${alias.action.pi} · ${alias.description}`,
			);
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});
}
