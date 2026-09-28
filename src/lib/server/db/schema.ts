import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").notNull(),
	passwordHash: text("password_hash").notNull(),
	userType: integer("user_type").notNull().default(2),
	isEmailVerified: integer("is_email_verified", { mode: "boolean" }).notNull().default(true),
	avatarUrl: text("avatar_url").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const clubs = sqliteTable("clubs", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	cadence: text("cadence").notNull(),
	inviteCode: text("invite_code").notNull().unique(),
	advancedReviews: integer("advanced_reviews", { mode: "boolean" }).notNull().default(false),
	createdBy: text("created_by").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const clubMembers = sqliteTable("club_members", {
	id: text("id").primaryKey(),
	clubId: text("club_id").notNull(),
	userId: text("user_id").notNull(),
	role: text("role").notNull().default("member"),
	currentPage: integer("current_page").notNull().default(0),
	joinedAt: integer("joined_at").notNull(),
});

export const readingCycles = sqliteTable("reading_cycles", {
	id: text("id").primaryKey(),
	clubId: text("club_id").notNull(),
	bookId: text("book_id").notNull(),
	bookTitle: text("book_title").notNull(),
	bookAuthors: text("book_authors").notNull(),
	bookDescription: text("book_description"),
	bookPageCount: integer("book_page_count").notNull(),
	bookCoverUrl: text("book_cover_url"),
	bookInfoUrl: text("book_info_url"),
	bookBuyUrl: text("book_buy_url"),
	bookSourceProvider: text("book_source_provider"),
	startDate: integer("start_date").notNull(),
	endDate: integer("end_date").notNull(),
	cadence: text("cadence").notNull(),
	status: text("status").notNull().default("active"),
	pdfKey: text("pdf_key"),
	createdAt: integer("created_at").notNull(),
});

export const discussions = sqliteTable("discussions", {
	id: text("id").primaryKey(),
	clubId: text("club_id").notNull(),
	cycleId: text("cycle_id").notNull(),
	userId: text("user_id").notNull(),
	username: text("username").notNull(),
	avatarUrl: text("avatar_url").notNull(),
	content: text("content").notNull(),
	pageReference: integer("page_reference").notNull().default(0),
	createdAt: integer("created_at").notNull(),
});

export const reviews = sqliteTable("reviews", {
	id: text("id").primaryKey(),
	clubId: text("club_id").notNull(),
	cycleId: text("cycle_id").notNull(),
	userId: text("user_id").notNull(),
	username: text("username").notNull(),
	avatarUrl: text("avatar_url").notNull(),
	rating: real("rating").notNull(),
	criteria: text("criteria"),
	comment: text("comment"),
	createdAt: integer("created_at").notNull(),
});

export const selectionNominations = sqliteTable("selection_nominations", {
	id: text("id").primaryKey(),
	clubId: text("club_id").notNull(),
	bookData: text("book_data").notNull(),
	colorIndex: integer("color_index").notNull().default(0),
	nominatedBy: text("nominated_by").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const selectionPolls = sqliteTable("selection_polls", {
	id: text("id").primaryKey(),
	clubId: text("club_id").notNull(),
	status: text("status").notNull().default("active"),
	expiresAt: integer("expires_at").notNull(),
	winnerCandidateId: text("winner_candidate_id"),
	createdAt: integer("created_at").notNull(),
});

export const pollVotes = sqliteTable("poll_votes", {
	id: text("id").primaryKey(),
	pollId: text("poll_id").notNull(),
	userId: text("user_id").notNull(),
	candidateId: text("candidate_id").notNull(),
	createdAt: integer("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Club = typeof clubs.$inferSelect;
export type NewClub = typeof clubs.$inferInsert;
export type ClubMember = typeof clubMembers.$inferSelect;
export type NewClubMember = typeof clubMembers.$inferInsert;
export type ReadingCycleRecord = typeof readingCycles.$inferSelect;
export type NewReadingCycle = typeof readingCycles.$inferInsert;
export type DiscussionRecord = typeof discussions.$inferSelect;
export type NewDiscussion = typeof discussions.$inferInsert;
export type ReviewRecord = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type SelectionNominationRecord = typeof selectionNominations.$inferSelect;
export type NewSelectionNomination = typeof selectionNominations.$inferInsert;
export type SelectionPollRecord = typeof selectionPolls.$inferSelect;
export type NewSelectionPoll = typeof selectionPolls.$inferInsert;
export type PollVoteRecord = typeof pollVotes.$inferSelect;
export type NewPollVote = typeof pollVotes.$inferInsert;
