import axios from "axios";
import { config } from "dotenv";
import { SampleStores, SampleProducts } from "@repo/seed-data";

config({
  path: "../../.env.local",
});

// ── Types ────────────────────────────────────────────────────
interface Product {
  id: string;
  store_id: string;
  price: number;
}

interface Store {
  id: string;
  currency: string;
}

interface SeedData {
  stores: Store[];
  products: Product[];
}

interface Event {
  event_id: string;
  store_id: string;
  event_type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ── Config ───────────────────────────────────────────────────
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

const EVENTS_PER_SECOND = Number(process.env.EVENTS_PER_SECOND ?? 50);
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 20);
const REALISTIC_MODE = process.env.REALISTIC_MODE === "true";

// ── Event type weights ────────────────────────────────────────
// Reflects a realistic eCommerce funnel:
// most traffic is page views, very few end in purchases
const EVENT_TYPES = [
  { type: "page_view", weight: 50 },
  { type: "add_to_cart", weight: 20 },
  { type: "remove_from_cart", weight: 10 },
  { type: "checkout_started", weight: 12 },
  { type: "purchase", weight: 8 },
];

// ── Helpers ──────────────────────────────────────────────────

// Weighted random pick from EVENT_TYPES
function pickEventType(): string {
  const total = EVENT_TYPES.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * total;
  for (const e of EVENT_TYPES) {
    rand -= e.weight;
    if (rand <= 0) return e.type;
  }
  return "page_view";
}

// Random item from an array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Unique event ID
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Realistic traffic multiplier based on hour of day (0-23)
// Peaks at lunch (12-14) and evening (19-21), quiet at night
function trafficMultiplier(hour: number): number {
  const curve: Record<number, number> = {
    0: 0.1,
    1: 0.1,
    2: 0.1,
    3: 0.1,
    4: 0.1,
    5: 0.2,
    6: 0.4,
    7: 0.6,
    8: 0.8,
    9: 1.0,
    10: 1.1,
    11: 1.2,
    12: 1.4,
    13: 1.5,
    14: 1.3,
    15: 1.1,
    16: 1.0,
    17: 1.1,
    18: 1.2,
    19: 1.5,
    20: 1.6,
    21: 1.4,
    22: 0.8,
    23: 0.4,
  };
  return curve[hour] ?? 1.0;
}

// Build a single event for a given store + product pool
function buildEvent(store: Store, products: Product[]): Event {
  const eventType = pickEventType();
  const product = pick(products);

  const baseData: Record<string, unknown> = {};

  if (eventType === "purchase") {
    baseData.product_id = product.id;
    baseData.amount = product.price;
    baseData.currency = store.currency;
  } else if (
    ["add_to_cart", "remove_from_cart", "checkout_started"].includes(eventType)
  ) {
    baseData.product_id = product.id;
    baseData.currency = store.currency;
  }
  // page_view has no extra data

  return {
    event_id: generateEventId(),
    store_id: store.id,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    data: baseData,
  };
}

// Send a batch of events to the ingest endpoint
async function sendBatch(events: Event[]): Promise<void> {
  try {
    await axios.post(
      `${API_BASE_URL}/api/v1/events/ingest`,
      { events },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      },
    );
  } catch (err) {
    // Log and continue — simulator should never crash on a failed batch
    if (axios.isAxiosError(err)) {
      console.error(`[simulator] Batch failed: ${err.message}`);
    }
  }
}

// ── Main loop ────────────────────────────────────────────────
async function run() {
  // Load seed data
  const seed: SeedData = {
    stores: SampleStores.map((store) => ({
      id: store.id,
      currency: store.currency,
    })),
    products: SampleProducts.map((product) => ({
      id: product.id,
      store_id: product.store_id,
      price: product.price,
    })),
  };

  // Build a per-store product lookup for fast access
  const productsByStore = new Map<string, Product[]>();
  for (const store of seed.stores) {
    productsByStore.set(
      store.id,
      seed.products.filter((p) => p.store_id === store.id),
    );
  }

  console.log(`[simulator] Starting`);
  console.log(`[simulator] Stores: ${seed.stores.length}`);
  console.log(`[simulator] Products: ${seed.products.length}`);
  console.log(`[simulator] Target rate: ${EVENTS_PER_SECOND} events/sec`);
  console.log(`[simulator] Batch size: ${BATCH_SIZE}`);
  console.log(`[simulator] Realistic mode: ${REALISTIC_MODE}`);
  console.log(`[simulator] API: ${API_BASE_URL}`);

  let batch: Event[] = [];

  // Interval fires every (1000ms / eventsPerSecond) to hit the target rate
  const baseIntervalMs = 1000 / EVENTS_PER_SECOND;

  const tick = async () => {
    // In realistic mode, scale the effective rate by time-of-day
    const multiplier = REALISTIC_MODE
      ? trafficMultiplier(new Date().getHours())
      : 1.0;

    // Skip this tick probabilistically when traffic should be low
    if (Math.random() > multiplier) {
      return;
    }

    // Pick a random store and build one event
    const store = pick(seed.stores);
    const products = productsByStore.get(store.id) ?? [];
    if (products.length === 0) return;

    batch.push(buildEvent(store, products));

    // Flush when batch is full
    if (batch.length >= BATCH_SIZE) {
      const toSend = batch.splice(0, BATCH_SIZE);
      console.log(`[simulator] Sending batch of ${toSend.length} events`);
      await sendBatch(toSend);
    }
  };

  // Run tick on interval
  setInterval(() => {
    tick().catch((err) => console.error("[simulator] Tick error:", err));
  }, baseIntervalMs);

  // Flush any remaining events every 5 seconds (handles low-traffic periods)
  // setInterval(async () => {
  //   if (batch.length > 0) {
  //     const toSend = batch.splice(0, batch.length);
  //     console.log(`[simulator] Flushing ${toSend.length} remaining events`);
  //     await sendBatch(toSend);
  //   }
  // }, 5000);
}

// setTimeout(() => {
//   run().catch((err) => {
//     console.error("[simulator] Fatal error:", err);
//     process.exit(1);
//   });
// }, 5000);
