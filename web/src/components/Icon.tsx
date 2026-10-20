import {
  Plus,
  History,
  KeyRound,
  Settings,
  Download,
  Bookmark,
  Play,
  Square,
  FileText,
  Compass,
  Send,
  VolumeX,
  Volume2,
  Pencil,
  Trash2,
  Crown,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  ChevronRight,
  Sun,
  Moon,
  RotateCcw,
  X,
  Sliders,
  Users,
  DollarSign,
  Search,
  ArrowRight,
} from "lucide-react";

export type IconName =
  | "plus"
  | "history"
  | "key-round"
  | "settings"
  | "download"
  | "bookmark"
  | "play"
  | "square"
  | "file-text"
  | "compass"
  | "send"
  | "volume-x"
  | "volume-2"
  | "pencil"
  | "trash-2"
  | "crown"
  | "copy"
  | "refresh-cw"
  | "eye"
  | "eye-off"
  | "triangle-alert"
  | "circle-alert"
  | "circle-check"
  | "chevron-right"
  | "sun"
  | "moon"
  | "rotate-ccw"
  | "x"
  | "sliders"
  | "users"
  | "dollar-sign"
  | "search"
  | "arrow-right";

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className = "",
}: IconProps) {
  const props = { size, strokeWidth, className, color: "currentColor" };

  switch (name) {
    case "plus":
      return <Plus {...props} />;
    case "history":
      return <History {...props} />;
    case "key-round":
      return <KeyRound {...props} />;
    case "settings":
      return <Settings {...props} />;
    case "download":
      return <Download {...props} />;
    case "bookmark":
      return <Bookmark {...props} />;
    case "play":
      return <Play {...props} />;
    case "square":
      return <Square {...props} />;
    case "file-text":
      return <FileText {...props} />;
    case "compass":
      return <Compass {...props} />;
    case "send":
      return <Send {...props} />;
    case "volume-x":
      return <VolumeX {...props} />;
    case "volume-2":
      return <Volume2 {...props} />;
    case "pencil":
      return <Pencil {...props} />;
    case "trash-2":
      return <Trash2 {...props} />;
    case "crown":
      return <Crown {...props} />;
    case "copy":
      return <Copy {...props} />;
    case "refresh-cw":
      return <RefreshCw {...props} />;
    case "eye":
      return <Eye {...props} />;
    case "eye-off":
      return <EyeOff {...props} />;
    case "triangle-alert":
      return <TriangleAlert {...props} />;
    case "circle-alert":
      return <CircleAlert {...props} />;
    case "circle-check":
      return <CircleCheck {...props} />;
    case "chevron-right":
      return <ChevronRight {...props} />;
    case "sun":
      return <Sun {...props} />;
    case "moon":
      return <Moon {...props} />;
    case "rotate-ccw":
      return <RotateCcw {...props} />;
    case "x":
      return <X {...props} />;
    case "sliders":
      return <Sliders {...props} />;
    case "users":
      return <Users {...props} />;
    case "dollar-sign":
      return <DollarSign {...props} />;
    case "search":
      return <Search {...props} />;
    case "arrow-right":
      return <ArrowRight {...props} />;
    default:
      return <Plus {...props} />;
  }
}
