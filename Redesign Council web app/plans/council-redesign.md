# Council Desktop Redesign — Implementation Plan

## Goal

Build a polished, interactive React prototype of Council, a local multi-model debate tool, using the supplied screenshots as product-context references rather than as a visual target. The redesign should read as a dense, deliberate developer instrument: neutral near-black/off-white surfaces, hairline structure, color-based elevation, restrained accent use, monospace metadata, and no generic “AI chat app” styling.

The prototype will cover the complete requested surface area:

- Debate: empty, streaming, and error states
- New Debate sheet
- Settings sheet: Runtime, Members, and Prices sections
- Provider Keys
- History list
- First-run / empty state
- Light and dark themes
- Default, hover, focus, disabled, loading, and error interaction states

It will be front-end only. Controls will update in-memory React state and provide realistic prototype feedback; no model, filesystem, or API-key persistence will be implied.

## Repository and design-system grounding

- The repository is a blank React 19 + Vite + Tailwind v4 scaffold.
- `@figma/astraui` 1.0.0 and the Astra kit guidance are installed.
- The missing team theme layer will be reconstructed in `src/index.css`.
- Astra’s `ThemeProvider`, semantic tokens, accessible form controls, modals, buttons, badges, tooltips, and focus behavior will be used where their APIs fit.
- Council’s explicit product direction overrides Astra’s default “lavender canvas / rounded B2C SaaS” composition:
  - no mandatory Astra icon rail;
  - no lavender page canvas;
  - compact radii instead of pill/large-card styling where local class overrides are needed;
  - hairline panel boundaries are intentional;
  - the screenshots’ application topology (top bar, member rail, transcript, composer/run controls, status footer) is retained.
- No package internals will be modified.
- Add `lucide-react` as a direct dependency because Astra’s guidelines require icons to be imported from Lucide and the project currently has no direct Lucide dependency. Update `package.json` and `pnpm-lock.yaml` with pnpm rather than relying on a transitive package.

## Theme and token architecture

Update `src/index.css` with all imports first:

1. Tailwind v4
2. `@figma/astraui/styles.css`

Then define one centrally managed Council token layer on `:root` and `.dark`. All custom UI CSS must reference these variables; JSX must not contain raw colors, arbitrary pixel/rem values, or inline visual styles.

Token groups:

- **Surfaces:** `--council-canvas`, `--council-surface-1`, `--council-surface-2`, `--council-surface-3`, `--council-surface-hover`, `--council-scrim`
- **Text:** `--council-text`, `--council-text-muted`, `--council-text-faint`, `--council-text-inverse`
- **Structure:** `--council-border`, `--council-border-strong`, `--council-focus`
- **Actions/status:** `--council-accent`, `--council-accent-hover`, `--council-danger`, `--council-warning`, `--council-success`
- **Member identity:** `--member-user`, `--member-skeptic`, `--member-builder`, `--member-visionary`, `--member-chair`
- **Typography:** grotesk stack for UI copy and a system monospace stack for model IDs, costs, timings, counters, hashes, and keyboard hints
- **Geometry/spacing:** 4px-grid spacing steps, compact radii, panel dimensions, hairline width, 2px member rule width, and transition timing

Where possible, Council variables should alias Astra semantic variables (for example, text, focus, danger, and brand roles), with Council-specific light/dark values only where the requested near-black/off-white instrument aesthetic differs from Astra. Member identity colors remain restricted to dots and the 2px left rule.

Add named global classes for the app shell, responsive grid, member rules/dots, custom sheet sizing, state-showcase strip, loading cursor, and CSS-only interaction demonstrations. Those classes must consume the token layer rather than introduce one-off values.

## Code organization

Create a small typed component structure so every requested named component maps directly to code:

```text
src/
  App.tsx
  index.css
  components/
    council/
      AppHeader.tsx
      MemberRail.tsx
      MemberRow.tsx
      TranscriptBlock.tsx
      Composer.tsx
      RunBar.tsx
      CostFooter.tsx
      SettingsSheet.tsx
      KeyRow.tsx
      DebateSheet.tsx
      HistoryList.tsx
      FirstRun.tsx
      StateShowcase.tsx
  data/
    council.ts
  types/
    council.ts
```

### Types and fixtures

Define:

- `ThemeMode = "light" | "dark"`
- `DemoView = "debate" | "history" | "first-run"`
- `DebateState = "empty" | "streaming" | "error"`
- `Sheet = "new-debate" | "settings" | "keys" | null`
- `SettingsSection = "runtime" | "members" | "prices"`
- typed member, transcript, key-provider, history-entry, and price-row records

