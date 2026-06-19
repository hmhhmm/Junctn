"use client";

import { ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { getPartnerStats } from "@/lib/data";
import { PartnerStats } from "@/components/partner/PartnerStats";
import { ReferralInbox } from "@/components/partner/ReferralInbox";

export default function PartnerView() {
  const { partnerId, referrals } = useStore();
  const stats = getPartnerStats(partnerId, referrals);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-6">
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
          {stats.partner.name}
        </h1>
        <p className="text-[13px] text-ink-soft">
          {stats.partner.specialty} specialist · {stats.partner.region} region
        </p>
      </div>

      {/* Privacy boundary */}
      <div className="mb-5 flex items-start gap-2.5 rounded-md border border-line bg-accent-soft/40 p-3.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent-ink" />
        <p className="text-[13px] text-ink-soft">
          <span className="font-semibold text-ink">You see client needs shared by the advisor, not full client records.</span>{" "}
          Names and full details remain with the advisor until they choose to share more.
        </p>
      </div>

      <PartnerStats
        acceptanceRate={stats.acceptanceRate}
        avgDaysToClose={stats.avgDaysToClose}
        open={stats.open}
        total={stats.total}
      />

      <div className="mt-5">
        <ReferralInbox partnerId={partnerId} />
      </div>
    </div>
  );
}
