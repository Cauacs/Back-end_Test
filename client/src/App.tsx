import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { SqrtCalculationRequest, SqrtCalculationResponse, SqrtHistoryResponse } from "@shared/types";
import "./App.css";

type ServiceResponse<T> = {
	success: boolean;
	message: string;
	responseObject: T;
	statusCode: number;
};

type ClearHistoryResponse = {
	deletedCount: number;
};

const HISTORY_LIMIT = 5;

async function requestJson<T>(url: string, init?: RequestInit): Promise<ServiceResponse<T>> {
	const response = await fetch(url, {
		headers: { "Content-Type": "application/json", ...init?.headers },
		...init,
	});
	const payload = (await response.json()) as ServiceResponse<T>;

	if (!response.ok || !payload.success) {
		throw new Error(payload.message || "Request failed");
	}

	return payload;
}

function formatNumber(value: number): string {
	return Number.isInteger(value) ? value.toString() : value.toPrecision(12).replace(/\.?0+$/, "");
}

function formatDate(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function App() {
	const [input, setInput] = useState("");
	const [latestResult, setLatestResult] = useState<SqrtCalculationResponse | null>(null);
	const [history, setHistory] = useState<SqrtCalculationResponse[]>([]);
	const [nextCursor, setNextCursor] = useState<string | undefined>();
	const [inputError, setInputError] = useState("");
	const [requestError, setRequestError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isHistoryLoading, setIsHistoryLoading] = useState(true);
	const [isClearing, setIsClearing] = useState(false);

	const latestResultLabel = useMemo(() => {
		if (!latestResult) return "No calculation yet";
		return formatNumber(latestResult.result);
	}, [latestResult]);

	const loadHistory = useCallback(async (cursor?: string) => {
		setRequestError("");
		setIsHistoryLoading(true);

		try {
			const params = new URLSearchParams({ limit: HISTORY_LIMIT.toString() });
			if (cursor) params.set("cursor", cursor);

			const payload = await requestJson<SqrtHistoryResponse>(`/square-root/history?${params.toString()}`);
			setHistory((current) => (cursor ? [...current, ...payload.responseObject.items] : payload.responseObject.items));
			setNextCursor(payload.responseObject.nextCursor);
		} catch (error) {
			setRequestError(error instanceof Error ? error.message : "Could not load calculation history");
		} finally {
			setIsHistoryLoading(false);
		}
	}, []);

	useEffect(() => {
		const loadTimer = window.setTimeout(() => {
			void loadHistory();
		}, 0);

		return () => window.clearTimeout(loadTimer);
	}, [loadHistory]);

	const validateInput = (): number | null => {
		const numericValue = Number(input);

		if (input.trim() === "") {
			setInputError("Enter a number.");
			return null;
		}

		if (!Number.isFinite(numericValue)) {
			setInputError("Enter a finite number.");
			return null;
		}

		if (numericValue < 0) {
			setInputError("Enter zero or a positive number.");
			return null;
		}

		setInputError("");
		return numericValue;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const numericValue = validateInput();
		if (numericValue === null) return;

		setRequestError("");
		setIsSubmitting(true);

		try {
			const requestBody: SqrtCalculationRequest = { input: numericValue };
			const payload = await requestJson<SqrtCalculationResponse>("/square-root/calculate", {
				method: "POST",
				body: JSON.stringify(requestBody),
			});

			setLatestResult(payload.responseObject);
			await loadHistory();
		} catch (error) {
			setRequestError(error instanceof Error ? error.message : "Could not calculate the square root");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClearHistory = async () => {
		setRequestError("");
		setIsClearing(true);

		try {
			await requestJson<ClearHistoryResponse>("/square-root/history", { method: "DELETE" });
			setHistory([]);
			setNextCursor(undefined);
			setLatestResult(null);
		} catch (error) {
			setRequestError(error instanceof Error ? error.message : "Could not clear calculation history");
		} finally {
			setIsClearing(false);
		}
	};

	return (
		<main className="app">
			<header className="app-header">
				<div>
					<p className="eyebrow">Newton-Raphson</p>
					<h1>Square root calculator</h1>
				</div>
				<div className="result-summary" aria-live="polite">
					<span>Latest result</span>
					<strong>{latestResultLabel}</strong>
				</div>
			</header>

			<section className="calculator-panel" aria-labelledby="calculator-title">
				<h2 id="calculator-title">Calculate</h2>
				<form className="calculator-form" onSubmit={handleSubmit}>
					<label htmlFor="sqrt-input">Number</label>
					<div className="input-row">
						<input
							id="sqrt-input"
							type="number"
							min="0"
							step="any"
							value={input}
							onChange={(event) => setInput(event.target.value)}
							aria-invalid={Boolean(inputError)}
							aria-describedby={inputError ? "input-error" : undefined}
							placeholder="144"
						/>
						<button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Calculating..." : "Calculate"}
						</button>
					</div>
					{inputError && (
						<p id="input-error" className="field-error">
							{inputError}
						</p>
					)}
				</form>
				{latestResult && (
					<div className="result-detail">
						<span>sqrt({formatNumber(latestResult.input)})</span>
						<strong>{formatNumber(latestResult.result)}</strong>
					</div>
				)}
			</section>

			<section className="history-panel" aria-labelledby="history-title">
				<div className="section-heading">
					<h2 id="history-title">History</h2>
					<button type="button" className="secondary-button" onClick={handleClearHistory} disabled={isClearing || history.length === 0}>
						{isClearing ? "Clearing..." : "Clear history"}
					</button>
				</div>

				{requestError && <p className="request-error">{requestError}</p>}

				<div className="table-frame">
					<table>
						<thead>
							<tr>
								<th scope="col">Input</th>
								<th scope="col">Result</th>
								<th scope="col">Created</th>
							</tr>
						</thead>
						<tbody>
							{history.map((calculation) => (
								<tr key={calculation.id}>
									<td>{formatNumber(calculation.input)}</td>
									<td>{formatNumber(calculation.result)}</td>
									<td>{formatDate(calculation.createdAt)}</td>
								</tr>
							))}
							{history.length === 0 && (
								<tr>
									<td colSpan={3} className="empty-state">
										{isHistoryLoading ? "Loading history..." : "No calculations saved."}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				<div className="history-actions">
					<button type="button" className="secondary-button" onClick={() => void loadHistory(nextCursor)} disabled={!nextCursor || isHistoryLoading}>
						{isHistoryLoading && nextCursor ? "Loading..." : "Load more"}
					</button>
				</div>
			</section>
		</main>
	);
}

export default App;
