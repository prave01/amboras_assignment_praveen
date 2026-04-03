"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { TopProduct } from "@/lib/analytics/dashboard";

interface TopProductsTableProps {
  products: TopProduct[];
  isLoading: boolean;
  hasError: boolean;
}

export function TopProductsTable({ products, isLoading, hasError }: TopProductsTableProps) {
  return (
    <Card className="panel-surface fade-up rounded-3xl border-white/65 bg-white/75" style={{ animationDelay: "120ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Top Products</CardTitle>
        <CardDescription>Highest-performing products by purchase revenue.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={`product-row-skeleton-${idx}`} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : hasError ? (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTriangle className="size-4" />
            <AlertTitle>Top products unavailable</AlertTitle>
            <AlertDescription>We could not load product rankings right now.</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Rank</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Purchase Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No product data available.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={`${product.productId ?? "unknown"}-${product.rank}`}>
                    <TableCell className="font-medium">#{product.rank}</TableCell>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatInteger(product.purchaseCount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
