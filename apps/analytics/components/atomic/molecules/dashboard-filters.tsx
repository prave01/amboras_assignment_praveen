'use client';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TimeRange } from '@/lib/analytics/dashboard';

interface DashboardFiltersProps {
  range: TimeRange;
  startDate: string;
  endDate: string;
  onRangeChange: (range: TimeRange) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearDates: () => void;
  onGoLive: () => void;
  isLiveView: boolean;
}

const TIME_RANGES: TimeRange[] = ['today', 'week', 'month', 'custom'];

export function DashboardFilters({
  range,
  startDate,
  endDate,
  onRangeChange,
  onStartDateChange,
  onEndDateChange,
  onClearDates,
  onGoLive,
  isLiveView,
}: DashboardFiltersProps) {
  const isCustomRange = range === 'custom';

  return (
    <section className="panel-surface mt-6 rounded-3xl px-5 py-4 md:px-6 md:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            <Filter className="size-3.5" />
            Time filters
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Filter the product ranking and activity stream by preset period or a custom date range.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TIME_RANGES.map((option) => (
            <Button
              key={option}
              variant={range === option ? 'default' : 'outline'}
              size="sm"
              className="rounded-full px-4 capitalize transition-transform duration-150 ease-out active:scale-[0.98]"
              onClick={() => onRangeChange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      {isCustomRange ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Start date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="h-11 rounded-xl bg-white/75"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              End date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="h-11 rounded-xl bg-white/75"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="h-11 rounded-xl border border-border/70 bg-white/70 px-4"
              onClick={onClearDates}
            >
              Clear dates
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Filters update the table and activity feed automatically. Relative timestamps keep ticking
          in the background.
        </p>
        <Button
          variant={isLiveView ? 'default' : 'outline'}
          className="h-10 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 transition-transform duration-150 ease-out hover:bg-emerald-100 active:scale-[0.98]"
          onClick={onGoLive}
        >
          <span className="mr-2 size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
          {isLiveView ? 'Live now' : 'Go live'}
        </Button>
      </div>
    </section>
  );
}
