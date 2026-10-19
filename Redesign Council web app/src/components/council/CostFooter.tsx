import { Badge, Home, Settings } from "@figma/astraui"

export default function CostFooter() {
  return (
    <footer className="cost-footer">
      <div className="cost-footer__stats">
        <span>
          <Settings size={14} /> 1,482 in
        </span>
        <span>/</span>
        <span>1,359 out</span>
        <span>$0.0318</span>
        <Badge label="Exact" variant="success" />
      </div>
      <div className="cost-footer__local">
        <Home size={14} />
        Local · 127.0.0.1
      </div>
    </footer>
  )
}
