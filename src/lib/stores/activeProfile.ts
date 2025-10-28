import { writable } from "svelte/store";

export const activeProfileId = writable<string | undefined>(undefined);
