import { Badge, IconButton, Mic, Tooltip, Type, X } from "@figma/astraui"
import { useState } from "react"
import type { CouncilMember } from "@/types/council"

interface MemberRowProps {
  member: CouncilMember
  active?: boolean
}

export default function MemberRow({ member, active = false }: MemberRowProps) {
  const [muted, setMuted] = useState(false)

  return (
    <div
      className={`member-row member-${member.tone} ${
        active ? "is-active" : ""
      } ${muted ? "is-muted" : ""}`}
    >
      <div className="member-row__heading">
        <div className="member-row__name">
          <span className="member-dot" aria-hidden="true" />
          <span>{member.name}</span>
          {member.isChair ? <Badge label="Chair" variant="warning" /> : null}
        </div>
        <div className="member-row__actions">
          <Tooltip content={muted ? "Unmute member" : "Mute member"}>
            <IconButton
              aria-label={muted ? "Unmute member" : "Mute member"}
              icon={muted ? <X size={16} /> : <Mic size={16} />}
              onClick={() => setMuted((value) => !value)}
              size="small"
              type="button"
              variant="subtle"
            />
          </Tooltip>
          <Tooltip content="Edit member">
            <IconButton
              aria-label={`Edit ${member.name}`}
              icon={<Type size={16} />}
              size="small"
              type="button"
              variant="subtle"
            />
          </Tooltip>
        </div>
      </div>
      <div className="member-row__model">
        <span>{member.provider}</span>
        <code>{member.model}</code>
      </div>
      <p>{member.role}</p>
      {active ? (
        <span className="member-row__activity">Generating response</span>
      ) : null}
    </div>
  )
}