Provide stable fixtures for four council members, a realistic debate topic, two rounds of model responses, a chair synthesis, provider rows, model prices, and several history entries. Keep content concise enough to preserve hierarchy while demonstrating realistic wrapping and scrolling.

## Application shell and state flow

`App.tsx` will own prototype state:

- current main view;
- debate state;
- active sheet and active settings section;
- theme through Astra `useTheme`;
- composer text;
- selected round count;
- mock key values/test statuses;
- draft settings values;
- selected history item;
- running/saving feedback state.

Wrap the app with Astra `ThemeProvider` at the root. The prototype starts in **dark / debate / streaming** so the most representative Council workspace is immediately visible. Theme and state can be changed from the showcase controls.

Top-level composition:

1. `AppHeader`
2. main work area:
   - `MemberRail`
   - debate transcript, `HistoryList`, or `FirstRun`
3. debate-only bottom controls:
   - `Composer`
   - `RunBar`
4. `CostFooter`
5. `StateShowcase`
6. one active sheet/modal at a time

At desktop widths, preserve the screenshot’s split workspace with a fixed member rail and independently scrollable transcript. At narrower preview widths, collapse to one column, make the member rail a compact horizontal strip, and keep controls reachable without horizontal overflow.

## Component-level implementation

### `AppHeader`

- Product mark/name, current topic, and short monospace debate ID on the left.
- Actions on the right: New Debate, History, API Keys, Settings, Export, and theme toggle.
- Use Astra `Button`, `IconButton`, `Tooltip`, and verified Lucide icons.
- Highlight only the primary/new-debate action with the accent; all other actions are neutral/subtle.
- Wire navigation and sheets; Export triggers a brief prototype success notice rather than a download.

### `MemberRail` and `MemberRow`

- `MemberRail` labels the council and renders four `MemberRow` instances.
- Each row shows member name, optional Chair badge, provider, model ID, role summary, and compact mute/edit actions.
- Identity is encoded only by a 2px left rule and matching dot.
- Active/streaming member receives a surface shift and activity label, not a large color wash.
- Disabled/muted, hover, and keyboard-focus treatments are visible and token-driven.

### `TranscriptBlock`

- Variants for user prompt, member response, chair synthesis, streaming response, and error.
- Header includes identity dot, member/provider, model ID, elapsed time, and token/cost metadata.
- Streaming state shows partially completed copy plus a restrained block cursor and “Generating” status.
- Error state uses a danger rule/status and an inline Retry Astra button.
- Chair synthesis uses stronger hierarchy but the same basic transcript grammar.
- Do not use speech bubbles; responses are flat reading blocks separated by rhythm and hairlines.

### `Composer`

- Wrap Astra `PromptInput` in the Council composer shell.
- Placeholder supports steering prompts and mentions the keyboard shortcut.
- Send updates the user prompt fixture and briefly displays a submitted/loading state.
- Disabled behavior is demonstrated while a run is active.

### `RunBar`

- Run Round primary action, round-count `SelectField`, Summary action, Moderator Turn action, and Save Session action.
- Running changes the primary action to a loading label and disables conflicting controls.
- Triggering a run moves the demo into the streaming state; retry from an error does the same.

### `CostFooter`

- Fixed informational footer with input/output token totals, estimated cost, pricing mode badge, and “Local · 127.0.0.1”.
- All numbers and environment labels use monospace styling.
- No fake connectivity claim beyond the explicitly local prototype label.

### `DebateSheet`

- Astra `Modal`, large enough for the form but still compact.
- Topic `TextareaField`, clickable prompt suggestions, words-per-turn range presentation, and initial-round `SelectField`.
- Begin Debate is disabled when the topic is empty; selecting a suggestion fills it.
- Submitting closes the sheet, updates the displayed topic, and shows the debate empty state ready to run.

### `SettingsSheet`

- One Astra `Modal` with local section switching for Runtime, Members, and Prices.
- Because Council intentionally uses a focused settings sheet rather than full-page navigation, use a compact local section switcher styled as sheet navigation instead of introducing Astra’s mandatory page-level sidebars.
- **Runtime:** words per turn, context window, system constraints, and automation switches.
- **Members:** editable member cards with name, provider `SelectField`, model ID, role/persona, chair checkbox, remove action, and Add Member. Maintain exactly one chair; selecting a new chair clears the previous one.
- **Prices:** dense model table with editable input/output token prices and explanatory local-config copy.
- Save produces confirmation feedback and closes the sheet; Cancel discards the draft by rebuilding it from fixture state.

