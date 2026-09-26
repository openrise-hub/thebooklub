import { STORAGE_KEYS } from "$lib/constants/ui";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearPendingClubCode,
	getPendingClubCode,
	resolvePendingClubJoin,
	setPendingClubCode,
} from "./join";

vi.mock("$app/environment", () => ({
	browser: true,
}));

class MockSessionStorage {
	private store: Record<string, string> = {};

	getItem(key: string): string | null {
		return this.store[key] || null;
	}

	setItem(key: string, value: string): void {
		this.store[key] = value;
	}

	removeItem(key: string): void {
		delete this.store[key];
	}

	clear(): void {
		this.store = {};
	}
}

const mockStorage = new MockSessionStorage();
Object.defineProperty(globalThis, "sessionStorage", {
	value: mockStorage,
	writable: true,
});

describe("Pending Club Code Session Helpers", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it("stores normalized invite code in sessionStorage", () => {
		setPendingClubCode("read-4821");
		expect(sessionStorage.getItem(STORAGE_KEYS.PENDING_CLUB_CODE)).toBe("READ-4821");
		expect(getPendingClubCode()).toBe("READ-4821");
	});

	it("does not store invalid invite codes in sessionStorage", () => {
		setPendingClubCode("INVALID!");
		expect(getPendingClubCode()).toBeNull();
	});

	it("clears pending club code from sessionStorage", () => {
		setPendingClubCode("READ-4821");
		expect(getPendingClubCode()).toBe("READ-4821");
		clearPendingClubCode();
		expect(getPendingClubCode()).toBeNull();
	});
});

describe("resolvePendingClubJoin", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it("returns null if no pending code exists in sessionStorage", async () => {
		const mockFetch = vi.fn();
		const result = await resolvePendingClubJoin(mockFetch as unknown as typeof fetch);
		expect(result).toBeNull();
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("calls API join endpoint with normalized pending code and clears storage on success", async () => {
		setPendingClubCode("read-4821");

		const mockResponse = {
			ok: true,
			json: async () => ({
				success: true,
				clubId: "READ-4821",
				redirectUrl: "/club/READ-4821",
			}),
		};
		const mockFetch = vi.fn().mockResolvedValue(mockResponse);

		const result = await resolvePendingClubJoin(mockFetch as unknown as typeof fetch);

		expect(mockFetch).toHaveBeenCalledWith("/api/club/join", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code: "READ-4821" }),
		});
		expect(result).toEqual({
			success: true,
			clubId: "READ-4821",
			redirectUrl: "/club/READ-4821",
		});
		expect(getPendingClubCode()).toBeNull();
	});

	it("handles API join failure and retains error message", async () => {
		setPendingClubCode("read-4821");

		const mockResponse = {
			ok: false,
			json: async () => ({
				success: false,
				error: "Club not found",
			}),
		};
		const mockFetch = vi.fn().mockResolvedValue(mockResponse);

		const result = await resolvePendingClubJoin(mockFetch as unknown as typeof fetch);

		expect(result?.success).toBe(false);
		expect(result?.error).toBe("Club not found");
	});
});
