import {
  Button,
  Crop,
  Folder,
  IconButton,
  InputField,
  Sliders,
  Star,
  Tooltip,
  X,
} from "@figma/astraui"
import { useState } from "react"
import type {
  DebateState,
  DemoView,
  SettingsSection,
  Sheet,
} from "@/types/council"

interface StateShowcaseProps {
  view: DemoView
  debateState: DebateState
  theme: "light" | "dark"
  onViewChange: (view: DemoView) => void
  onDebateStateChange: (state: DebateState) => void
  onThemeChange: (theme: "light" | "dark") => void
  onSheetChange: (sheet: Sheet) => void
  onSettingsSectionChange: (section: SettingsSection) => void
}

export default function StateShowcase({
  view,
  debateState,
  theme,
  onViewChange,
  onDebateStateChange,
  onThemeChange,
  onSheetChange,
  onSettingsSectionChange,
}: StateShowcaseProps) {
  const [expanded, setExpanded] = useState(false)

  const openSettings = (section: SettingsSection) => {
    onSettingsSectionChange(section)
    onSheetChange("settings")
  }

  return (
    <aside className={`showcase ${expanded ? "is-expanded" : ""}`}>
      <div className="showcase__bar">
        <div className="showcase__label">
          <Folder size={15} />
          Prototype states
        </div>
        <div className="showcase__group">
          {(["debate", "history", "first-run"] as DemoView[]).map((item) => (
            <Button
              className={view === item ? "is-active" : ""}
              key={item}
              onClick={() => onViewChange(item)}
              size="small"
              type="button"
              variant="subtle"
            >
              {item === "first-run" ? "First run" : item}
            </Button>
          ))}
        </div>
        <div className="showcase__group">
          {(["empty", "streaming", "error"] as DebateState[]).map((item) => (
            <Button
              className={debateState === item ? "is-active" : ""}
              disabled={view !== "debate"}
              key={item}
              onClick={() => onDebateStateChange(item)}
              size="small"
              type="button"
              variant="subtle"
            >
              {item}
            </Button>
          ))}
        </div>
        <Tooltip content={`Show ${theme === "dark" ? "light" : "dark"} theme`}>
          <IconButton
            aria-label={`Show ${theme === "dark" ? "light" : "dark"} theme`}
            icon={<Star size={16} />}
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
            size="small"
            type="button"
            variant="subtle"
          />
        </Tooltip>
        <Tooltip
          content={expanded ? "Hide state samples" : "Show state samples"}
        >
          <IconButton
            aria-label={expanded ? "Hide state samples" : "Show state samples"}
            icon={expanded ? <X size={16} /> : <Sliders size={16} />}
            onClick={() => setExpanded((value) => !value)}
            size="small"
            type="button"
            variant="subtle"
          />
        </Tooltip>
      </div>

      {expanded ? (
        <div className="showcase__panel">
          <div className="showcase__section">
            <div className="eyebrow">Sheets</div>
            <div className="showcase__samples">
              <Button
                onClick={() => onSheetChange("new-debate")}
                size="small"
                type="button"
                variant="neutral"
              >
                New debate
              </Button>
              <Button
                onClick={() => onSheetChange("keys")}
                size="small"
                type="button"
                variant="neutral"
              >
                Provider keys
              </Button>
              <Button
                onClick={() => openSettings("runtime")}
                size="small"
                type="button"
                variant="neutral"
              >
                Runtime
              </Button>
              <Button
                onClick={() => openSettings("members")}
                size="small"
                type="button"
                variant="neutral"
              >
                Members
              </Button>
              <Button
                onClick={() => openSettings("prices")}
                size="small"
                type="button"
                variant="neutral"
              >
                Prices
              </Button>
            </div>
          </div>
          <div className="showcase__section">
            <div className="eyebrow">Control states</div>
            <div className="showcase__samples">
              <div className="state-sample">
                <span>Default</span>
                <Button size="small" type="button" variant="neutral">
                  Action
                </Button>
              </div>
              <div className="state-sample simulated-hover">
                <span>Hover</span>
                <Button size="small" type="button" variant="neutral">
                  Action
                </Button>
              </div>
              <div className="state-sample simulated-focus">
                <span>Focus</span>
                <Button size="small" type="button" variant="neutral">
                  Action
                </Button>
              </div>
              <div className="state-sample">
                <span>Disabled</span>
                <Button disabled size="small" type="button" variant="neutral">
                  Action
                </Button>
              </div>
              <div className="state-sample">
                <span>Loading</span>
                <Button
                  disabled
                  iconStart={<Crop className="spin" size={16} />}
                  size="small"
                  type="button"
                  variant="primary"
                >
                  Running
                </Button>
              </div>
              <div className="state-sample state-sample--error">
                <span>Error</span>
                <InputField
                  aria-invalid="true"
                  aria-label="Error example"
                  prefix={<X size={16} />}
                  readOnly
                  value="Invalid key"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
