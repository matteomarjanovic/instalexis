<script lang="ts">
	import type { Profile } from "$lib/types/Profile";
	import { handleResponse, useAPIClient } from "$lib/APIClient";
	import { error } from "$lib/stores/errors";

	interface Props {
		profiles: Profile[];
		activeProfileId?: string;
		onProfileChange: (profileId: string | undefined) => void;
	}

	let { profiles, activeProfileId, onProfileChange }: Props = $props();

	const client = useAPIClient();

	function selectProfile(profileId: string | undefined) {
		onProfileChange(profileId);
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
		<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Profile</h3>
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
