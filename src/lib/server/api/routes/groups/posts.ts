import { Elysia, error, t } from "elysia";
import { authPlugin } from "$api/authPlugin";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";
import type { Post } from "$lib/types/Post";

export const postGroup = new Elysia().use(authPlugin).group("/posts", (app) => {
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
			// Create a new post
			.post(
				"",
				async ({ locals, body }) => {
					const userId = locals.user?._id;
					if (!userId) {
						return error(401, "User not authenticated");
					}

					// Verify the profile belongs to the user
					const profile = await collections.profiles.findOne({
						_id: new ObjectId(body.profileId),
						userId,
					});

					if (!profile) {
						return error(404, "Profile not found");
					}

					const newPost: Omit<Post, "_id"> = {
						profileId: profile._id,
						conversationId: body.conversationId ? new ObjectId(body.conversationId) : undefined,
						title: body.title,
						caption: body.caption || "",
						hashtags: body.hashtags,
						images: body.images,
						status: body.status || "draft",
						notes: body.notes,
						createdAt: new Date(),
						updatedAt: new Date(),
					};

					const result = await collections.posts.insertOne(newPost as Post);

					return {
						_id: result.insertedId,
						...newPost,
					};
				},
				{
					body: t.Object({
						profileId: t.String(),
						conversationId: t.Optional(t.String()),
						title: t.String(),
						caption: t.Optional(t.String()),
						hashtags: t.Optional(t.Array(t.String())),
						images: t.Optional(
							t.Array(
								t.Object({
									type: t.Union([t.Literal("hash"), t.Literal("url")]),
									value: t.String(),
									alt: t.Optional(t.String()),
								})
							)
						),
						status: t.Optional(
							t.Union([
								t.Literal("draft"),
								t.Literal("in_review"),
								t.Literal("approved"),
								t.Literal("published"),
								t.Literal("archived"),
							])
						),
						notes: t.Optional(t.String()),
					}),
				}
			)
			// Post-specific routes
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

								let postId: ObjectId;
								try {
									postId = new ObjectId(params.id);
								} catch {
									throw error(400, "Invalid post ID format");
								}

								const post = await collections.posts.findOne({
									_id: postId,
								});

								if (!post) {
									throw error(404, "Post not found");
								}

								// Verify the post's profile belongs to the user
								const profile = await collections.profiles.findOne({
									_id: post.profileId,
									userId,
								});

								if (!profile) {
									throw error(403, "Access denied");
								}

								return { post, profile };
							})
							// Get a specific post
							.get("", async ({ post }) => {
								return post;
							})
							// Update a post
							.patch(
								"",
								async ({ post, body }) => {
									const updateData: Partial<Post> = {
										updatedAt: new Date(),
									};

									if (body.title !== undefined) updateData.title = body.title;
									if (body.caption !== undefined) updateData.caption = body.caption;
									if (body.hashtags !== undefined) updateData.hashtags = body.hashtags;
									if (body.images !== undefined) updateData.images = body.images;
									if (body.status !== undefined) updateData.status = body.status;
									if (body.notes !== undefined) updateData.notes = body.notes;
									if (body.scheduledDate !== undefined)
										updateData.scheduledDate = new Date(body.scheduledDate);

									await collections.posts.updateOne({ _id: post._id }, { $set: updateData });

									return { success: true };
								},
								{
									body: t.Object({
										title: t.Optional(t.String()),
										caption: t.Optional(t.String()),
										hashtags: t.Optional(t.Array(t.String())),
										images: t.Optional(
											t.Array(
												t.Object({
													type: t.Union([t.Literal("hash"), t.Literal("url")]),
													value: t.String(),
													alt: t.Optional(t.String()),
												})
											)
										),
										status: t.Optional(
											t.Union([
												t.Literal("draft"),
												t.Literal("in_review"),
												t.Literal("approved"),
												t.Literal("published"),
												t.Literal("archived"),
											])
										),
										notes: t.Optional(t.String()),
										scheduledDate: t.Optional(t.String()),
									}),
								}
							)
							// Delete a post
							.delete("", async ({ post }) => {
								await collections.posts.deleteOne({ _id: post._id });
								return { success: true };
							})
							// Get the conversation associated with this post
							.get("/conversation", async ({ post }) => {
								if (!post.conversationId) {
									return { conversation: null };
								}

								const conversation = await collections.conversations.findOne({
									_id: post.conversationId,
								});

								return { conversation };
							})
					);
				}
			)
	);
});
