import { DatabaseError } from "pg";
import { db } from "./db";
import {
  users,
  stores,
  products,
  UserInsert,
  StoreInsert,
  ProductInsert,
} from "./schema";
import { SampleUsers, SampleStores, SampleProducts } from "@repo/seed-data";
import bcrypt from "bcrypt";

const seed = async () => {
  try {
    await db.transaction(async (tx) => {
      console.log("Seeding started...");

      const buildUsers: UserInsert[] = await Promise.all(
        SampleUsers.map(async (u) => {
          const hashedPassword = await bcrypt.hash(u.password, 10);

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            password: hashedPassword,
          };
        }),
      );

      const createdUsers = await tx.insert(users).values(buildUsers).returning({
        id: users.id,
        email: users.email,
      });

      const userMap = new Map(createdUsers.map((u) => [u.email, u.id]));

      const buildStores: StoreInsert[] = SampleStores.map((store) => {
        const owner = SampleUsers.find((u) => u.id === store.owner_id);

        if (!owner) {
          throw new Error(`Owner not found for store ${store.name}`);
        }

        const ownerId = userMap.get(owner.email);

        if (!ownerId) {
          throw new Error(`User ID missing for ${owner.email}`);
        }

        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          currency: store.currency,
          ownerId,
        };
      });

      const createdStores = await tx
        .insert(stores)
        .values(buildStores)
        .returning({
          id: stores.id,
          slug: stores.slug,
        });

      const storeMap = new Map(createdStores.map((s) => [s.slug, s.id]));

      const buildProducts: ProductInsert[] = SampleProducts.map((product) => {
        const store = SampleStores.find((s) => s.id === product.store_id);

        if (!store) {
          throw new Error(`Store not found for product ${product.name}`);
        }

        const storeId = storeMap.get(store.slug);

        if (!storeId) {
          throw new Error(`Store ID missing for slug ${store.slug}`);
        }

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price.toString(),
          storeId,
        };
      });

      const createdProducts = await tx
        .insert(products)
        .values(buildProducts)
        .returning({
          id: products.id,
          name: products.name,
        });

      console.log("Seeding completed");
      console.log({
        users: createdUsers.length,
        stores: createdStores.length,
        products: createdProducts.length,
      });
    });
  } catch (err) {
    if (err instanceof DatabaseError) {
      console.error("DB Error:", err.message);
    } else {
      console.error("Something went wrong:", err);
    }
  }
};

seed();
