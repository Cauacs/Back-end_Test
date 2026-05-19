import { StatusCodes } from "http-status-codes";
import request from "supertest";

import { prisma } from "@/common/database/prisma";
import { app } from "@/server";

describe("Square root routes", () => {
	beforeEach(async () => {
		await prisma.calculation.deleteMany();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it("calculates and persists a square-root result", async () => {
		const response = await request(app).post("/square-root/calculate").send({ input: 49 });

		expect(response.status).toBe(StatusCodes.CREATED);
		expect(response.body.success).toBe(true);
		expect(response.body.responseObject.input).toBe(49);
		expect(response.body.responseObject.result).toBeCloseTo(7, 7);
		expect(response.body.responseObject.id).toEqual(expect.any(String));
		expect(response.body.responseObject.createdAt).toEqual(expect.any(String));
		await expect(prisma.calculation.count()).resolves.toBe(1);
	});

	it("returns paginated history with a cursor", async () => {
		await prisma.calculation.createMany({
			data: [
				{
					id: "oldest",
					input: 4,
					result: 2,
					createdAt: new Date("2026-01-01T00:00:00.000Z"),
				},
				{
					id: "middle",
					input: 9,
					result: 3,
					createdAt: new Date("2026-01-02T00:00:00.000Z"),
				},
				{
					id: "newest",
					input: 16,
					result: 4,
					createdAt: new Date("2026-01-03T00:00:00.000Z"),
				},
			],
		});

		const firstPage = await request(app).get("/square-root/history").query({ limit: 2 });

		expect(firstPage.status).toBe(StatusCodes.OK);
		expect(firstPage.body.responseObject.items.map((item: { id: string }) => item.id)).toEqual(["newest", "middle"]);
		expect(firstPage.body.responseObject.nextCursor).toBe("middle");

		const secondPage = await request(app).get("/square-root/history").query({
			limit: 2,
			cursor: firstPage.body.responseObject.nextCursor,
		});

		expect(secondPage.status).toBe(StatusCodes.OK);
		expect(secondPage.body.responseObject.items.map((item: { id: string }) => item.id)).toEqual(["oldest"]);
		expect(secondPage.body.responseObject.nextCursor).toBeUndefined();
	});

	it("clears calculation history", async () => {
		await prisma.calculation.createMany({
			data: [
				{ input: 4, result: 2 },
				{ input: 9, result: 3 },
			],
		});

		const response = await request(app).delete("/square-root/history");

		expect(response.status).toBe(StatusCodes.OK);
		expect(response.body.responseObject.deletedCount).toBe(2);
		await expect(prisma.calculation.count()).resolves.toBe(0);
	});
});
