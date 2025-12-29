/**
 * Database Schema with Neon Auth Row-Level Security
 *
 * This template includes:
 * - User-related tables with RLS policies
 * - Proper timestamps and defaults
 * - Type inference helpers
 * - Relations setup
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { authenticatedRole, authUid, crudPolicy } from 'drizzle-orm/neon';

// ============================================
// Users Table (if not using Neon Auth users_sync)
// ============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// Todos Table with Row-Level Security
// ============================================
export const todos = pgTable(
  'todos',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
    // Links to Neon Auth user via auth.user_id() function
    userId: text('user_id').notNull().default(sql`(auth.user_id())`),
    title: text('title').notNull(),
    description: text('description'),
    isComplete: boolean('is_complete').notNull().default(false),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Row-Level Security: users can only access their own todos
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ============================================
// Posts Table
// ============================================
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  slug: varchar('slug', { length: 255 }).unique(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }),
  published: boolean('published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// Tags Table
// ============================================
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// Post Tags (Many-to-Many)
// ============================================
export const postTags = pgTable('post_tags', {
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

// ============================================
// Relations
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  postTags: many(postTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

// ============================================
// Type Inference
// ============================================
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Todo = InferSelectModel<typeof todos>;
export type NewTodo = InferInsertModel<typeof todos>;

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;
