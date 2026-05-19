import { StatusCodes } from "http-status-codes";

import type { SqrtCalculationRequest, SqrtCalculationResponse } from "@shared/types";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { NewtonRaphsonAlgorithm, SqrtCalculator } from "@/common/models/square-root";

import { squareRootRepository, type SquareRootRepository } from "./squareRoot.repository";

export class SquareRootService {
	constructor(private readonly repository: SquareRootRepository = squareRootRepository) {}

	async calculate(request: SqrtCalculationRequest): Promise<ServiceResponse<SqrtCalculationResponse>> {
		const result = await this.calculateAsync(request.input);
		const calculation = await this.repository.createCalculation(request.input, result);

		return ServiceResponse.success("Square root calculated successfully", calculation, StatusCodes.CREATED);
	}

	private calculateAsync(input: number): Promise<number> {
		return new Promise((resolve, reject) => {
			setImmediate(() => {
				try {
					const calculator = new SqrtCalculator(input, new NewtonRaphsonAlgorithm());
					resolve(calculator.calculate());
				} catch (error) {
					reject(error);
				}
			});
		});
	}
}

export const squareRootService = new SquareRootService();
