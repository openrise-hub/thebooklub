import { PROGRESS_DEBOUNCE_MS } from "$lib/constants/cadence";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateProgressPercent, createProgressSynchronizer } from "./progress";

describe("calculateProgressPercent", () => {
	it("calculates correct progress percentages", () => {
		expect(calculateProgressPercent(0, 100)).toBe(0);
		expect(calculateProgressPercent(50, 100)).toBe(50);
		expect(calculateProgressPercent(33, 100)).toBe(33);
		expect(calculateProgressPercent(184, 412)).toBe(45);
		expect(calculateProgressPercent(412, 412)).toBe(100);
	});

	it("handles boundary values and clamps output between 0 and 100", () => {
		expect(calculateProgressPercent(-10, 100)).toBe(0);
		expect(calculateProgressPercent(150, 100)).toBe(100);
		expect(calculateProgressPercent(0, 0)).toBe(0);
		expect(calculateProgressPercent(10, -50)).toBe(0);
	});

	it("safely handles NaN and non-finite numbers", () => {
		expect(calculateProgressPercent(Number.NaN, 100)).toBe(0);
		expect(calculateProgressPercent(50, Number.NaN)).toBe(0);
	});
});

describe("createProgressSynchronizer", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("debounces rapid syncPage calls to a single network request", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				currentPage: 25,
				totalPages: 100,
				percent: 25,
				updatedAt: Date.now(),
			}),
		});

		const onSync = vi.fn();
		const synchronizer = createProgressSynchronizer("club-test-123", {
			fetchFn: mockFetch as unknown as typeof fetch,
			onSync,
		});

		synchronizer.syncPage(10, 100);
		synchronizer.syncPage(15, 100);
		synchronizer.syncPage(20, 100);
		synchronizer.syncPage(25, 100);

		expect(mockFetch).not.toHaveBeenCalled();

		vi.advanceTimersByTime(PROGRESS_DEBOUNCE_MS - 50);
		expect(mockFetch).not.toHaveBeenCalled();

		vi.advanceTimersByTime(50);
		await vi.runAllTimersAsync();

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith("/api/club/club-test-123/progress", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ currentPage: 25, totalPages: 100 }),
		});
		expect(onSync).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				currentPage: 25,
				totalPages: 100,
				percent: 25,
			}),
		);
	});

	it("clamps page numbers within valid range", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				currentPage: 100,
				totalPages: 100,
				percent: 100,
				updatedAt: Date.now(),
			}),
		});

		const synchronizer = createProgressSynchronizer("club-test-123", {
			fetchFn: mockFetch as unknown as typeof fetch,
		});

		synchronizer.syncPage(150, 100);
		vi.advanceTimersByTime(PROGRESS_DEBOUNCE_MS);
		await vi.runAllTimersAsync();

		expect(mockFetch).toHaveBeenCalledWith("/api/club/club-test-123/progress", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ currentPage: 100, totalPages: 100 }),
		});
	});

	it("handles API errors by calling onError callback", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({
				success: false,
				error: "Failed to update reading progress",
			}),
		});

		const onError = vi.fn();
		const synchronizer = createProgressSynchronizer("club-test-123", {
			fetchFn: mockFetch as unknown as typeof fetch,
			onError,
		});

		synchronizer.syncPage(30, 100);
		vi.advanceTimersByTime(PROGRESS_DEBOUNCE_MS);
		await vi.runAllTimersAsync();

		expect(onError).toHaveBeenCalledWith(expect.any(Error));
		expect(onError.mock.calls[0][0].message).toBe("Failed to update reading progress");
	});

	it("handles network failure by calling onError callback", async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error("Network connection dropped"));
		const onError = vi.fn();

		const synchronizer = createProgressSynchronizer("club-test-123", {
			fetchFn: mockFetch as unknown as typeof fetch,
			onError,
		});

		synchronizer.syncPage(30, 100);
		vi.advanceTimersByTime(PROGRESS_DEBOUNCE_MS);
		await vi.runAllTimersAsync();

		expect(onError).toHaveBeenCalledWith(expect.any(Error));
		expect(onError.mock.calls[0][0].message).toBe("Network connection dropped");
	});

	it("flushes pending sync immediately", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				currentPage: 50,
				totalPages: 200,
				percent: 25,
				updatedAt: Date.now(),
			}),
		});

		const synchronizer = createProgressSynchronizer("club-test-123", {
			fetchFn: mockFetch as unknown as typeof fetch,
		});

		synchronizer.syncPage(50, 200);
		const flushPromise = synchronizer.flush();
		const result = await flushPromise;

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(result?.currentPage).toBe(50);

		vi.advanceTimersByTime(PROGRESS_DEBOUNCE_MS);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("cancels pending update and prevents network request", () => {
		const mockFetch = vi.fn();
		const synchronizer = createProgressSynchronizer("club-test-123", {
			fetchFn: mockFetch as unknown as typeof fetch,
		});

		synchronizer.syncPage(50, 200);
		synchronizer.cancel();

		vi.advanceTimersByTime(PROGRESS_DEBOUNCE_MS * 2);
		expect(mockFetch).not.toHaveBeenCalled();
	});
});
