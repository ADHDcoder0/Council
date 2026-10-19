import {
  Badge,
  Button,
  Crop,
  IconButton,
  InputField,
  Search,
  Settings,
  Star,
  Tooltip,
  Upload,
  X,
} from "@figma/astraui"
import { useState } from "react"
import type { KeyProvider } from "@/types/council"

export type KeyTestState = "idle" | "loading" | "success" | "error"

interface KeyRowProps {
  provider: KeyProvider
  value: string
  onChange: (value: string) => void
}

export default function KeyRow({ provider, value, onChange }: KeyRowProps) {
  const [visible, setVisible] = useState(false)
  const [testState, setTestState] = useState<KeyTestState>("idle")

  const testKey = () => {
    setTestState("loading")
    window.setTimeout(() => {
      setTestState(value.trim().length > 8 ? "success" : "error")
    }, 700)
  }

  const status =
    testState === "success"
      ? { label: "Verified", variant: "success" as const }
      : testState === "error"
        ? { label: "Invalid", variant: "danger" as const }
        : value
          ? { label: "Entered", variant: "brand" as const }
          : { label: "Not set", variant: "secondary" as const }

  return (
    <div className={`key-row member-${provider.tone}`}>
      <div className="key-row__header">
        <div className="key-row__provider">
          <span className="member-dot" aria-hidden="true" />
          <strong>{provider.name}</strong>
          <code>{provider.env}</code>
        </div>
        <div className="key-row__status">
          <Badge label={status.label} variant={status.variant} />
          <Button
            iconEnd={<Upload size={14} />}
            size="small"
            type="button"
            variant="subtle"
          >
            {provider.docsLabel}
          </Button>
        </div>
      </div>
      <div className="key-row__controls">
        <InputField
          aria-label={`${provider.name} API key`}
          onChange={onChange}
          placeholder={provider.placeholder}
          type={visible ? "text" : "password"}
          value={value}
        />
        <Tooltip content={visible ? "Hide key" : "Show key"}>
          <IconButton
            aria-label={visible ? "Hide key" : "Show key"}
            icon={visible ? <X size={16} /> : <Search size={16} />}
            onClick={() => setVisible((current) => !current)}
            size="small"
            type="button"
            variant="subtle"
          />
        </Tooltip>
        <Button
          disabled={!value || testState === "loading"}
          iconStart={
            testState === "loading" ? (
              <Crop className="spin" size={16} />
            ) : testState === "success" ? (
              <Star size={16} />
            ) : testState === "error" ? (
              <X size={16} />
            ) : (
              <Settings size={16} />
            )
          }
          onClick={testKey}
          size="small"
          type="button"
          variant="neutral"
        >
          {testState === "loading" ? "Testing" : "Test"}
        </Button>
      </div>
    </div>
  )
}
