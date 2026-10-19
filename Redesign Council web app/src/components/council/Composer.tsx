import { PromptInput } from "@figma/astraui"

interface ComposerProps {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  onSend: () => void
}

export default function Composer({
  value,
  disabled = false,
  onChange,
  onSend,
}: ComposerProps) {
  return (
    <div className="composer">
      <PromptInput
        className="composer__input"
        disabled={disabled}
        onChange={onChange}
        onSend={onSend}
        placeholder="Steer the council or add a counterargument…  Ctrl + Enter to send"
        value={value}
      />
    </div>
  )
}
