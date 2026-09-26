<script lang="ts">
import type { UserSession } from "$lib/server/auth";
import Button from "./Button.svelte";
import Input from "./Input.svelte";
import Modal from "./Modal.svelte";

interface Props {
	isOpen: boolean;
	pendingCode?: string;
	onclose: () => void;
	onsuccess?: (session: UserSession) => void;
}

let { isOpen = false, pendingCode = "", onclose, onsuccess }: Props = $props();

let mode = $state<"login" | "register">("register");
let email = $state("");
let username = $state("");
let password = $state("");
let errorMessage = $state("");
let isLoading = $state(false);

function resetForm() {
	email = "";
	username = "";
	password = "";
	errorMessage = "";
	isLoading = false;
}

function handleClose() {
	resetForm();
	onclose();
}

function switchMode(newMode: "login" | "register") {
	mode = newMode;
	errorMessage = "";
}

async function handleSubmit(event: SubmitEvent) {
	event.preventDefault();
	errorMessage = "";

	if (!email || !password || (mode === "register" && !username)) {
		errorMessage = "Please fill in all required fields";
		return;
	}

	isLoading = true;

	try {
		const res = await fetch("/api/auth", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: mode,
				email: email.trim(),
				password,
				username: username.trim(),
				pendingCode: pendingCode || undefined,
			}),
		});

		const data = await res.json();

		if (!res.ok) {
			errorMessage = data.error || "Authentication failed. Please try again.";
			isLoading = false;
			return;
		}

		resetForm();
		onsuccess?.(data.user);
		onclose();
	} catch {
		errorMessage = "Network error. Please check your connection.";
		isLoading = false;
	}
}

function handleGoogleOAuth() {
	const params = new URLSearchParams();
	if (pendingCode) {
		params.set("join", pendingCode);
	}
	window.location.href = `/api/auth/google?${params.toString()}`;
}
</script>

<Modal
	{isOpen}
	title={mode === "login" ? "Sign In" : "Create Account"}
	onclose={handleClose}
>
	<div class="auth-modal-content">
		{#if pendingCode}
			<div class="invite-banner">
				<span class="invite-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54z"/></svg>
				</span>
				<span class="invite-text">
					Joining Club: <strong>{pendingCode}</strong>
				</span>
			</div>
		{/if}

		<div class="auth-tabs">
			<button
				type="button"
				class="auth-tab"
				class:active={mode === "register"}
				onclick={() => switchMode("register")}
			>
				Create Account
			</button>
			<button
				type="button"
				class="auth-tab"
				class:active={mode === "login"}
				onclick={() => switchMode("login")}
			>
				Sign In
			</button>
		</div>

		<Button
			variant="neutral"
			fullWidth
			onclick={handleGoogleOAuth}
			disabled={isLoading}
		>
			<span class="google-btn-content">
				<svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
					<path
						fill="#EA4335"
						d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
					/>
					<path
						fill="#4285F4"
						d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
					/>
					<path
						fill="#FBBC05"
						d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
					/>
					<path
						fill="#34A853"
						d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
					/>
				</svg>
				Continue with Google
			</span>
		</Button>

		<div class="divider">
			<span class="divider-line"></span>
			<span class="divider-text">OR</span>
			<span class="divider-line"></span>
		</div>

		<form onsubmit={handleSubmit} class="auth-form">
			{#if errorMessage}
				<div class="error-alert" role="alert">
					{errorMessage}
				</div>
			{/if}

			{#if mode === "register"}
				<Input
					id="auth-username"
					label="Username"
					placeholder="reader_hero"
					bind:value={username}
					required
					disabled={isLoading}
				/>
			{/if}

			<Input
				id="auth-email"
				label="Email Address"
				type="email"
				placeholder="you@example.com"
				bind:value={email}
				required
				disabled={isLoading}
			/>

			<Input
				id="auth-password"
				label="Password"
				type="password"
				placeholder="••••••••"
				bind:value={password}
				required
				disabled={isLoading}
			/>

			<Button
				type="submit"
				variant="purple"
				size="lg"
				fullWidth
				disabled={isLoading}
			>
				{isLoading
					? "Please wait..."
					: mode === "register"
						? (pendingCode ? "Create Account & Join" : "Create Account")
						: (pendingCode ? "Sign In & Join" : "Sign In")}
			</Button>
		</form>
	</div>
</Modal>

<style>
	.auth-modal-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.invite-banner {
		display: flex;
		align-items: center;
		gap: 10px;
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border: 2px solid var(--color-yellow-shadow);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 700;
	}

	.invite-icon {
		font-size: 1.25rem;
	}

	.auth-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		background-color: var(--bg-primary);
		padding: 4px;
		border-radius: var(--radius-md);
		border: var(--border-chunky);
	}

	.auth-tab {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		border: 2px solid transparent;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: background-color 0.1s ease, color 0.1s ease;
	}

	.auth-tab.active {
		background-color: var(--bg-surface);
		color: var(--text-primary);
		border-color: var(--border-color);
		box-shadow: 0 2px 0 var(--border-color);
	}

	.google-btn-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.google-icon {
		flex-shrink: 0;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.divider-line {
		flex: 1;
		height: 2px;
		background-color: var(--border-color);
		opacity: 0.2;
	}

	.divider-text {
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--text-muted);
		letter-spacing: 0.08em;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.error-alert {
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		border: 2px solid var(--color-red-shadow);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 0.9rem;
	}
</style>
