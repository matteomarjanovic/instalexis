import type { ObjectId } from "mongodb";
import type { Timestamps } from "./Timestamps";
import type { User } from "./User";

export type SocialPlatform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok";

export interface Profile extends Timestamps {
	_id: ObjectId;
	userId: User["_id"];

	name: string; // Display name for the profile (e.g., "My Fitness Brand")
	platform: SocialPlatform;
	handle?: string; // Social media handle (e.g., "@myfitnessbrand")

	// Profile settings
	description?: string;
	toneOfVoice?: string; // Description of the brand's tone of voice
	topics?: string[]; // Common topics for this profile
	targetAudience?: string; // Description of target audience

	// Avatar/image
	avatarUrl?: string;

	// Metadata
	isActive: boolean;
}
