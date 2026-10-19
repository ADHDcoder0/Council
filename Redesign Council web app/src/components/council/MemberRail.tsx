import type { CouncilMember } from "@/types/council"
import MemberRow from "./MemberRow"

interface MemberRailProps {
  members: CouncilMember[]
  activeMemberId?: string
}

export default function MemberRail({
  members,
  activeMemberId,
}: MemberRailProps) {
  return (
    <aside className="member-rail" aria-label="Council members">
      <div className="eyebrow">
        Council members <span>({members.length})</span>
      </div>
      <div className="member-rail__list">
        {members.map((member) => (
          <MemberRow
            active={member.id === activeMemberId}
            key={member.id}
            member={member}
          />
        ))}
      </div>
    </aside>
  )
}