### `KeyRow`

- Provider identity, environment variable name, configured/not-set status, masked Astra `InputField`, visibility toggle, documentation action, and Test action.
- Test progresses through idle → loading → success/error for prototype visibility.
- Never include real keys or persist entered values.

### Provider Keys sheet

- Astra `Modal` composed from four `KeyRow` instances: Anthropic, OpenAI, Google Gemini, and OpenRouter.
- Include a concise local-storage security note from the references, clearly labeled as prototype copy rather than a real storage guarantee.
- Save Keys is disabled if all fields are empty and gives non-persistent success feedback when used.

### `HistoryList`

- Full main-view list rather than a modal.
- Search/filter field, session count, and rows with topic, relative time, participating members, rounds, status, tokens, and estimated cost.
- Selected row receives a border/surface state; Open Session returns to the debate view with that topic.
- Include an empty filtered state when the query has no matches.

### `FirstRun`

- Deliberate first-run layout with a compact Council mark, “No debates yet” explanation, three-step setup list, and two actions: Add provider keys and Start a debate.
- Keep it practical and tool-like; no illustration or photography is needed for this local developer utility.

### `StateShowcase`

- A compact, clearly separated prototype utility strip, not part of Council’s production chrome.
- Controls:
  - view: Debate / History / First run;
  - debate state: Empty / Streaming / Error;
  - theme: Light / Dark;
  - sheet launcher: New Debate / Settings / Keys;
  - settings subsection shortcut: Runtime / Members / Prices.
- Add a collapsible “Control states” sample area that shows labeled default, hover, focus, disabled, loading, and error examples without requiring the user to discover each state manually.
- Use actual Astra controls and token-driven classes; simulated hover/focus examples are presentation-only and labeled as such.

## Interaction and accessibility rules

- All actions use Astra `Button`/`IconButton`; all text inputs, textareas, selects, and checkboxes use Astra components.
- Modal focus trap, Escape close, and backdrop behavior come from Astra `Modal`.
- Every icon-only action has an accessible label and Astra `Tooltip`.
- Maintain visible `focus-visible` treatment using the shared focus token.
- Ensure status is not communicated by color alone: include labels/icons for streaming, success, warning, and failure.
- Respect disabled semantics on incompatible actions during loading.
- Keep one primary action per visible section.
- Use real text wrapping and independent scroll regions; avoid clipped transcript or modal content.
- No custom SVGs, emoji, gradients, decorative photography, or generic AI sparkle motifs.

## State behavior matrix

| Trigger | Result |
|---|---|
| New Debate | Opens `DebateSheet` |
| Begin Debate | Updates topic, closes sheet, shows debate empty state |
| Run Round / Retry | Shows loading, then remains in a demonstrable streaming state |
| Summary | Adds/selects chair synthesis presentation |
| Send composer | Adds a local user block and clears input |
| History | Switches main view to `HistoryList` |
| Open history session | Loads its topic and returns to debate |
| API Keys | Opens Provider Keys modal |
| Settings | Opens `SettingsSheet` at Runtime |
| Save settings/keys | Closes modal and shows non-persistent success feedback |
| Theme control | Calls Astra `setTheme` and updates `.dark` through `ThemeProvider` |
| Showcase state controls | Deterministically switch to every required screen/state |

## Verification

After implementation:

1. Run the repository formatter using the prescribed entry point: `pnpm format`.
2. Run `pnpm build` because this is a broad, multi-component UI change and Astra’s guidance explicitly requires a production build.
3. Search changed source files to confirm:
   - all required named components exist as direct React components;
   - no raw `<button>`, `<input>`, `<select>`, or `<textarea>` elements were added;
   - no inline color/spacing styles or raw hex colors appear in JSX;
   - no package files under `node_modules` were changed.
4. Verify in both themes and at desktop plus narrower preview widths:
   - Debate empty, streaming, and error states;
   - New Debate, Provider Keys, and all Settings sections;
   - History and first-run views;
   - keyboard focus, disabled, loading, error, and modal close behavior;
   - no horizontal overflow or clipped bottom controls.
5. If runtime behavior fails, inspect `figma logs` only for that concrete failure; do not start another dev server.

## Expected files changed

- `package.json`
- `pnpm-lock.yaml`
- `src/App.tsx`
- `src/index.css`
- new files under `src/components/council/`
- `src/data/council.ts`
- `src/types/council.ts`

No backend, routing framework, persistence layer, image assets, or deployment changes are in scope.
