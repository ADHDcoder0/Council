import {
  Book,
  Button,
  Home,
  IconButton,
  Settings,
  Star,
  Tooltip,
  Upload,
  Wand2,
} from "@figma/astraui"

interface AppHeaderProps {
  topic: string
  theme: "light" | "dark"
  onNewDebate: () => void
  onHistory: () => void
  onKeys: () => void
  onSettings: () => void
  onExport: () => void
  onToggleTheme: () => void
}

export default function AppHeader({
  topic,
  theme,
  onNewDebate,
  onHistory,
  onKeys,
  onSettings,
  onExport,
  onToggleTheme,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__identity">
        <div className="app-header__brand">
          <Home aria-hidden="true" size={18} />
          <strong>Council</strong>
        </div>
        <span className="app-header__slash">/</span>
        <span className="app-header__topic">{topic}</span>
        <code>10fb6af1</code>
      </div>
      <div className="app-header__actions">
        <Button
          iconStart={<Wand2 size={16} />}
          onClick={onNewDebate}
          size="small"
          type="button"
          variant="primary"
        >
          New debate
        </Button>
        <Button
          iconStart={<Book size={16} />}
          onClick={onHistory}
          size="small"
          type="button"
          variant="neutral"
        >
          History
        </Button>
        <Button
          iconStart={<Settings size={16} />}
          onClick={onKeys}
          size="small"
          type="button"
          variant="neutral"
        >
          API keys
        </Button>
        <Button
          iconStart={<Settings size={16} />}
          onClick={onSettings}
          size="small"
          type="button"
          variant="neutral"
        >
          Settings
        </Button>
        <Tooltip content="Export transcript">
          <IconButton
            aria-label="Export transcript"
            icon={<Upload size={16} />}
            onClick={onExport}
            size="small"
            type="button"
            variant="subtle"
          />
        </Tooltip>
        <Tooltip
          content={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <IconButton
            aria-label={`Switch to ${
              theme === "dark" ? "light" : "dark"
            } theme`}
            icon={<Star size={16} />}
            onClick={onToggleTheme}
            size="small"
            type="button"
            variant="subtle"
          />
        </Tooltip>
        <Book className="app-header__archive" aria-hidden="true" size={16} />
      </div>
    </header>
  )
}
