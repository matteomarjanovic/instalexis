import type { SocialPlatform } from "$lib/types/Profile";
import type {
	ImportedProfileData,
	SocialProfileData,
	SocialPostData,
} from "$lib/types/SocialImport";

export interface SocialScraper {
	platform: SocialPlatform;
	scrapeProfile(username: string): Promise<SocialProfileData>;
	scrapePosts(username: string, limit?: number): Promise<SocialPostData[]>;
	importProfile(username: string): Promise<ImportedProfileData>;
}

export abstract class BaseSocialScraper implements SocialScraper {
	abstract platform: SocialPlatform;

	abstract scrapeProfile(username: string): Promise<SocialProfileData>;
	abstract scrapePosts(username: string, limit?: number): Promise<SocialPostData[]>;

	async importProfile(username: string): Promise<ImportedProfileData> {
		const profile = await this.scrapeProfile(username);
		const recentPosts = await this.scrapePosts(username, 20);

		// Analyze tone and topics from posts
		const analyzedTone = this.analyzeTone(recentPosts);
		const detectedTopics = this.detectTopics(recentPosts);

		return {
			profile,
			recentPosts,
			analyzedTone,
			detectedTopics,
		};
	}

	protected analyzeTone(posts: SocialPostData[]): string {
		// Basic tone analysis based on caption characteristics
		// This is a simple heuristic - could be enhanced with ML
		const allCaptions = posts
			.map((p) => p.caption || "")
			.join(" ")
			.toLowerCase();

		const toneIndicators = {
			professional: ["professional", "business", "corporate", "official"],
			casual: ["hey", "lol", "omg", "guys", "friends"],
			inspirational: ["inspire", "motivate", "believe", "achieve", "dream"],
			educational: ["learn", "tip", "guide", "how to", "tutorial"],
			humorous: ["funny", "haha", "joke", "laugh", "😂"],
		};

		const scores: Record<string, number> = {};
		for (const [tone, keywords] of Object.entries(toneIndicators)) {
			scores[tone] = keywords.filter((kw) => allCaptions.includes(kw)).length;
		}

		const dominantTone = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
		return dominantTone?.[0] || "casual";
	}

	protected detectTopics(posts: SocialPostData[]): string[] {
		// Extract topics from hashtags and captions
		const topics = new Set<string>();

		posts.forEach((post) => {
			// Add hashtags as topics
			post.hashtags.forEach((tag) => {
				topics.add(tag.replace(/^#/, "").toLowerCase());
			});

			// Extract common words from captions (simple approach)
			if (post.caption) {
				const words = post.caption
					.toLowerCase()
					.split(/\s+/)
					.filter((w) => w.length > 4 && !w.startsWith("#") && !w.startsWith("@"));

				// Take top words (this is simplified - could use NLP)
				words.slice(0, 5).forEach((w) => topics.add(w));
			}
		});

		// Return top 10 topics
		return Array.from(topics).slice(0, 10);
	}
}
