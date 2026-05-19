import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ZodError, ZodSchema } from "zod";

import { ServiceResponse } from "@/common/models/serviceResponse";

export const handleServiceResponse = (serviceResponse: ServiceResponse<unknown>, response: Response) => {
	return response.status(serviceResponse.statusCode).send(serviceResponse);
};

export const validateRequest = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
	try {
		const validated = schema.parse({ body: req.body, query: req.query, params: req.params }) as {
			body?: Request["body"];
			query?: Request["query"];
			params?: Request["params"];
		};

		req.body = validated.body ?? req.body;
		req.query = validated.query ?? req.query;
		req.params = validated.params ?? req.params;
		next();
	} catch (err) {
		const errorMessage = `Invalid input: ${(err as ZodError).errors.map((e) => e.message).join(", ")}`;
		const statusCode = StatusCodes.BAD_REQUEST;
		const serviceResponse = ServiceResponse.failure(errorMessage, null, statusCode);
		return handleServiceResponse(serviceResponse, res);
	}
};
