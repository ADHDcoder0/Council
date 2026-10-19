import {
  Button,
  ButtonGroup,
  Checkbox,
  IconButton,
  InputField,
  MessageCircle,
  Modal,
  SelectField,
  Sliders,
  Star,
  SwitchField,
  TextareaField,
  Tooltip,
  Upload,
  Wand2,
  X,
} from "@figma/astraui"
import { useEffect, useState } from "react"
import {
  members as initialMembers,
  prices as initialPrices,
} from "@/data/council"
import type { CouncilMember, PriceRow, SettingsSection } from "@/types/council"

interface SettingsSheetProps {
  isOpen: boolean
  section: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  onClose: () => void
  onSave: () => void
}

const providerOptions = [
  { value: "Anthropic", label: "Anthropic" },
  { value: "OpenAI", label: "OpenAI" },
  { value: "Gemini", label: "Google Gemini" },
  { value: "OpenRouter", label: "OpenRouter" },
]

export default function SettingsSheet({
  isOpen,
  section,
  onSectionChange,
  onClose,
  onSave,
}: SettingsSheetProps) {
  const [draftMembers, setDraftMembers] =
    useState<CouncilMember[]>(initialMembers)
  const [draftPrices, setDraftPrices] = useState<PriceRow[]>(initialPrices)
  const [words, setWords] = useState("120")
  const [context, setContext] = useState("40")
  const [constraints, setConstraints] = useState(
    "Respond to others by name, add something new each turn, plain text only.",
  )

  useEffect(() => {
    if (isOpen) {
      setDraftMembers(initialMembers.map((member) => ({ ...member })))
      setDraftPrices(initialPrices.map((price) => ({ ...price })))
      setWords("120")
      setContext("40")
      setConstraints(
        "Respond to others by name, add something new each turn, plain text only.",
      )
    }
  }, [isOpen])

  const updateMember = (memberId: string, updates: Partial<CouncilMember>) => {
    setDraftMembers((current) =>
      current.map((member) =>
        member.id === memberId ? { ...member, ...updates } : member,
      ),
    )
  }

  const selectChair = (memberId: string) => {
    setDraftMembers((current) =>
      current.map((member) => ({
        ...member,
        isChair: member.id === memberId,
      })),
    )
  }

  const addMember = () => {
    const number = draftMembers.length + 1
    setDraftMembers((current) => [
      ...current,
      {
        id: `member-${number}`,
        name: `Member ${number}`,
        provider: "OpenRouter",
        model: "openai/gpt-4o-mini",
        role: "A focused perspective added for this debate.",
        tone: "builder",
      },
    ])
  }

  const updatePrice = (
    index: number,
    field: "input" | "output",
    value: string,
  ) => {
    setDraftPrices((current) =>
      current.map((price, priceIndex) =>
        priceIndex === index ? { ...price, [field]: value } : price,
      ),
    )
  }

  return (
    <Modal
      className="council-modal council-modal--settings"
      footer={
        <ButtonGroup align="end">
          <Button onClick={onClose} type="button" variant="neutral">
            Cancel
          </Button>
          <Button
            iconStart={<Upload size={16} />}
            onClick={onSave}
            type="button"
            variant="primary"
          >
            Save settings
          </Button>
        </ButtonGroup>
      }
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      title="Council settings"
    >
      <div className="settings-shell">
        <div className="settings-nav" aria-label="Settings sections">
          <Button
            className={section === "runtime" ? "is-active" : ""}
            iconStart={<Sliders size={16} />}
            onClick={() => onSectionChange("runtime")}
            size="small"
            type="button"
            variant="subtle"
          >
            Runtime
          </Button>
          <Button
            className={section === "members" ? "is-active" : ""}
            iconStart={<MessageCircle size={16} />}
            onClick={() => onSectionChange("members")}
            size="small"
            type="button"
            variant="subtle"
          >
            Members
          </Button>
          <Button
            className={section === "prices" ? "is-active" : ""}
            iconStart={<Star size={16} />}
            onClick={() => onSectionChange("prices")}
            size="small"
            type="button"
            variant="subtle"
          >
            Prices
          </Button>
        </div>

        <div className="settings-content">
          {section === "runtime" ? (
            <div className="sheet-stack">
              <div className="section-heading">
                <div>Rules and runtime</div>
                <p>Set response limits and shared debate constraints.</p>
              </div>
              <div className="field-grid">
                <SelectField
                  label="Words per turn"
                  onChange={setWords}
                  options={[
                    { value: "80", label: "80 words" },
                    { value: "120", label: "120 words" },
                    { value: "200", label: "200 words" },
                  ]}
                  value={words}
                />
                <InputField
                  label="Prompt window"
                  onChange={setContext}
                  suffix="entries"
                  type="number"
                  value={context}
                />
              </div>
              <TextareaField
                label="Debate rules and system constraints"
                onChange={setConstraints}
                rows={5}
                value={constraints}
              />
              <div className="settings-switches">
                <SwitchField
                  defaultSelected
                  description="Ask the chair to synthesize after the final round."
                  label="Automatic synthesis"
                />
                <SwitchField
                  defaultSelected={false}
                  description="Stop a member after one failed retry."
                  label="Fail fast"
                />
              </div>
            </div>
          ) : null}

          {section === "members" ? (
            <div className="sheet-stack">
              <div className="section-heading section-heading--actions">
                <div>
                  <div>Members and personas</div>
                  <p>Configure debaters and select exactly one chair.</p>
                </div>
                <Button
                  iconStart={<Wand2 size={16} />}
                  onClick={addMember}
                  size="small"
                  type="button"
                  variant="neutral"
                >
                  Add member
                </Button>
              </div>
              <div className="member-editor-list">
                {draftMembers.map((member) => (
                  <div
                    className={`member-editor member-${member.tone}`}
                    key={member.id}
                  >
                    <div className="member-editor__header">
                      <InputField
                        aria-label="Member name"
                        onChange={(value) =>
                          updateMember(member.id, { name: value })
                        }
                        value={member.name}
                      />
                      <Checkbox
                        defaultChecked={Boolean(member.isChair)}
                        disabled={member.isChair}
                        key={`${member.id}-${Boolean(member.isChair)}`}
                        label="Chair"
                        onChange={(checked) => {
                          if (checked) selectChair(member.id)
                        }}
                      />
                      <Tooltip content="Remove member">
                        <IconButton
                          aria-label={`Remove ${member.name}`}
                          disabled={draftMembers.length <= 2}
                          icon={<X size={16} />}
                          onClick={() =>
                            setDraftMembers((current) =>
                              current.filter((item) => item.id !== member.id),
                            )
                          }
                          size="small"
                          type="button"
                          variant="subtle"
                        />
                      </Tooltip>
                    </div>
                    <div className="field-grid">
                      <SelectField
                        label="Provider"
                        onChange={(provider) =>
                          updateMember(member.id, { provider })
                        }
                        options={providerOptions}
                        value={member.provider}
                      />
                      <InputField
                        label="Model ID"
                        onChange={(model) => updateMember(member.id, { model })}
                        value={member.model}
                      />
                    </div>
                    <InputField
                      label="Role / persona"
                      onChange={(role) => updateMember(member.id, { role })}
                      value={member.role}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {section === "prices" ? (
            <div className="sheet-stack">
              <div className="section-heading">
                <div>Pricing table</div>
                <p>
                  Prototype overrides per 1,000,000 tokens. Values are not
                  persisted.
                </p>
              </div>
              <div className="price-table">
                <div className="price-table__header">
                  <span>Model</span>
                  <span>Input / $</span>
                  <span>Output / $</span>
                </div>
                {draftPrices.map((price, index) => (
                  <div className="price-row" key={price.model}>
                    <code>{price.model}</code>
                    <InputField
                      aria-label={`${price.model} input price`}
                      onChange={(value) => updatePrice(index, "input", value)}
                      type="number"
                      value={price.input}
                    />
                    <InputField
                      aria-label={`${price.model} output price`}
                      onChange={(value) => updatePrice(index, "output", value)}
                      type="number"
                      value={price.output}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
