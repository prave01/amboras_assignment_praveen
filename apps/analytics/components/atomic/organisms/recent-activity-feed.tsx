'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { eventColorClass, type RecentEvent } from '@/lib/analytics/dashboard';

interface RecentActivityFeedProps {
  events: RecentEvent[];
  isLoading: boolean;
  hasError: boolean;
  timeTick: number;
}

export function RecentActivityFeed({
  events,
  isLoading,
  hasError,
  timeTick,
}: RecentActivityFeedProps) {
  return (
    <Card
      className="panel-surface fade-up rounded-3xl border-white/65 bg-white/75"
      style={{ animationDelay: '170ms' }}
    >
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Recent Activity</CardTitle>
        <CardDescription>Latest user behavior and checkout actions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={`activity-skeleton-${idx}`} className="space-y-2">
                <Skeleton className="h-4 w-2/5 rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
                {idx < 7 ? <Separator /> : null}
              </div>
            ))}
          </div>
        ) : hasError ? (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTriangle className="size-4" />
            <AlertTitle>Recent activity unavailable</AlertTitle>
            <AlertDescription>We could not load recent events. Please retry.</AlertDescription>
          </Alert>
        ) : (
          <div className="max-h-115 space-y-3 overflow-auto pr-1">
            {events.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No events recorded yet.</p>
            ) : (
              events.map((event) => (
                <article
                  key={event.eventId ?? `${event.timestamp}-${event.eventType}-${timeTick}`}
                  className="rounded-xl border border-border/70 bg-white/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={eventColorClass(event.eventType)}>
                      {event.eventType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                    <p>
                      Product:{' '}
                      <span className="font-medium text-foreground">{event.productId ?? '-'}</span>
                    </p>
                    <p>
                      Amount:{' '}
                      <span className="font-medium text-foreground">
                        {event.amount == null ? '-' : formatCurrency(event.amount)}
                      </span>
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
