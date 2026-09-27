import {
	calculateProgressPercent,
	formatRacerTooltip,
	groupMembersByPosition,
} from "$lib/club/progress";
import { describe, expect, it } from "vitest";

describe("RaceTrack Component Logic & Calculations", () => {
	const members = [
		{
			id: "m1",
			username: "AliceReader",
			avatarUrl: "https://gravatar.com/avatar/1",
			currentPage: 150,
		},
		{
			id: "m2",
			username: "BobBookworm",
			avatarUrl: "https://gravatar.com/avatar/2",
			currentPage: 150,
		},
		{
			id: "m3",
			username: "CharlieNovels",
			avatarUrl: "https://gravatar.com/avatar/3",
			currentPage: 300,
		},
		{
			id: "m4",
			username: "DaveUnstarted",
			avatarUrl: "https://gravatar.com/avatar/4",
			currentPage: 0,
		},
	];

	it("groups tied members into single cluster nodes on the track", () => {
		const groups = groupMembersByPosition(members, 300);

		expect(groups).toHaveLength(3);

		// Page 0 group
		expect(groups[0].page).toBe(0);
		expect(groups[0].percent).toBe(0);
		expect(groups[0].members).toHaveLength(1);
		expect(groups[0].members[0].username).toBe("DaveUnstarted");

		// Page 150 tied group
		expect(groups[1].page).toBe(150);
		expect(groups[1].percent).toBe(50);
		expect(groups[1].members).toHaveLength(2);
		expect(groups[1].members.map((m) => m.username)).toEqual(["AliceReader", "BobBookworm"]);

		// Page 300 finished group
		expect(groups[2].page).toBe(300);
		expect(groups[2].percent).toBe(100);
		expect(groups[2].members).toHaveLength(1);
		expect(groups[2].members[0].username).toBe("CharlieNovels");
	});

	it("prevents divide-by-zero math errors when totalPages is 0", () => {
		expect(calculateProgressPercent(50, 0)).toBe(0);
		const groups = groupMembersByPosition(members, 0);
		for (const g of groups) {
			expect(g.percent).toBe(0);
		}
	});

	it("formats multi-member tie tooltips cleanly", () => {
		const tiedMembers = [members[0], members[1]];
		const tooltip = formatRacerTooltip(tiedMembers, 150, 300, 50);

		expect(tooltip.title).toBe("AliceReader, BobBookworm");
		expect(tooltip.subtitle).toBe("2 Tied • Page 150 / 300 (50%)");
	});

	it("formats unstarted member tooltips correctly", () => {
		const unstarted = [members[3]];
		const tooltip = formatRacerTooltip(unstarted, 0, 300, 0);

		expect(tooltip.title).toBe("DaveUnstarted");
		expect(tooltip.subtitle).toBe("Not started");
	});

	it("formats finished member tooltips correctly", () => {
		const finished = [members[2]];
		const tooltip = formatRacerTooltip(finished, 300, 300, 100);

		expect(tooltip.title).toBe("CharlieNovels");
		expect(tooltip.subtitle).toContain("Finished!");
	});
});
