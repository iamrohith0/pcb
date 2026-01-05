import {
    Activity,
    Plus,
    AlertCircle,
    AlertTriangle,
    ArrowDown,
    ArrowDownRight,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    BarChart,
    Bell,
    Box,
    BoxSelect,
    Building,
    Building2,
    Calendar,
    XCircle,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CircuitBoard,
    Clipboard,
    Clock,
    X,
    Cloud,
    Cpu,
    Database,
    Delete,
    Download,
    Edit,
    Eye,
    Factory,
    File,
    FileText,
    Filter,
    Folder,
    FolderOpen,
    Grid,
    Hammer,
    HelpCircle,
    Home,
    Info,
    Key,
    Layers,
    Layout,
    Link,
    List,
    Lock,
    LogOut,
    Mail,
    Menu,
    MessageSquare,
    MoreHorizontal,
    MoreVertical,
    Package,
    PieChart,
    RefreshCcw,
    Minus,
    Save,
    Search,
    Server,
    Settings,
    Share,
    Target,
    Trash,
    Trash2,
    TrendingDown,
    TrendingUp,
    Truck,
    Unlink,
    Unlock,
    Upload,
    User,
    UserCheck,
    UserMinus,
    UserPlus,
    Users,
    UserX,
    Wrench,
} from "lucide-react";

/**
 * Icons Component
 * 
 * A centralized icons export that provides access to all lucide-react icons.
 * This module re-exports commonly used icons from lucide-react for consistent
 * usage throughout the application.
 * 
 * Usage:
 * import { Icons } from "@/components/icons";
 * <Icons.trash className="h-4 w-4" />
 */
const Icons = {
  // Core actions
  trash: Trash,
  trash2: Trash2,
  delete: Delete,
  remove: Minus,
  add: Plus,
  edit: Edit,
  view: Eye,
  save: Save,
  cancel: XCircle,
  close: X,
  check: Check,
  checkCircle: CheckCircle,
  
  // Navigation
  home: Home,
  menu: Menu,
  back: ArrowLeft,
  forward: ArrowRight,
  up: ArrowUp,
  down: ArrowDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  settings: Settings,
  
  // User & Auth
  user: User,
  users: Users,
  userPlus: UserPlus,
  userMinus: UserMinus,
  userCheck: UserCheck,
  userX: UserX,
  logOut: LogOut,
  lock: Lock,
  unlock: Unlock,
  key: Key,
  
  // Alerts & Status
  alert: AlertCircle,
  alertCircle: AlertCircle,
  alertTriangle: AlertTriangle,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
  info: Info,
  help: HelpCircle,
  questionCircle: HelpCircle,
  
  // Business entities
  building: Building,
  building2: Building2,
  factory: Factory,
  warehouse: Building,
  organization: Building,
  
  // Operations
  package: Package,
  box: Box,
  boxes: BoxSelect,
  truck: Truck,
  shipping: Truck,
  clipboard: Clipboard,
  clipboardCheck: Clipboard,
  production: Factory,
  inventory: Package,
  
  // Data & Charts
  chart: BarChart,
  barChart: BarChart,
  pieChart: PieChart,
  activity: Activity,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  target: Target,
  analytics: Activity,
  
  // Technical
  database: Database,
  server: Server,
  cloud: Cloud,
  api: Database,
  circuitBoard: CircuitBoard,
  component: Cpu,
  
  // Tools & Equipment
  wrench: Wrench,
  tool: Wrench,
  hammer: Hammer,
  screwdriver: Wrench,
  maintenance: Wrench,
  
  // Time & Date
  calendar: Calendar,
  clock: Clock,
  history: Clock,
  schedule: Calendar,
  
  // Files
  file: File,
  folder: Folder,
  folderOpen: FolderOpen,
  fileText: FileText,
  document: FileText,
  download: Download,
  upload: Upload,
  export: Download,
  import: Upload,
  
  // Communication
  bell: Bell,
  notification: Bell,
  mail: Mail,
  email: Mail,
  message: MessageSquare,
  chat: MessageSquare,
  
  // Search & Filter
  search: Search,
  filter: Filter,
  find: Search,
  
  // UI Controls
  refresh: RefreshCcw,
  sync: RefreshCcw,
  expand: ArrowUpRight,
  collapse: ArrowDownRight,
  maximize: ArrowUpRight,
  minimize: ArrowDownRight,
  
  // Links & Sharing
  link: Link,
  unlink: Unlink,
  share: Share,
  external: ArrowUpRight,
  
  // Layout & Display
  grid: Grid,
  list: List,
  layout: Layout,
  layers: Layers,
};

export { Icons };
export default Icons;