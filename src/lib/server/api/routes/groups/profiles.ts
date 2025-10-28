import { Elysia, error, t } from "elysia";
import { authPlugin } from "$api/authPlugin";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";
import type { Profile } from "$lib/types/Profile";
import { ScraperFactory } from "$lib/server/social/ScraperFactory";
import { logger } from "$lib/server/logger";
import type { Post } from "$lib/types/Post";

export const profileGroup = new Elysia().use(authPlugin).group("/profiles", (app) => {
	return (
		app
			.guard({
				as: "scoped",
				beforeHandle: async ({ locals }) => {
					if (!locals.user?._id && !locals.sessionId) {
						return error(401, "Must have a valid session or user");
					}
				},
			})
			// List all profiles for the user
			.get("", async ({ locals }) => {
				const userId = locals.user?._id;
				if (!userId) {
					return error(401, "User not authenticated");
				}

				const profiles = await collections.profiles
					.find({ userId })
					.sort({ isActive: -1, createdAt: -1 })
					.toArray();

				return { profiles };
			})
			// Create a new profile
			.post(
				"",
				async ({ locals, body }) => {
					const userId = locals.user?._id;
					if (!userId) {
						return error(401, "User not authenticated");
					}

					const newProfile: Omit<Profile, "_id"> = {
						userId,
						name: body.name,
						platform: body.platform,
						handle: body.handle,
						description: body.description,
						toneOfVoice: body.toneOfVoice,
						topics: body.topics,
						targetAudience: body.targetAudience,
						avatarUrl: body.avatarUrl,
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					};

					const result = await collections.profiles.insertOne(newProfile as Profile);

					return {
						_id: result.insertedId,
						...newProfile,
					};
				},
				{
					body: t.Object({
						name: t.String(),
						platform: t.Union([
							t.Literal("instagram"),
							t.Literal("facebook"),
							t.Literal("twitter"),
							t.Literal("linkedin"),
							t.Literal("tiktok"),
						]),
						handle: t.Optional(t.String()),
						description: t.Optional(t.String()),
						toneOfVoice: t.Optional(t.String()),
						topics: t.Optional(t.Array(t.String())),
						targetAudience: t.Optional(t.String()),
						avatarUrl: t.Optional(t.String()),
					}),
				}
			)
			// Import profile from social media
			.post(
				"/import",
				async ({ locals, body }) => {
					const userId = locals.user?._id;
					if (!userId) {
						return error(401, "User not authenticated");
					}

					// Check if platform is supported
					if (!ScraperFactory.isSupported(body.platform)) {
						return error(
							400,
							`Platform ${body.platform} is not yet supported. Supported platforms: ${ScraperFactory.getSupportedPlatforms().join(", ")}`
						);
					}

					try {
						logger.info(`Importing ${body.platform} profile: ${body.username} for user ${userId}`);

						// Get the appropriate scraper
						const scraper = ScraperFactory.getScraper(body.platform);

						// Import profile data
						const importedData = await scraper.importProfile(body.username);

						// Create profile from imported data
						const newProfile: Omit<Profile, "_id"> = {
							userId,
							name: body.name || importedData.profile.displayName,
							platform: body.platform,
							handle: `@${importedData.profile.username}`,
							description: importedData.profile.bio,
							toneOfVoice: importedData.analyzedTone,
							topics: importedData.detectedTopics,
							targetAudience: body.targetAudience,
							avatarUrl: importedData.profile.avatarUrl,
							isActive: true,
							createdAt: new Date(),
							updatedAt: new Date(),
						};

						const profileResult = await collections.profiles.insertOne(newProfile as Profile);

						// Import recent posts as published posts
						if (body.importPosts && importedData.recentPosts.length > 0) {
							const posts: Omit<Post, "_id">[] = importedData.recentPosts.map((post) => ({
								profileId: profileResult.insertedId,
								title: `Imported post ${post.id}`,
								caption: post.caption || "",
								hashtags: post.hashtags,
								status: "published" as const,
								publishedDate: post.timestamp,
								likes: post.likeCount,
								comments: post.commentCount,
								createdAt: post.timestamp,
								updatedAt: new Date(),
							}));

							await collections.posts.insertMany(posts as Post[]);

							logger.info(`Imported ${posts.length} posts for profile ${profileResult.insertedId}`);
						}

						return {
							profile: {
								_id: profileResult.insertedId,
								...newProfile,
							},
							importedPostsCount: body.importPosts ? importedData.recentPosts.length : 0,
							scrapedData: {
								followerCount: importedData.profile.followerCount,
								postCount: importedData.profile.postCount,
								isVerified: importedData.profile.isVerified,
							},
						};
					} catch (err) {
						logger.error(`Error importing ${body.platform} profile:`, err);
						return error(500, `Failed to import profile: ${String(err)}`);
					}
				},
				{
					body: t.Object({
						platform: t.Union([
							t.Literal("instagram"),
							t.Literal("facebook"),
							t.Literal("twitter"),
							t.Literal("linkedin"),
							t.Literal("tiktok"),
						]),
						username: t.String(),
						name: t.Optional(t.String()),
						targetAudience: t.Optional(t.String()),
						importPosts: t.Optional(t.Boolean()),
					}),
				}
			)
			// Profile-specific routes
			.group(
				"/:id",
				{
					params: t.Object({
						id: t.String(),
					}),
				},
				(app) => {
					return (
						app
							.derive(async ({ locals, params }) => {
								const userId = locals.user?._id;
								if (!userId) {
									throw error(401, "User not authenticated");
								}

								let profileId: ObjectId;
								try {
									profileId = new ObjectId(params.id);
								} catch {
									throw error(400, "Invalid profile ID format");
								}

								const profile = await collections.profiles.findOne({
									_id: profileId,
									userId,
								});

								if (!profile) {
									throw error(404, "Profile not found");
								}

								return { profile };
							})
							// Get a specific profile
							.get("", async ({ profile }) => {
								return profile;
							})
							// Update a profile
							.patch(
								"",
								async ({ profile, body }) => {
									const updateData: Partial<Profile> = {
										updatedAt: new Date(),
									};

									if (body.name !== undefined) updateData.name = body.name;
									if (body.handle !== undefined) updateData.handle = body.handle;
									if (body.description !== undefined) updateData.description = body.description;
									if (body.toneOfVoice !== undefined) updateData.toneOfVoice = body.toneOfVoice;
									if (body.topics !== undefined) updateData.topics = body.topics;
									if (body.targetAudience !== undefined)
										updateData.targetAudience = body.targetAudience;
									if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
									if (body.isActive !== undefined) updateData.isActive = body.isActive;

									await collections.profiles.updateOne({ _id: profile._id }, { $set: updateData });

									return { success: true };
								},
								{
									body: t.Object({
										name: t.Optional(t.String()),
										handle: t.Optional(t.String()),
										description: t.Optional(t.String()),
										toneOfVoice: t.Optional(t.String()),
										topics: t.Optional(t.Array(t.String())),
										targetAudience: t.Optional(t.String()),
										avatarUrl: t.Optional(t.String()),
										isActive: t.Optional(t.Boolean()),
									}),
								}
							)
							// Delete a profile
							.delete("", async ({ profile }) => {
								// Check if there are conversations associated with this profile
								const conversationCount = await collections.conversations.countDocuments({
									profileId: profile._id,
								});

								if (conversationCount > 0) {
									return error(
										400,
										"Cannot delete profile with existing conversations. Archive it instead."
									);
								}

								await collections.profiles.deleteOne({ _id: profile._id });
								return { success: true };
							})
							// Get conversations for a profile
							.get("/conversations", async ({ profile }) => {
								const conversations = await collections.conversations
									.find({ profileId: profile._id })
									.sort({ updatedAt: -1 })
									.project({
										title: 1,
										updatedAt: 1,
										model: 1,
										postId: 1,
									})
									.toArray();

								return { conversations };
							})
							// Get posts for a profile
							.get(
								"/posts",
								async ({ profile, query }) => {
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									const filter: any = { profileId: profile._id };
									if (query.status) {
										filter.status = query.status;
									}

									const posts = await collections.posts
										.find(filter)
										.sort({ createdAt: -1 })
										.toArray();

									return { posts };
								},
								{
									query: t.Object({
										status: t.Optional(
											t.Union([
												t.Literal("draft"),
												t.Literal("in_review"),
												t.Literal("approved"),
												t.Literal("published"),
												t.Literal("archived"),
											])
										),
									}),
								}
							)
					);
				}
			)
	);
});
