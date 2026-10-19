import { Button, ButtonGroup, Modal, Settings, Star } from "@figma/astraui"
import { useState } from "react"
import { keyProviders } from "@/data/council"
import KeyRow from "./KeyRow"

interface ProviderKeysSheetProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function ProviderKeysSheet({
  isOpen,
  onClose,
  onSave,
}: ProviderKeysSheetProps) {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const hasKey = Object.values(keys).some((value) => value.trim())

  return (
    <Modal
      className="council-modal council-modal--wide"
      footer={
        <ButtonGroup align="end">
          <Button onClick={onClose} type="button" variant="neutral">
            Close
          </Button>
          <Button
            disabled={!hasKey}
            iconStart={<Settings size={16} />}
            onClick={onSave}
            type="button"
            variant="primary"
          >
            Save keys
          </Button>
        </ButtonGroup>
      }
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      title="Provider API keys"
    >
      <div className="sheet-stack">
        <div className="security-note">
          <Star aria-hidden="true" size={18} />
          <p>
            Prototype only: entered values remain in memory for this preview and
            are never transmitted.
          </p>
        </div>
        <div className="key-list">
          {keyProviders.map((provider) => (
            <KeyRow
              key={provider.id}
              onChange={(value) =>
                setKeys((current) => ({ ...current, [provider.id]: value }))
              }
              provider={provider}
              value={keys[provider.id] ?? ""}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
