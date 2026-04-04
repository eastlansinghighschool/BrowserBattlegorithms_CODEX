# Fresh Clone Setup

This guide is for:

- first-time setup on a new computer
- returning to the project on a computer that may be behind
- recovering from missing dependencies or failing local test/tooling setup

## Prerequisites

Install these first:

- Node.js 24.x or another recent Node 24 release
- npm 11.x
- Git

Optional but recommended:

- a modern Chromium-based browser for manual testing

## Fresh Clone Workflow

From the repository root:

```powershell
npm install
npx playwright install chromium
npm test
npm run build
npm run test:browser
```

If all commands pass, the project is ready for development.

## Daily Startup

To start the local dev server:

```powershell
npm run dev
```

Then open the local Vite URL shown in the terminal.

## When Pulling Onto A Device That Is Not Up To Date

After pulling latest changes, rerun the dependency and verification steps:

```powershell
npm install
npx playwright install chromium
npm test
npm run build
npm run test:browser
```

Use this full sequence when:

- `package.json` or `package-lock.json` changed
- Playwright was added or upgraded
- Node or npm was upgraded on the machine
- browser tests suddenly fail because no Playwright browser executable is found

## Common Recovery Steps

### `npm test` fails with missing packages

Run:

```powershell
npm install
```

This usually means `node_modules` has not been installed yet on this machine.

### `npm run test:browser` fails because Chromium is missing

Run:

```powershell
npx playwright install chromium
```

Typical symptom:

- Playwright reports that the browser executable does not exist under the local `ms-playwright` folder

### Build or tests start failing after a pull

Run the full verification flow again:

```powershell
npm install
npx playwright install chromium
npm test
npm run build
npm run test:browser
```

## Known Notes For Codex On Windows

During validation on a fresh Codex setup for this repo:

- reading files worked normally
- `apply_patch` worked for code edits
- networked install commands required unrestricted approval in the Codex environment
- Playwright browser binaries had to be installed separately on the machine

If you are working through Codex and a dependency install or browser download fails inside the sandbox, rerun it with approval outside the sandbox.

## Expected Healthy State

A healthy local setup should be able to run all of the following successfully:

```powershell
npm test
npm run build
npm run test:browser
```

At that point, you can treat the machine as fully ready for normal development work on this project.
