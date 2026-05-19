import type { SqrtCalculationResponse } from "@shared/types";

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
