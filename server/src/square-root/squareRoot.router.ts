import type { NextFunction, Request, Response } from "express";
import { Router } from "express";

import type { SqrtCalculationRequest } from "@shared/types";

import { handleServiceResponse, validateRequest } from "@/common/utils/httpHandlers";

import { calculateSquareRootSchema, getSquareRootHistorySchema, type SquareRootHistoryQuery } from "./squareRoot.schema";
import { squareRootService } from "./squareRoot.service";

export const squareRootRouter = Router();

squareRootRouter.get(
	"/history",
	validateRequest(getSquareRootHistorySchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const serviceResponse = await squareRootService.getHistory(req.query as SquareRootHistoryQuery);
			return handleServiceResponse(serviceResponse, res);
		} catch (error) {
			next(error);
		}
	},
);

squareRootRouter.post(
	"/calculate",
	validateRequest(calculateSquareRootSchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const serviceResponse = await squareRootService.calculate(req.body as SqrtCalculationRequest);
			return handleServiceResponse(serviceResponse, res);
		} catch (error) {
			next(error);
		}
	},
);
