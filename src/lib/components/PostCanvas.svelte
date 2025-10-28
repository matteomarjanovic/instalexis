<script lang="ts">
	import type { Post } from "$lib/types/Post";
	import { handleResponse, useAPIClient } from "$lib/APIClient";
	import { error } from "$lib/stores/errors";

	interface Props {
		post?: Post;
		conversationId?: string;
		profileId: string;
		onPostUpdate?: (post: Post) => void;
	}

	let { post, conversationId, profileId, onPostUpdate }: Props = $props();

	const client = useAPIClient();

	let caption = $state(post?.caption || "");
	let hashtags = $state(post?.hashtags?.join(" ") || "");
	let title = $state(post?.title || "");
	let status = $state(post?.status || "draft");
	let notes = $state(post?.notes || "");
	let isSaving = $state(false);

	// Update local state when post changes
	$effect(() => {
		if (post) {
			caption = post.caption || "";
			hashtags = post.hashtags?.join(" ") || "";
			title = post.title || "";
			status = post.status || "draft";
			notes = post.notes || "";
		}
	});

	async function savePost() {
		isSaving = true;
		try {
			const hashtagArray = hashtags
				.split(/\s+/)
				.filter((h) => h.trim())
				.map((h) => (h.startsWith("#") ? h : `#${h}`));

			if (post?._id) {
				// Update existing post
				await client
					.posts({ id: post._id.toString() })
					.patch({
						caption,
						hashtags: hashtagArray,
						title,
						status,
						notes,
					})
					.then(handleResponse);
			} else {
				// Create new post
				const response = await client.posts
					.post({
						profileId,
						conversationId,
						caption,
						hashtags: hashtagArray,
						title: title || "New Post",
						status,
						notes,
					})
					.then(handleResponse);

				if (onPostUpdate && response) {
					onPostUpdate(response as Post);
				}
			}
		} catch (err) {
			error.set(String(err));
		} finally {
			isSaving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === "s") {
			e.preventDefault();
			savePost();
		}
	}
</script>

<div class="post-canvas" onkeydown={handleKeydown} role="form">
	<div class="post-canvas-header">
		<h3 class="text-lg font-semibold">Post Canvas</h3>
		<div class="status-badge status-{status}">
			{status.replace("_", " ")}
		</div>
	</div>

	<div class="post-canvas-content">
		<div class="form-group">
			<label for="post-title">Title (internal)</label>
			<input
				id="post-title"
				type="text"
				bind:value={title}
				placeholder="e.g., Product Launch Announcement"
				class="input"
			/>
		</div>

		<div class="form-group">
			<label for="post-caption">Caption</label>
			<textarea
				id="post-caption"
				bind:value={caption}
				placeholder="Write your post caption here..."
				rows="8"
				class="textarea"
			></textarea>
			<div class="char-count">
				{caption.length} characters
			</div>
		</div>

		<div class="form-group">
			<label for="post-hashtags">Hashtags</label>
			<input
				id="post-hashtags"
				type="text"
				bind:value={hashtags}
				placeholder="#example #hashtags"
				class="input"
			/>
		</div>

		<div class="form-group">
			<label for="post-status">Status</label>
			<select id="post-status" bind:value={status} class="select">
				<option value="draft">Draft</option>
				<option value="in_review">In Review</option>
				<option value="approved">Approved</option>
				<option value="published">Published</option>
				<option value="archived">Archived</option>
			</select>
		</div>

		<div class="form-group">
			<label for="post-notes">Notes</label>
			<textarea
				id="post-notes"
				bind:value={notes}
				placeholder="Internal notes about this post..."
				rows="3"
				class="textarea"
			></textarea>
		</div>

		<div class="post-canvas-actions">
			<button onclick={savePost} disabled={isSaving} class="btn-primary">
				{isSaving ? "Saving..." : "Save Post"}
			</button>
			<div class="save-hint">Press Cmd/Ctrl + S to save</div>
		</div>
	</div>
</div>

<style>
	.post-canvas {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: white;
		border-left: 1px solid rgb(229 231 235);
	}

	:global(.dark) .post-canvas {
		background: rgb(31 41 55);
		border-left-color: rgb(55 65 81);
	}

	.post-canvas-header {
		padding: 1rem;
		border-bottom: 1px solid rgb(229 231 235);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	:global(.dark) .post-canvas-header {
		border-bottom-color: rgb(55 65 81);
	}

	.post-canvas-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(55 65 81);
	}

	:global(.dark) label {
		color: rgb(209 213 219);
	}

	.input,
	.textarea,
	.select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid rgb(209 213 219);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		color: rgb(17 24 39);
	}

	:global(.dark) .input,
	:global(.dark) .textarea,
	:global(.dark) .select {
		background: rgb(55 65 81);
		border-color: rgb(75 85 99);
		color: rgb(243 244 246);
	}

	.input:focus,
	.textarea:focus,
	.select:focus {
		outline: none;
		border-color: rgb(59 130 246);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.textarea {
		resize: vertical;
		font-family: inherit;
	}

	.char-count {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: rgb(107 114 128);
		text-align: right;
	}

	:global(.dark) .char-count {
		color: rgb(156 163 175);
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-draft {
		background: rgb(243 244 246);
		color: rgb(55 65 81);
	}

	.status-in_review {
		background: rgb(254 243 199);
		color: rgb(146 64 14);
	}

	.status-approved {
		background: rgb(220 252 231);
		color: rgb(22 101 52);
	}

	.status-published {
		background: rgb(219 234 254);
		color: rgb(30 64 175);
	}

	.status-archived {
		background: rgb(229 231 235);
		color: rgb(75 85 99);
	}

	.post-canvas-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.btn-primary {
		padding: 0.5rem 1rem;
		background: rgb(59 130 246);
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		background: rgb(37 99 235);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.save-hint {
		font-size: 0.75rem;
		color: rgb(107 114 128);
	}

	:global(.dark) .save-hint {
		color: rgb(156 163 175);
	}
</style>
