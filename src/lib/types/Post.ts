import type { ObjectId } from "mongodb";
import type { Timestamps } from "./Timestamps";
import type { Profile } from "./Profile";
import type { Conversation } from "./Conversation";

export type PostStatus = "draft" | "in_review" | "approved" | "published" | "archived";

export interface Post extends Timestamps {
	_id: ObjectId;
	profileId: Profile["_id"];
	conversationId?: Conversation["_id"];

	// Post content
	title: string; // Internal title for tracking
	caption: string; // The actual post caption
	hashtags?: string[];

	// Media
	images?: PostImage[];

	// Status and scheduling
	status: PostStatus;
	scheduledDate?: Date;
	publishedDate?: Date;

	// Engagement (optional, for published posts)
	likes?: number;
	comments?: number;
	shares?: number;

	// Notes
	notes?: string; // Internal notes about the post
}

export interface PostImage {
	type: "hash" | "url";
	value: string;
	alt?: string;
}
