# DESIGN-council.md: Council UI Theme

Applies the visual accents from the Subtle Folio reference to the Council debate app. This file covers the theme only. It does not bring over any portfolio content, layout, or sections.

**Accuracy note:** Colors are estimated from a compressed screenshot. Sample exact values before locking tokens.

---

## 1. What carries over

| From the reference | Used in Council as |
|---|---|
| Dark neutral surfaces with color steps | Base theme for the whole app |
| Hairline borders instead of shadows | Panels, member rows, transcript blocks |
| Pill-shaped nav and buttons | Top bar actions, Run and Send controls, mode toggles |
| Green status pill with uppercase label | Key status and cost "Exact" badge |
| Secondary pill buttons with leading icon | New Debate, History, API Keys, Settings, Export |
| Light primary CTA | Begin Debate, Start debate, Send |
| Rounded list rows with trailing chevron | Suggested topics, history entries, settings rows |
| Section label with a dot prefix | "Council members (4)", "Transcript", "Pricing" |
| Thin outline icon set | Replace all current icons |
| Subtle motion (150ms, no bounce) | Hover, panel open, row selection |

## 2. What does not carry over

- Avatar, memoji, and 404 illustrations
- "Follow Me" social block and portfolio footer
- Product list with Framer template tags
- Portfolio copy ("I'm Brian Do", "Explore My Products")
- Gradient app tiles. Council member identity colors stay as they are.

---

## 3. Color tokens

| Token | Value (estimated) | Council use |
|---|---|---|
| `--bg-canvas` | `#121212` | App background |
| `--bg-surface-1` | `#1a1a1a` | Sidebar, top bar, composer |
| `--bg-surface-2` | `#222222` | Member rows, transcript blocks |
| `--bg-surface-3` | `#2a2a2a` | Hover, active row, pressed button |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Default panel and row borders |
| `--border-strong` | `rgba(255,255,255,0.12)` | Focus and selected borders |
| `--text-primary` | `#f2f2f2` | Titles, speaker names, body |
| `--text-secondary` | `#a1a1a1` | Role descriptions, metadata |
| `--text-tertiary` | `#6b6b6b` | Footer, timestamps, captions |
| `--accent-success` | `#3ecf8e` | Valid key, Exact cost, "Available" |
| `--accent-success-bg` | `rgba(62,207,142,0.12)` | Success pill background |
| `--accent-warning` | `#f5b041` | Estimated cost, skipped member |
| `--accent-danger` | `#f0616d` | Failed key, member error, destructive confirm |
| `--btn-primary-bg` | `#f2f2f2` | Primary CTA |
| `--btn-primary-text` | `#121212` | Text on primary CTA |
| `--btn-secondary-bg` | `#262626` | Secondary pill buttons |

**Member identity colors (kept, used only as a 2px left rule and a dot):**
- Skeptic: `#ef4444`
- Builder: `#22c55e`
- Visionary: `#38bdf8`
- Chair: `#f59e0b`

Assign identity colors per member, so a user can add a fifth member without a color clash. Keep them out of buttons and chrome.

**Single accent rule:** The app uses one accent for actions (`--btn-primary-bg`, neutral light) and status colors for meaning. Remove the current purple primary.

---

## 4. Typography

- UI text: the grotesk sans used in the reference (Inter or similar).
- Model IDs, token counts, costs, session IDs, and file paths: monospace. Keep this from the current design.

| Role | Size / line height | Weight |
|---|---|---|
| Page title (topic) | 20 / 28 | 600 |
| Section heading | 16 / 24 | 600 |
| Speaker name | 14 / 20 | 600 |
| Body (transcript) | 15 / 24 | 400 |
| Label (buttons, nav) | 13 / 18 | 500 |
| Eyebrow (status pills) | 11 / 14, uppercase, +0.06em | 600 |
| Caption and mono metadata | 12 / 16 | 400 |

Transcript body text at 15/24 is the main reading size. Do not go below 13px anywhere.

---

## 5. Spacing, radius, borders

- Spacing: 4px grid. Common steps 8, 12, 16, 20, 24.
- Radius:
  - Pill: `999px` (top bar actions, mode toggles, status pills, Run and Send)
  - Buttons inside panels: `10px`
  - Panels, transcript blocks, member rows: `12px`
  - Composer: `16px`
- No drop shadows. Elevation is `--bg-surface-*` plus `--border-subtle`.
- Focus ring: 2px `--border-strong` outline with 2px offset, visible on all controls.

---

## 6. Components

### Top bar
- Left: session title in Page title style, short session ID in mono caption pill.
- Right: pill action group (New Debate as primary, History, API Keys, Settings, Export as secondary). Group the secondary actions in one pill container so the bar reads as one unit.

