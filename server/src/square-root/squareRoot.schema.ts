import { z } from "zod";

export const calculateSquareRootSchema = z.object({
	body: z.object({
		input: z
			.number({
				required_error: "Input is required",
				invalid_type_error: "Input must be a number",
			})
			.finite("Input must be a finite number")
			.min(0, "Input must be greater than or equal to 0"),
	}),
});

export const getSquareRootHistorySchema = z.object({
	query: z.object({
		limit: z.coerce.number().int("Limit must be an integer").min(1).max(50).default(10),
		cursor: z.string().min(1, "Cursor cannot be empty").optional(),
	}),
});

export type SquareRootHistoryQuery = z.infer<typeof getSquareRootHistorySchema>["query"];
