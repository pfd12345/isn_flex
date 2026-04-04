import {
  ShieldAlert,
  SearchCheck,
  Cpu,
  FlaskConical,
  Beaker,
  Activity,
  Link,
  Lightbulb,
  Stamp,
  FileText,
  Brain,
  Circle,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'shield-alert': ShieldAlert,
  'search-check': SearchCheck,
  cpu: Cpu,
  'flask-conical': FlaskConical,
  beaker: Beaker,
  activity: Activity,
  link: Link,
  lightbulb: Lightbulb,
  stamp: Stamp,
  'file-text': FileText,
  brain: Brain,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Circle;
}