### Status pill
- Valid, Exact, Available: `--accent-success-bg` with `--accent-success` text and a 6px dot.
- Estimated, Skipped: warning colors.
- Not set: neutral (`--bg-surface-3`, `--text-secondary`).
- Failed, Error: danger colors.
- Uppercase eyebrow type.

### Buttons
| Variant | Use | Style |
|---|---|---|
| Primary | Begin Debate, Start debate, Send, Run round | Light fill, dark text, pill |
| Secondary | History, API Keys, Settings, Export, Save session | `--btn-secondary-bg`, border, leading icon, pill |
| Ghost | Summary, Moderator turn, Retry | Transparent, `--text-secondary`, trailing or leading icon |
| Destructive | Delete member, Clear session | Danger text, confirm dialog required |

Height: 36px for top bar and inline actions, 40px for dialog footers and the composer send button.

### Member row (left rail)
- `--bg-surface-2`, 12px radius, 2px left rule in identity color.
- Name in speaker style, provider and model in mono caption with a status pill for provider, role in secondary body text, clamped to two lines.
- Mute is a labeled toggle, not an icon. Edit is a ghost icon button on hover.
- Chair shows a single "Chair" status pill. Only one chair exists.

### Transcript entry
- Block on `--bg-surface-2`, 12px radius, 16px padding, 2px left rule in speaker color.
- Header: speaker name, timestamp (caption, tertiary), optional status pill.
- User entries: `--bg-surface-3` with a neutral rule, not a colored one. Remove the stray count shown beside "You" in the current UI.
- Streaming text: a thin caret at the end while tokens arrive.
- Error entries: danger pill in the header and a Retry ghost button. The round continues.

### List rows (topics, history, settings)
- Full-width rows on `--bg-surface-2`, 12px radius, 14px to 16px padding.
- Title (Title style) over a secondary line. No truncation on suggested topics.
- Trailing chevron-right in `--text-tertiary`, moves 2px on hover.

### Composer
- `--bg-surface-1`, 16px radius, 1px `--border-subtle`, focus ring to `--border-strong`.
- Send is a pill primary button inside the composer's bottom-right.
- Hint text in caption style: "Ctrl+Enter to send".

### Run bar
- Pill group: Run round (primary) with a rounds stepper, then Summary and Moderator turn as ghost pills.
- Progress line above the bar in caption style: "Skeptic is responding, 2 of 4".
- Stop button replaces Run round while a run is active. Stop cancels only the active member.

### Cost footer
- Mono caption: tokens in and out, cost, then a status pill that reads Exact or Estimated.

### Dialogs and sheets
- Surface-1, 16px radius, 1px border, no shadow beyond a 1px inner highlight.
- Settings: left section nav instead of tabs. Members, Runtime, Prices, Keys. Fixed height with scroll inside the content area, so the dialog does not change height between sections.

### Empty and first-run state
- Setup checklist in list-row style: Add API keys, Review members, Start a debate. Each row has a status pill when complete.

---

## 7. Icons

Use the Lucide set (2px stroke, rounded caps, 20px in controls, 16px inline). Brand logos are not needed in Council, so no brand set.

| Action | Lucide icon |
|---|---|
| New debate | `plus` |
| History | `history` |
| API keys | `key-round` |
| Settings | `settings` |
| Export | `download` |
| Save session | `bookmark` |
| Run round | `play` |
| Stop | `square` |
| Summary | `file-text` |
| Moderator turn | `compass` |
| Send | `send` |
| Mute / unmute | `volume-x` / `volume-2` |
| Edit member | `pencil` |
| Delete member | `trash-2` |
| Chair | `crown` |
| Copy | `copy` |
| Test key | `refresh-cw` |
| Show / hide key | `eye` / `eye-off` |
| Warning | `triangle-alert` |
| Error | `circle-alert` |
| Success | `circle-check` |
| Chevron | `chevron-right` |

Do not use filled emoji, sparkles, or robot icons in the Council UI.

---

## 8. Motion

- Hover and press: 150ms, `cubic-bezier(0.2, 0, 0, 1)`.
- Panel and sheet open: 250ms, same easing, opacity plus 8px translate.
- Streaming text never shifts other blocks. Reserve height or append only.
- No bounce, no looping decoration. The spinner during first-token wait is the only looping animation.

---

## 9. Accessibility

- All text meets WCAG AA contrast on its surface. Check `--text-tertiary` on `--bg-surface-2` before shipping; if it fails, lift it one step.
- Status is never color only: every status pill has a label.
- Keyboard: every control reachable, visible focus ring, Esc closes dialogs.
