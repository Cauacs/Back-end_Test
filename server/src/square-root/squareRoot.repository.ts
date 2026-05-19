import type { SqrtCalculationResponse, SqrtHistoryResponse } from "@shared/types";

import { prisma } from "@/common/database/prisma";

type PersistedCalculation = {
	id: string;
	input: number;
	result: number;
	createdAt: Date;
};

export class SquareRootRepository {
	async createCalculation(input: number, result: number): Promise<SqrtCalculationResponse> {
		const calculation = await prisma.calculation.create({
			data: {
				input,
				result,
			},
		});

		return this.toResponse(calculation);
	}

	async listHistory(limit: number, cursor?: string): Promise<SqrtHistoryResponse> {
		const cursorExists = cursor
			? await prisma.calculation.findUnique({
					where: { id: cursor },
					select: { id: true },
				})
			: null;

		if (cursor && !cursorExists) {
			return { items: [] };
		}

		const calculations = await prisma.calculation.findMany({
			take: limit + 1,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		});
		const pageItems = calculations.slice(0, limit).map((calculation) => this.toResponse(calculation));
		const lastItem = pageItems.at(-1);

		return {
			items: pageItems,
			...(calculations.length > limit && lastItem ? { nextCursor: lastItem.id } : {}),
		};
	}

	private toResponse(calculation: PersistedCalculation): SqrtCalculationResponse {
		return {
			id: calculation.id,
			input: calculation.input,
			result: calculation.result,
			createdAt: calculation.createdAt.toISOString(),
		};
	}
}

export const squareRootRepository = new SquareRootRepository();
