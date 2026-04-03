import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type UserInsert = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  currency: text('currency').notNull().default('USD'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type StoreInsert = typeof stores.$inferInsert;

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ProductInsert = typeof products.$inferInsert;

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: text('event_id').notNull().unique(), // external idempotency key (evt_xxx)
    storeId: uuid('store_id').notNull(),
    eventType: text('event_type').notNull(), // page_view | add_to_cart | remove_from_cart | checkout_started | purchase
    timestamp: timestamp('timestamp').notNull(),
    productId: uuid('product_id'), // null for page_view
    amount: numeric('amount', { precision: 10, scale: 2 }), // only for purchase
    currency: text('currency'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    storeTimeIdx: index('idx_events_store_time').on(
      table.storeId,
      table.timestamp,
    ),
    purchasesIdx: index('idx_events_purchases').on(table.storeId, table.amount),
    eventIdIdx: uniqueIndex('idx_events_event_id').on(table.eventId),
  }),
);

export type EventInsert = typeof events.$inferInsert;

export const preAggregatedMetrics = pgTable(
  'pre_aggregated_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    period: text('period').notNull(), // 'today' | 'week' | 'month'
    totalRevenue: numeric('total_revenue', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),
    totalEvents: integer('total_events').notNull().default(0),
    purchaseCount: integer('purchase_count').notNull().default(0),
    pageViewCount: integer('page_view_count').notNull().default(0),
    conversionRate: numeric('conversion_rate', { precision: 6, scale: 4 })
      .notNull()
      .default('0'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (table) => ({
    storeperiodIdx: uniqueIndex('idx_metrics_store_period').on(
      table.storeId,
      table.period,
    ),
  }),
);

export const PreAggregatedMetricsSchema =
  createInsertSchema(preAggregatedMetrics);

export const topProductsCache = pgTable(
  'top_products_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    period: text('period').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    productName: text('product_name').notNull(),
    totalRevenue: numeric('total_revenue', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),
    purchaseCount: integer('purchase_count').notNull().default(0),
    rank: integer('rank').notNull(),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (table) => ({
    storeperiodIdx: uniqueIndex('idx_top_products_store_period_rank').on(
      table.storeId,
      table.period,
      table.rank,
    ),
  }),
);
