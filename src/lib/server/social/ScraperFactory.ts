import type { SocialPlatform } from "$lib/types/Profile";
import type { SocialScraper } from "./BaseSocialScraper";
import { InstagramScraper } from "./InstagramScraper";

/**
 * Factory for creating social media scrapers
 */
export class ScraperFactory {
	private static scrapers: Map<SocialPlatform, SocialScraper> = new Map();

	/**
	 * Get a scraper instance for the specified platform
	 */
	static getScraper(platform: SocialPlatform): SocialScraper {
		if (!this.scrapers.has(platform)) {
			this.scrapers.set(platform, this.createScraper(platform));
		}

		const scraper = this.scrapers.get(platform);
		if (!scraper) {
			throw new Error(`Failed to create scraper for platform: ${platform}`);
		}
		return scraper;
	}

	/**
	 * Create a new scraper instance
	 */
	private static createScraper(platform: SocialPlatform): SocialScraper {
		switch (platform) {
			case "instagram":
				return new InstagramScraper();
			case "facebook":
				throw new Error("Facebook scraper not yet implemented");
			case "twitter":
				throw new Error("Twitter scraper not yet implemented");
			case "linkedin":
				throw new Error("LinkedIn scraper not yet implemented");
			case "tiktok":
				throw new Error("TikTok scraper not yet implemented");
			default:
				throw new Error(`Unsupported platform: ${platform}`);
		}
	}

	/**
	 * Check if a platform is supported
	 */
	static isSupported(platform: SocialPlatform): boolean {
		return platform === "instagram";
	}

	/**
	 * Get list of supported platforms
	 */
	static getSupportedPlatforms(): SocialPlatform[] {
		return ["instagram"];
	}
}
