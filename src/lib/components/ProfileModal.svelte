<script lang="ts">
	import type { Profile, SocialPlatform } from "$lib/types/Profile";
	import { handleResponse, useAPIClient } from "$lib/APIClient";
	import { error } from "$lib/stores/errors";
	import Modal from "./Modal.svelte";

	interface Props {
		profile?: Profile;
		open: boolean;
		onClose: () => void;
		onSave: (profile: Profile) => void;
	}

	let { profile, open, onClose, onSave }: Props = $props();

	const client = useAPIClient();

	let name = $state(profile?.name || "");
	let platform = $state<SocialPlatform>(profile?.platform || "instagram");
	let handle = $state(profile?.handle || "");
	let description = $state(profile?.description || "");
	let toneOfVoice = $state(profile?.toneOfVoice || "");
	let topics = $state(profile?.topics?.join(", ") || "");
	let targetAudience = $state(profile?.targetAudience || "");
	let isSaving = $state(false);

	// Reset form when profile changes or modal opens
	$effect(() => {
		if (open) {
			name = profile?.name || "";
			platform = profile?.platform || "instagram";
			handle = profile?.handle || "";
			description = profile?.description || "";
			toneOfVoice = profile?.toneOfVoice || "";
			topics = profile?.topics?.join(", ") || "";
			targetAudience = profile?.targetAudience || "";
		}
	});

	async function handleSave() {
		if (!name.trim()) {
			error.set("Profile name is required");
			return;
		}

		isSaving = true;
		try {
			const topicsArray = topics
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t);

			if (profile?._id) {
				// Update existing profile
				await client
					.profiles({ id: profile._id.toString() })
					.patch({
						name,
						handle: handle || undefined,
						description: description || undefined,
						toneOfVoice: toneOfVoice || undefined,
						topics: topicsArray.length > 0 ? topicsArray : undefined,
						targetAudience: targetAudience || undefined,
					})
					.then(handleResponse);

				onSave({
					...profile,
					name,
					platform,
					handle,
					description,
					toneOfVoice,
					topics: topicsArray,
					targetAudience,
				});
			} else {
				// Create new profile
				const response = await client.profiles
					.post({
						name,
						platform,
						handle: handle || undefined,
						description: description || undefined,
						toneOfVoice: toneOfVoice || undefined,
						topics: topicsArray.length > 0 ? topicsArray : undefined,
						targetAudience: targetAudience || undefined,
					})
					.then(handleResponse);

				if (response) {
					onSave(response as Profile);
				}
			}

			onClose();
		} catch (err) {
			error.set(String(err));
		} finally {
			isSaving = false;
		}
	}
</script>

{#if open}
	<Modal onclose={onClose}>
		<div class="modal-header">
			<h2 class="text-xl font-semibold">
				{profile ? "Edit Profile" : "Create Profile"}
			</h2>
		</div>

		<div class="modal-content">
			<div class="form-group">
				<label for="profile-name">Profile Name *</label>
				<input
					id="profile-name"
					type="text"
					bind:value={name}
					placeholder="e.g., My Fitness Brand"
					class="input"
					required
				/>
			</div>

			<div class="form-group">
				<label for="profile-platform">Platform *</label>
				<select id="profile-platform" bind:value={platform} class="select" disabled={!!profile}>
					<option value="instagram">Instagram</option>
					<option value="facebook">Facebook</option>
					<option value="twitter">Twitter</option>
					<option value="linkedin">LinkedIn</option>
					<option value="tiktok">TikTok</option>
				</select>
				{#if profile}
					<p class="help-text">Platform cannot be changed after creation</p>
				{/if}
			</div>

			<div class="form-group">
				<label for="profile-handle">Handle</label>
				<input
					id="profile-handle"
					type="text"
					bind:value={handle}
					placeholder="@yourbrand"
					class="input"
				/>
			</div>

			<div class="form-group">
				<label for="profile-description">Profile Description</label>
				<textarea
					id="profile-description"
					bind:value={description}
					placeholder="Brief description of what this profile is about..."
					rows="3"
					class="textarea"
				></textarea>
			</div>

			<div class="form-group">
				<label for="profile-tone">Tone of Voice</label>
				<input
					id="profile-tone"
					type="text"
					bind:value={toneOfVoice}
					placeholder="e.g., Friendly, professional, humorous"
					class="input"
				/>
			</div>

			<div class="form-group">
				<label for="profile-topics">Common Topics</label>
				<input
					id="profile-topics"
					type="text"
					bind:value={topics}
					placeholder="fitness, nutrition, wellness (comma-separated)"
					class="input"
				/>
			</div>

			<div class="form-group">
				<label for="profile-audience">Target Audience</label>
				<input
					id="profile-audience"
					type="text"
					bind:value={targetAudience}
					placeholder="e.g., Young professionals interested in health"
					class="input"
				/>
			</div>
		</div>

		<div class="modal-actions">
			<button onclick={onClose} disabled={isSaving} class="btn-secondary"> Cancel </button>
			<button onclick={handleSave} disabled={isSaving} class="btn-primary">
				{isSaving ? "Saving..." : "Save Profile"}
			</button>
		</div>
	</Modal>
{/if}

<style>
	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgb(229 231 235);
	}

	:global(.dark) .modal-header {
		border-bottom-color: rgb(55 65 81);
	}

	.modal-content {
		padding: 1.5rem;
		max-height: 60vh;
		overflow-y: auto;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
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

	.select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.textarea {
		resize: vertical;
		font-family: inherit;
	}

	.help-text {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: rgb(107 114 128);
	}

	:global(.dark) .help-text {
		color: rgb(156 163 175);
	}

	.modal-actions {
		padding: 1.5rem;
		border-top: 1px solid rgb(229 231 235);
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	:global(.dark) .modal-actions {
		border-top-color: rgb(55 65 81);
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		border: none;
	}

	.btn-primary {
		background: rgb(59 130 246);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: rgb(37 99 235);
	}

	.btn-secondary {
		background: rgb(243 244 246);
		color: rgb(55 65 81);
	}

	:global(.dark) .btn-secondary {
		background: rgb(55 65 81);
		color: rgb(209 213 219);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgb(229 231 235);
	}

	:global(.dark) .btn-secondary:hover:not(:disabled) {
		background: rgb(75 85 99);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
