import { sqliteTable,text } from "drizzle-orm/sqlite-core";
export const settings=sqliteTable("digest_settings",{id:text("id").primaryKey(),payload:text("payload").notNull(),updatedAt:text("updated_at").notNull()});
export const issues=sqliteTable("digest_issues",{id:text("id").primaryKey(),date:text("date").notNull(),payload:text("payload").notNull(),updatedAt:text("updated_at").notNull()});
export const bookmarks=sqliteTable("digest_bookmarks",{id:text("id").primaryKey(),payload:text("payload").notNull(),createdAt:text("created_at").notNull()});
