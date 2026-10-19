import {
  Button,
  Home,
  MessageCircle,
  MousePointer,
  Settings,
} from "@figma/astraui"

interface FirstRunProps {
  onKeys: () => void
  onNewDebate: () => void
}

export default function FirstRun({ onKeys, onNewDebate }: FirstRunProps) {
  return (
    <section className="first-run">
      <div className="first-run__mark">
        <Home aria-hidden="true" size={28} />
      </div>
      <div className="eyebrow">Local debate workspace</div>
      <div className="first-run__title">No debates yet</div>
      <p className="first-run__intro">
        Configure at least one provider, review the default council, then give
        them a question worth disagreeing about.
      </p>
      <div className="setup-list">
        <div className="setup-step">
          <code>01</code>
          <div>
            <strong>Add a provider key</strong>
            <p>Keys stay in this prototype session only.</p>
          </div>
          <Settings aria-hidden="true" size={18} />
        </div>
        <div className="setup-step">
          <code>02</code>
          <div>
            <strong>Review the council</strong>
            <p>Four roles are ready; edit models and personas in Settings.</p>
          </div>
          <MousePointer aria-hidden="true" size={18} />
        </div>
        <div className="setup-step">
          <code>03</code>
          <div>
            <strong>Start the first round</strong>
            <p>Choose a focused topic and let the members challenge it.</p>
          </div>
          <MessageCircle aria-hidden="true" size={18} />
        </div>
      </div>
      <div className="first-run__actions">
        <Button
          iconStart={<Settings size={16} />}
          onClick={onKeys}
          type="button"
          variant="neutral"
        >
          Add provider keys
        </Button>
        <Button
          iconStart={<MessageCircle size={16} />}
          onClick={onNewDebate}
          type="button"
          variant="primary"
        >
          Start a debate
        </Button>
      </div>
    </section>
  )
}
