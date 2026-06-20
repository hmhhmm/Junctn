import Link from "next/link";
import {
  MessageSquareWarning,
  Sparkles,
  FileWarning,
  CheckCircle2,
  ChevronRight,
  Video,
  Phone,
  MapPin,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";

const flagStyles = {
  followup: { icon: MessageSquareWarning, cls: "bg-alert-soft text-alert" },
  match: { icon: Sparkles, cls: "bg-accent-soft text-accent-ink" },
  missing: { icon: FileWarning, cls: "bg-warn-soft text-warn" },
  logged: { icon: CheckCircle2, cls: "bg-ok-soft text-ok" },
} as const;

const channelIcon = {
  "In person": MapPin,
  Video: Video,
  Call: Phone,
  Office: Building,
} as const;

export function ScheduleList({ meetings }: { meetings: Meeting[] }) {
  return (
    <Card id="schedule">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Today&apos;s schedule</CardTitle>
        <span className="text-[11px] text-ink-faint">{meetings.length} meetings</span>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="flex flex-col">
          {meetings.map((mt, i) => {
            const Flag = mt.flag ? flagStyles[mt.flag.kind] : null;
            const ChannelIcon = channelIcon[mt.channel];
            const Inner = (
              <div
                className={cn(
                  "flex gap-4 py-3.5",
                  i !== meetings.length - 1 && "border-b border-line",
                )}
              >
                {/* mono time column */}
                <div className="w-12 shrink-0 pt-0.5 text-right">
                  <span className="font-mono text-[13px] font-medium text-ink">{mt.time}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink">{mt.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-faint">
                    <ChannelIcon className="size-3.5" />
                    {mt.channel} · {mt.meta}
                  </p>
                  {mt.flag && Flag && (
                    <span
                      className={cn(
                        "mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
                        Flag.cls,
                      )}
                    >
                      <Flag.icon className="size-3.5" />
                      {mt.flag.text}
                    </span>
                  )}
                </div>
                {mt.clientId && (
                  <ChevronRight className="mt-1 size-4 shrink-0 self-start text-ink-faint" />
                )}
              </div>
            );
            return (
              <li key={mt.id}>
                {mt.clientId ? (
                  <Link
                    href={`/advisor/clients/${mt.clientId}`}
                    className="block rounded-md transition-colors hover:bg-surface-hover"
                  >
                    {Inner}
                  </Link>
                ) : (
                  Inner
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
