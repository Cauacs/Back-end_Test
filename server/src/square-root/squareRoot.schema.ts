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
