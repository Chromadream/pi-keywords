/**
 * Registration and dispatch tests for the extension entry point.
 * The stub Pi API records registrations, so the tests run without a session.
 * Run with:  npm test   (node --experimental-strip-types test/aliases.test.mts)
 */

import type {
	ExtensionAPI,
	ExtensionCommandContext,
	RegisteredCommand,
} from "@earendil-works/pi-coding-agent";
import keywordsExtension from "../extensions/index.ts";
import { OPENCODE_ALIASES } from "../extensions/aliases.ts";

let failures = 0;
function check(name: string, condition: boolean): void {
	if (condition) {
		console.log(`ok   ${name}`);
	} else {
		failures += 1;
		console.error(`FAIL ${name}`);
	}
}

const commands = new Map<string, Omit<RegisteredCommand, "name" | "sourceInfo">>();
const stubPi = {
	registerCommand(name: string, options: Omit<RegisteredCommand, "name" | "sourceInfo">): void {
		commands.set(name, options);
	},
} as unknown as ExtensionAPI;

keywordsExtension(stubPi);

check("every alias is registered", OPENCODE_ALIASES.every((alias) => commands.has(alias.name)));
check("the /aliases command is registered", commands.has("aliases"));
check("no extra commands are registered", commands.size === OPENCODE_ALIASES.length + 1);
check(
	"alias descriptions name the Pi equivalent",
	OPENCODE_ALIASES.every((alias) => commands.get(alias.name)?.description?.includes(alias.action.pi) === true),
);

interface Stub {
	shutdownCalls: number;
	compactCalls: Array<{ customInstructions?: string }>;
	newSessionCalls: number;
	notifications: string[];
	expanded: boolean;
	editorText?: string;
}

function makeContext(): { ctx: ExtensionCommandContext; stub: Stub } {
	const stub: Stub = {
		shutdownCalls: 0,
		compactCalls: [],
		newSessionCalls: 0,
		notifications: [],
		expanded: false,
	};
	const ctx = {
		hasUI: true,
		shutdown: () => {
			stub.shutdownCalls += 1;
		},
		compact: (options?: { customInstructions?: string }) => {
			stub.compactCalls.push(options ?? {});
		},
		newSession: async () => {
			stub.newSessionCalls += 1;
			return { cancelled: false };
		},
		ui: {
			notify: (message: string) => {
				stub.notifications.push(message);
			},
			getToolsExpanded: () => stub.expanded,
			setToolsExpanded: (expanded: boolean) => {
				stub.expanded = expanded;
			},
			getEditorText: () => "draft",
			editor: async () => {
				stub.editorText = "edited";
				return "edited";
			},
			setEditorText: (text: string) => {
				stub.editorText = text;
			},
		},
	} as unknown as ExtensionCommandContext;
	return { ctx, stub };
}

async function run(name: string, args = ""): Promise<Stub> {
	const command = commands.get(name);
	if (!command) throw new Error(`missing command ${name}`);
	const { ctx, stub } = makeContext();
	await command.handler(args, ctx);
	return stub;
}

const exitStub = await run("exit");
check("/exit shuts down", exitStub.shutdownCalls === 1);

const qStub = await run("q");
check("/q shuts down", qStub.shutdownCalls === 1);

const clearStub = await run("clear");
check("/clear starts a new session", clearStub.newSessionCalls === 1);

const summarizeStub = await run("summarize", "keep the API notes");
check("/summarize passes instructions to compact", summarizeStub.compactCalls[0]?.customInstructions === "keep the API notes");

const bareSummarizeStub = await run("summarize");
check("/summarize without arguments passes no instructions", bareSummarizeStub.compactCalls[0]?.customInstructions === undefined);

const detailsStub = await run("details");
check("/details expands collapsed tool output", detailsStub.expanded === true);

const editorStub = await run("editor");
check("/editor writes the edited text back", editorStub.editorText === "edited");

const helpStub = await run("help");
check("/help prints the hint", helpStub.notifications.includes("Pi shows every keyboard shortcut with /hotkeys."));

const aliasesStub = await run("aliases");
check(
	"/aliases lists every alias",
	aliasesStub.notifications.length === 1 &&
		OPENCODE_ALIASES.every((alias) => aliasesStub.notifications[0]?.includes(`/${alias.name}`) === true),
);

const { ctx: headlessCtx, stub: headlessStub } = makeContext();
(headlessCtx as { hasUI: boolean }).hasUI = false;
await commands.get("models")?.handler("", headlessCtx);
check(
	"a UI alias reports the Pi equivalent without a UI",
	headlessStub.notifications.some((message) => message.includes("/model")),
);

if (failures > 0) {
	console.error(`\n${failures} failure(s)`);
	process.exit(1);
}
console.log("\nall tests passed");
