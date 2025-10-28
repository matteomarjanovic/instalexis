import { BaseSocialScraper } from "./BaseSocialScraper";
import type { SocialProfileData, SocialPostData } from "$lib/types/SocialImport";
import { logger } from "$lib/server/logger";

/**
 * Instagram scraper implementation
 *
 * Note: Instagram's official API requires app review and has limitations.
 * This implementation uses web scraping as a fallback, which has the following considerations:
 *
 * 1. For production: Consider using Instagram Graph API with proper app review
 * 2. Rate limiting: Instagram may block excessive requests
 * 3. Terms of Service: Ensure compliance with Instagram's terms
 * 4. Alternative: Use services like Apify, ScraperAPI, or similar
 */
export class InstagramScraper extends BaseSocialScraper {
	platform = "instagram" as const;

	private readonly BASE_URL = "https://www.instagram.com";

	/**
	 * Scrape Instagram profile information
	 * Uses the public web endpoint that doesn't require authentication
	 */
	async scrapeProfile(username: string): Promise<SocialProfileData> {
		try {
			// Remove @ symbol if present
			const cleanUsername = username.replace(/^@/, "");

			// Fetch the profile page
			const url = `${this.BASE_URL}/${cleanUsername}/?__a=1&__d=dis`;

			logger.info(`Scraping Instagram profile: ${cleanUsername}`);

			const response = await fetch(url, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				// Fallback: Try scraping the HTML page
				return this.scrapeProfileFromHTML(cleanUsername);
			}

			const data = await response.json();
			const user = data?.graphql?.user || data?.user;

			if (!user) {
				throw new Error("Profile not found");
			}

			return {
				username: user.username,
				displayName: user.full_name || user.username,
				bio: user.biography,
				avatarUrl: user.profile_pic_url_hd || user.profile_pic_url,
				followerCount: user.edge_followed_by?.count,
				followingCount: user.edge_follow?.count,
				postCount: user.edge_owner_to_timeline_media?.count,
				isVerified: user.is_verified,
				externalUrl: user.external_url,
				category: user.category_name,
			};
		} catch (error) {
			logger.error(`Error scraping Instagram profile ${username}:`, error);
			throw new Error(`Failed to scrape Instagram profile: ${error}`);
		}
	}

	/**
	 * Fallback method to scrape profile from HTML when JSON endpoint fails
	 */
	private async scrapeProfileFromHTML(username: string): Promise<SocialProfileData> {
		const url = `${this.BASE_URL}/${username}/`;

		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch profile: ${response.statusText}`);
		}

		const html = await response.text();

		// Extract JSON data from script tag
		const scriptRegex = /<script type="application\/ld\+json">({.*?})<\/script>/s;
		const match = html.match(scriptRegex);

		if (match) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const jsonData = JSON.parse(match[1]) as any;
			return {
				username,
				displayName: jsonData.name || username,
				bio: jsonData.description,
				avatarUrl: jsonData.image,
				followerCount: jsonData.interactionStatistic?.find(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(s: any) =>
						s["@type"] === "InteractionCounter" &&
						s.interactionType === "http://schema.org/FollowAction"
				)?.userInteractionCount,
			};
		}

		// Basic fallback
		return {
			username,
			displayName: username,
		};
	}

	/**
	 * Scrape recent posts from Instagram profile
	 */
	async scrapePosts(username: string, limit = 12): Promise<SocialPostData[]> {
		try {
			const cleanUsername = username.replace(/^@/, "");
			const url = `${this.BASE_URL}/${cleanUsername}/?__a=1&__d=dis`;

			logger.info(`Scraping Instagram posts for: ${cleanUsername}`);

			const response = await fetch(url, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				logger.warn(`Instagram API returned ${response.status}, returning empty posts`);
				return [];
			}

			const data = await response.json();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const edges: any[] =
				data?.graphql?.user?.edge_owner_to_timeline_media?.edges ||
				data?.user?.edge_owner_to_timeline_media?.edges ||
				[];

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const posts: SocialPostData[] = edges.slice(0, limit).map((edge: any) => {
				const node = edge.node;

				// Extract hashtags from caption
				const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || "";
				const hashtags = caption.match(/#[\w]+/g) || [];

				// Determine media type
				let mediaType: "image" | "video" | "carousel" = "image";
				if (node.__typename === "GraphVideo") {
					mediaType = "video";
				} else if (node.__typename === "GraphSidecar") {
					mediaType = "carousel";
				}

				// Get media URLs
				const mediaUrls = [node.display_url];
				if (node.edge_sidecar_to_children) {
					mediaUrls.push(
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						...node.edge_sidecar_to_children.edges.map((e: any) => e.node.display_url)
					);
				}

				return {
					id: node.id,
					caption,
					mediaUrls,
					mediaType,
					likeCount: node.edge_liked_by?.count,
					commentCount: node.edge_media_to_comment?.count,
					timestamp: new Date(node.taken_at_timestamp * 1000),
					hashtags,
				};
			});

			return posts;
		} catch (error) {
			logger.error(`Error scraping Instagram posts for ${username}:`, error);
			// Return empty array instead of throwing to allow partial profile import
			return [];
		}
	}
}
