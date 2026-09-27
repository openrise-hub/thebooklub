import {
	assignCandidateColor,
	createCandidateBook,
	validateCandidateCount,
} from "$lib/club/selection";
import { describe, expect, it } from "vitest";

describe("Selection Page Candidate Logic", () => {
	it("maintains consistent color indexing when candidates are removed", () => {
		const b1 = createCandidateBook({ title: "Book 1", author: "Author 1" }, 0);
		const b2 = createCandidateBook({ title: "Book 2", author: "Author 2" }, 1);
		const b3 = createCandidateBook({ title: "Book 3", author: "Author 3" }, 2);

		let list = [b1, b2, b3];
		expect(list[0].themeColor).toBe("purple");
		expect(list[1].themeColor).toBe("blue");
		expect(list[2].themeColor).toBe("green");

		// Remove second candidate (index 1)
		list = list
			.filter((c) => c.id !== b2.id)
			.map((c, idx) => {
				const { themeColor, colorHex } = assignCandidateColor(idx);
				return { ...c, themeColor, colorHex };
			});

		expect(list).toHaveLength(2);
		expect(list[0].title).toBe("Book 1");
		expect(list[0].themeColor).toBe("purple");

		expect(list[1].title).toBe("Book 3");
		expect(list[1].themeColor).toBe("blue"); // reassigned index 1
	});

	it("reorders candidates correctly when moving up and down", () => {
		const b1 = createCandidateBook({ title: "Book 1", author: "Author 1" }, 0);
		const b2 = createCandidateBook({ title: "Book 2", author: "Author 2" }, 1);

		const updated = [b2, b1].map((c, idx) => {
			const { themeColor, colorHex } = assignCandidateColor(idx);
			return { ...c, themeColor, colorHex };
		});

		expect(updated[0].title).toBe("Book 2");
		expect(updated[0].themeColor).toBe("purple");
		expect(updated[1].title).toBe("Book 1");
		expect(updated[1].themeColor).toBe("blue");
	});

	it("blocks launch when fewer than 2 candidates exist", () => {
		expect(validateCandidateCount(0).valid).toBe(false);
		expect(validateCandidateCount(1).valid).toBe(false);
		expect(validateCandidateCount(2).valid).toBe(true);
	});
});
