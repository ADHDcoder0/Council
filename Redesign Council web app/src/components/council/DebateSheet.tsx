import {
  Button,
  ButtonGroup,
  Modal,
  Play,
  SelectField,
  TextareaField,
} from "@figma/astraui"
import { useEffect, useState } from "react"
import { debateSuggestions } from "@/data/council"

interface DebateSheetProps {
  isOpen: boolean
  onClose: () => void
  onBegin: (topic: string) => void
}

export default function DebateSheet({
  isOpen,
  onClose,
  onBegin,
}: DebateSheetProps) {
  const [topic, setTopic] = useState("")
  const [words, setWords] = useState("120")
  const [rounds, setRounds] = useState("1")

  useEffect(() => {
    if (isOpen) {
      setTopic("")
      setWords("120")
      setRounds("1")
    }
  }, [isOpen])

  return (
    <Modal
      className="council-modal"
      footer={
        <ButtonGroup align="end">
          <Button onClick={onClose} type="button" variant="neutral">
            Cancel
          </Button>
          <Button
            disabled={!topic.trim()}
            iconStart={<Play size={16} />}
            onClick={() => onBegin(topic.trim())}
            type="button"
            variant="primary"
          >
            Begin debate
          </Button>
        </ButtonGroup>
      }
      isOpen={isOpen}
      onClose={onClose}
      size="medium"
      title="Start a new Council debate"
    >
      <div className="sheet-stack">
        <TextareaField
          label="Topic or question"
          onChange={setTopic}
          placeholder="What should the council debate?"
          rows={4}
          value={topic}
        />
        <div className="suggestion-list">
          <div className="field-note">Or pick an idea to explore</div>
          {debateSuggestions.map((suggestion) => (
            <Button
              className="suggestion-button"
              key={suggestion}
              onClick={() => setTopic(suggestion)}
              size="small"
              type="button"
              variant="subtle"
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <div className="field-grid">
          <SelectField
            label="Words per turn"
            onChange={setWords}
            options={[
              { value: "80", label: "80 words · concise" },
              { value: "120", label: "120 words · balanced" },
              { value: "200", label: "200 words · detailed" },
            ]}
            value={words}
          />
          <SelectField
            label="Initial rounds"
            onChange={setRounds}
            options={[
              { value: "1", label: "1 round" },
              { value: "2", label: "2 rounds" },
              { value: "3", label: "3 rounds" },
            ]}
            value={rounds}
          />
        </div>
      </div>
    </Modal>
  )
}
