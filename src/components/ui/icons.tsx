import {
  Add01Icon,
  ArrowRight02Icon,
  BracesIcon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  Cancel01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeIcon,
  Database02Icon,
  ExternalLinkIcon,
  Flowchart01Icon,
  FolderKanbanIcon,
  GripVerticalIcon as HugeiconsGripVerticalIcon,
  LayoutGridIcon,
  Loading03Icon,
  Login03Icon,
  Logout03Icon,
  Maximize02Icon,
  Message01Icon,
  Minimize02Icon,
  Moon02Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SentIcon,
  Settings01Icon,
  Share08Icon,
  SparklesIcon,
  Sun03Icon,
  Unlink02Icon,
  UserCircle02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  HugeiconsIcon,
  type HugeiconsIconProps,
  type IconSvgElement,
} from '@hugeicons/react'
import { forwardRef } from 'react'

type AppIconProps = Omit<HugeiconsIconProps, 'icon'>

function createIcon(icon: IconSvgElement, displayName: string) {
  const Icon = forwardRef<SVGSVGElement, AppIconProps>((props, ref) => (
    <HugeiconsIcon ref={ref} icon={icon} {...props} />
  ))

  Icon.displayName = displayName
  return Icon
}

export const ArrowRight = createIcon(ArrowRight02Icon, 'ArrowRight')
export const Braces = createIcon(BracesIcon, 'Braces')
export const BriefcaseBusiness = createIcon(
  BriefcaseBusinessIcon,
  'BriefcaseBusiness',
)
export const CalendarDays = createIcon(CalendarDaysIcon, 'CalendarDays')
export const ChevronLeft = createIcon(ChevronLeftIcon, 'ChevronLeft')
export const ChevronRight = createIcon(ChevronRightIcon, 'ChevronRight')
export const Code2 = createIcon(CodeIcon, 'Code2')
export const Database = createIcon(Database02Icon, 'Database')
export const ExternalLink = createIcon(ExternalLinkIcon, 'ExternalLink')
export const Eye = createIcon(ViewIcon, 'Eye')
export const FolderKanban = createIcon(FolderKanbanIcon, 'FolderKanban')
export const GripVerticalIcon = createIcon(
  HugeiconsGripVerticalIcon,
  'GripVerticalIcon',
)
export const LayoutGrid = createIcon(LayoutGridIcon, 'LayoutGrid')
export const LoaderCircle = createIcon(Loading03Icon, 'LoaderCircle')
export const LogIn = createIcon(Login03Icon, 'LogIn')
export const LogOut = createIcon(Logout03Icon, 'LogOut')
export const Maximize2 = createIcon(Maximize02Icon, 'Maximize2')
export const MessageSquare = createIcon(Message01Icon, 'MessageSquare')
export const MessageSquareText = createIcon(Message01Icon, 'MessageSquareText')
export const Minimize2 = createIcon(Minimize02Icon, 'Minimize2')
export const Moon = createIcon(Moon02Icon, 'Moon')
export const MoonStar = createIcon(Moon02Icon, 'MoonStar')
export const Network = createIcon(Flowchart01Icon, 'Network')
export const PanelLeftClose = createIcon(PanelLeftCloseIcon, 'PanelLeftClose')
export const PanelLeftOpen = createIcon(PanelLeftOpenIcon, 'PanelLeftOpen')
export const Plus = createIcon(Add01Icon, 'Plus')
export const Send = createIcon(SentIcon, 'Send')
export const Settings = createIcon(Settings01Icon, 'Settings')
export const Share2 = createIcon(Share08Icon, 'Share2')
export const Sparkles = createIcon(SparklesIcon, 'Sparkles')
export const Sun = createIcon(Sun03Icon, 'Sun')
export const Unlink2 = createIcon(Unlink02Icon, 'Unlink2')
export const UserCircle2 = createIcon(UserCircle02Icon, 'UserCircle2')
export const X = createIcon(Cancel01Icon, 'X')
