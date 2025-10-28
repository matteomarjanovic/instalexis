<script lang="ts">
	import type { Profile, SocialPlatform } from "$lib/types/Profile";
	import { handleResponse, useAPIClient } from "$lib/APIClient";
	import { error } from "$lib/stores/errors";
	import Modal from "./Modal.svelte";

	interface Props {
		open: boolean;
		onClose: () => void;
		onImported: (profile: Profile) => void;
	}

	let { open, onClose, onImported }: Props = $props();

	const client = useAPIClient();

	let platform = $state<SocialPlatform>("instagram");
	let username = $state("");
	let name = $state("");
	let targetAudience = $state("");
	let importPosts = $state(true);
	let isImporting = $state(false);
	let importStatus = $state("");

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			platform = "instagram";
			username = "";
			name = "";
			targetAudience = "";
			importPosts = true;
			isImporting = false;
			importStatus = "";
		}
	});

	async function handleImport() {
		if (!username.trim()) {
			error.set("Username is required");
			return;
		}

		isImporting = true;
		importStatus = "Fetching profile data...";

		try {
			const cleanUsername = username.replace(/^@/, "");

			importStatus = "Analyzing profile and posts...";

			const response = await client.profiles.import
				.post({
					platform,
					username: cleanUsername,
					name: name || undefined,
					targetAudience: targetAudience || undefined,
					importPosts,
				})
				.then(handleResponse);

			if (response) {
				importStatus = `Successfully imported! Found ${response.importedPostsCount || 0} posts.`;

				// Wait a moment to show success message
				setTimeout(() => {
					onImported(response.profile as Profile);
					onClose();
				}, 1500);
			}
		} catch (err) {
			error.set(String(err));
			importStatus = "";
		} finally {
			isImporting = false;
		}
	}

	const platformInfo = {
		instagram: {
			name: "Instagram",
			icon: "📷",
			placeholder: "username",
			supported: true,
		},
		facebook: {
			name: "Facebook",
			icon: "👥",
			placeholder: "page-name",
			supported: false,
		},
		twitter: {
			name: "Twitter",
			icon: "🐦",
			placeholder: "username",
			supported: false,
		},
		linkedin: {
			name: "LinkedIn",
			icon: "💼",
			placeholder: "company-name",
			supported: false,
		},
		tiktok: {
			name: "TikTok",
			icon: "🎵",
			placeholder: "username",
			supported: false,
		},
	};
</script>

{#if open}
	<Modal onclose={onClose}>
		<div class="modal-header">
			<h2 class="text-xl font-semibold">Import Social Media Profile</h2>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Automatically import profile details and recent posts
			</p>
		</div>

		<div class="modal-content">
			<div class="form-group">
				<label for="import-platform">Platform *</label>
				<div class="platform-grid">
					{#each Object.entries(platformInfo) as [key, info]}
						<button
							type="button"
							class="platform-button"
							class:active={platform === key}
							class:disabled={!info.supported}
							onclick={() => info.supported && (platform = key as SocialPlatform)}
							disabled={!info.supported}
						>
							<span class="platform-icon">{info.icon}</span>
							<span class="platform-name">{info.name}</span>
							{#if !info.supported}
								<span class="coming-soon">Coming Soon</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="form-group">
				<label for="import-username"> {platformInfo[platform].name} Username * </label>
				<div class="input-wrapper">
					<span class="input-prefix">@</span>
					<input
						id="import-username"
						type="text"
						bind:value={username}
						placeholder={platformInfo[platform].placeholder}
						class="input with-prefix"
						disabled={isImporting}
					/>
				</div>
				<p class="help-text">Enter the username without the @ symbol</p>
			</div>

			<div class="form-group">
				<label for="import-name">Profile Name (optional)</label>
				<input
					id="import-name"
					type="text"
					bind:value={name}
					placeholder="Leave empty to use display name from profile"
					class="input"
					disabled={isImporting}
				/>
			</div>

			<div class="form-group">
				<label for="import-audience">Target Audience (optional)</label>
				<input
					id="import-audience"
					type="text"
					bind:value={targetAudience}
					placeholder="e.g., Young professionals, Fitness enthusiasts"
					class="input"
					disabled={isImporting}
				/>
			</div>

			<div class="form-group">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={importPosts}
						disabled={isImporting}
						class="checkbox"
					/>
					<span>Import recent posts (recommended)</span>
				</label>
				<p class="help-text">
					Importing posts helps the AI understand your brand's tone and topics
				</p>
			</div>

			{#if importStatus}
				<div class="status-message" class:success={importStatus.includes("Successfully")}>
					{importStatus}
				</div>
			{/if}
		</div>

		<div class="modal-actions">
			<button onclick={onClose} disabled={isImporting} class="btn-secondary"> Cancel </button>
			<button onclick={handleImport} disabled={isImporting || !username.trim()} class="btn-primary">
				{isImporting ? "Importing..." : "Import Profile"}
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

	.platform-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
	}

	.platform-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 2px solid rgb(229 231 235);
		border-radius: 0.5rem;
		background: white;
		cursor: pointer;
		transition: all 0.15s;
		position: relative;
	}

	:global(.dark) .platform-button {
		background: rgb(55 65 81);
		border-color: rgb(75 85 99);
	}

	.platform-button:hover:not(.disabled) {
		border-color: rgb(59 130 246);
		background: rgb(239 246 255);
	}

	:global(.dark) .platform-button:hover:not(.disabled) {
		background: rgb(30 58 138);
	}

	.platform-button.active {
		border-color: rgb(59 130 246);
		background: rgb(219 234 254);
	}

	:global(.dark) .platform-button.active {
		background: rgb(30 64 175);
	}

	.platform-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.platform-icon {
		font-size: 2rem;
	}

	.platform-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(17 24 39);
	}

	:global(.dark) .platform-name {
		color: rgb(243 244 246);
	}

	.coming-soon {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: rgb(251 191 36);
		color: rgb(120 53 15);
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.input-wrapper {
		position: relative;
	}

	.input-prefix {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: rgb(107 114 128);
		font-size: 0.875rem;
	}

	:global(.dark) .input-prefix {
		color: rgb(156 163 175);
	}

	.input,
	.checkbox {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid rgb(209 213 219);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		color: rgb(17 24 39);
	}

	.input.with-prefix {
		padding-left: 2rem;
	}

	:global(.dark) .input {
		background: rgb(55 65 81);
		border-color: rgb(75 85 99);
		color: rgb(243 244 246);
	}

	.input:focus {
		outline: none;
		border-color: rgb(59 130 246);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox {
		width: auto;
		cursor: pointer;
	}

	.help-text {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: rgb(107 114 128);
	}

	:global(.dark) .help-text {
		color: rgb(156 163 175);
	}

	.status-message {
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: rgb(254 243 199);
		color: rgb(120 53 15);
		font-size: 0.875rem;
		margin-top: 1rem;
	}

	.status-message.success {
		background: rgb(220 252 231);
		color: rgb(22 101 52);
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
