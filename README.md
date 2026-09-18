# @mirakurunchan/pi-keywords

[![CI](https://github.com/Chromadream/pi-keywords/actions/workflows/ci.yml/badge.svg)](https://github.com/Chromadream/pi-keywords/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@mirakurunchan/pi-keywords.svg)](https://www.npmjs.com/package/@mirakurunchan/pi-keywords)

OpenCode command aliases for [Pi](https://pi.dev).

Pi names some everyday actions differently. `/quit` exits Pi, `/new` starts a
session, and `/hotkeys` shows the keyboard shortcuts. The extension adds the
OpenCode names for those actions. If your fingers type `/exit` or `/clear`, the
right thing happens.

The extension registers commands only. It does not change keybindings or
built-in commands, and Pi keeps all of its own names.

## Install

```bash
# from npm
pi install npm:@mirakurunchan/pi-keywords

# from a local checkout
pi install /absolute/path/to/pi-keywords

# try it for one run without installing
pi -e /absolute/path/to/pi-keywords
```

Run `/reload` inside Pi after you install the package.

## Commands

| OpenCode command | Pi equivalent | Notes |
| --- | --- | --- |
| `/exit`, `/q` | `/quit` | Exits Pi when the agent becomes idle. |
| `/clear` | `/new` | Starts a new session and keeps the old session file. |
| `/summarize [instructions]` | `/compact` | Passes the text after the command to compaction. |
| `/details` | `ctrl+o` | Shows or hides tool output, like the key. |
| `/editor` | `ctrl+g` | Opens an editor dialog for the current prompt. |
| `/themes` | `/settings` | Saves the choice to settings. |
| `/models` | `/model` | Shows a plain list. Use `/model` for fuzzy search. |
| `/sessions`, `/continue` | `/resume` | Lists sessions for the current directory. |
| `/help` | `/hotkeys` | Prints a pointer to `/hotkeys`. |
| `/connect` | `/login` | Prints a pointer to `/login`. |
| `/aliases` | | Lists every alias inside Pi. |

`/details`, `/editor`, `/themes`, `/models`, `/sessions`, `/continue`, `/help`,
and `/connect` need an interactive session. In print or JSON mode the command
reports the Pi equivalent instead.

## What this package leaves alone

Pi spells these commands the same way as OpenCode, so the extension does not
register them: `/new`, `/compact`, `/model`, `/share`, `/export`, `/resume`,
`/thinking`.

These OpenCode commands have no Pi equal:

- Pi has no `/undo` or `/redo`. Use `git` to restore file changes. Use `/tree`
  to return to an earlier message, then continue on a new branch.
- Pi has no `/unshare`. Delete the gist on GitHub.
- Pi has no `/init`. Pi loads `AGENTS.md` at startup, so ask the model to
  create or update the file.

## Package layout

```
extensions/
  index.ts        wiring: alias commands, handlers, /aliases
  aliases.ts      pure alias table and label helpers
  pickers.ts      model, session, and theme pickers
test/
  aliases.test.mts       tests for the table and the helpers
  registration.test.mts  registration and dispatch tests with a stub Pi API
```

## Development

Requires Node 22.19 or later.

```bash
npm ci --ignore-scripts   # install dev dependencies for typechecking
npm run typecheck         # tsc --noEmit
npm test                  # tests through Node's type stripping
```

To test a live copy, install the directory with `pi install`. Run `/reload`
after each edit.

## Releases

CI publishes to npm. A merge to `main` creates a `v<version>` git tag and
publishes that version. Every merge to `main` must bump the version in
`package.json`. See [RELEASING.md](./RELEASING.md).

## License

MIT
