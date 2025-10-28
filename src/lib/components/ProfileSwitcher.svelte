<script lang="ts">
	import type { Profile } from "$lib/types/Profile";
	import { handleResponse, useAPIClient } from "$lib/APIClient";
	import { error } from "$lib/stores/errors";
	import ImportProfileModal from "./ImportProfileModal.svelte";
	import ProfileModal from "./ProfileModal.svelte";

	interface Props {
		profiles: Profile[];
		activeProfileId?: string;
		onProfileChange: (profileId: string | undefined) => void;
		onProfileAdded?: (profile: Profile) => void;
	}

	let { profiles, activeProfileId, onProfileChange, onProfileAdded }: Props = $props();

	const client = useAPIClient();

	let showImportModal = $state(false);
	let showCreateModal = $state(false);

	function selectProfile(profileId: string | undefined) {
		onProfileChange(profileId);
	}

	function handleProfileImported(profile: Profile) {
		if (onProfileAdded) {
			onProfileAdded(profile);
		}
	}

	function handleProfileCreated(profile: Profile) {
		if (onProfileAdded) {
			onProfileAdded(profile);
		}
	}

	const platformIcons = {
		instagram: "📷",
		facebook: "👥",
		twitter: "🐦",
		linkedin: "💼",
		tiktok: "🎵",
	};
</script>

<div class="profile-switcher">
	<div class="profile-switcher-header">
		<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Profiles</h3>
		<div class="header-actions">
			<button
				class="add-button"
				onclick={() => (showImportModal = true)}
				title="Import from Instagram"
			>
				<span class="add-icon">↓</span>
			</button>
			<button class="add-button" onclick={() => (showCreateModal = true)} title="Create manually">
				<span class="add-icon">+</span>
			</button>
		</div>
	</div>

	<div class="profile-list">
		<button
			class="profile-item"
			class:active={!activeProfileId}
			onclick={() => selectProfile(undefined)}
		>
			<div class="profile-icon">🏠</div>
			<div class="profile-info">
				<div class="profile-name">All Profiles</div>
			</div>
		</button>

		{#each profiles as profile (profile._id)}
			<button
				class="profile-item"
				class:active={activeProfileId === profile._id.toString()}
				onclick={() => selectProfile(profile._id.toString())}
			>
				<div class="profile-icon">
					{platformIcons[profile.platform] || "📱"}
				</div>
				<div class="profile-info">
					<div class="profile-name">{profile.name}</div>
					{#if profile.handle}
						<div class="profile-handle">{profile.handle}</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</div>

<ImportProfileModal
	open={showImportModal}
	onClose={() => (showImportModal = false)}
	onImported={handleProfileImported}
/>

<ProfileModal
	open={showCreateModal}
	onClose={() => (showCreateModal = false)}
	onSave={handleProfileCreated}
/>

<style>
	.profile-switcher {
		padding: 0.5rem;
		border-bottom: 1px solid rgb(229 231 235);
	}

	:global(.dark) .profile-switcher {
		border-bottom-color: rgb(55 65 81);
	}

	.profile-switcher-header {
		padding: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-actions {
		display: flex;
		gap: 0.25rem;
	}

	.add-button {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.375rem;
		border: 1px solid rgb(209 213 219);
		background: white;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .add-button {
		background: rgb(55 65 81);
		border-color: rgb(75 85 99);
	}

	.add-button:hover {
		background: rgb(239 246 255);
		border-color: rgb(59 130 246);
	}

	:global(.dark) .add-button:hover {
		background: rgb(30 58 138);
	}

	.add-icon {
		font-size: 1rem;
		font-weight: 600;
		color: rgb(107 114 128);
	}

	:global(.dark) .add-icon {
		color: rgb(156 163 175);
	}

	.add-button:hover .add-icon {
		color: rgb(59 130 246);
	}

	.profile-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.profile-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
		background: transparent;
		border: none;
		text-align: left;
		width: 100%;
		transition: background-color 0.15s;
	}

	.profile-item:hover {
		background-color: rgb(243 244 246);
	}

	:global(.dark) .profile-item:hover {
		background-color: rgb(55 65 81);
	}

	.profile-item.active {
		background-color: rgb(219 234 254);
	}

	:global(.dark) .profile-item.active {
		background-color: rgb(30 58 138);
	}

	.profile-icon {
		font-size: 1.5rem;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.profile-info {
		flex: 1;
		min-width: 0;
	}

	.profile-name {
		font-weight: 500;
		font-size: 0.875rem;
		color: rgb(17 24 39);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.dark) .profile-name {
		color: rgb(243 244 246);
	}

	.profile-handle {
		font-size: 0.75rem;
		color: rgb(107 114 128);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.dark) .profile-handle {
		color: rgb(156 163 175);
	}
</style>
