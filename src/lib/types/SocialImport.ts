export interface SocialProfileData {
	username: string;
	displayName: string;
	bio?: string;
	avatarUrl?: string;
	followerCount?: number;
	followingCount?: number;
	postCount?: number;
	isVerified?: boolean;
	externalUrl?: string;
	category?: string;
}

export interface SocialPostData {
	id: string;
	caption?: string;
	mediaUrls: string[];
	mediaType: "image" | "video" | "carousel";
	likeCount?: number;
	commentCount?: number;
	timestamp: Date;
	hashtags: string[];
}

export interface ImportedProfileData {
	profile: SocialProfileData;
	recentPosts: SocialPostData[];
	analyzedTone?: string;
	detectedTopics?: string[];
}
