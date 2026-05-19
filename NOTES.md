# Implementation Notes

- I extracted the initial guess into a private helper to separate the setup decision from the iteration formula, while keeping the behavior encapsulated inside the algorithm class.
- I split the calculate endpoint into schema, router, and service files so HTTP validation stays at the edge and the calculation workflow stays reusable.
- I kept `common/models/square-root` as the pure domain layer and created `src/square-root` as the API feature module, so Express/Zod concerns do not leak into the calculation model.
- I wrapped the calculation in `setImmediate` to create an async boundary for the POC while preserving the deterministic `SqrtCalculator` + `NewtonRaphsonAlgorithm` flow; if the calculation became genuinely expensive, this boundary could move to `worker_threads`.
- I chose `setImmediate` because this square-root calculation is cheap and the README allows it as a lightweight POC option; I would not describe it as true parallel CPU work, but it keeps the service contract async and easy to replace with `worker_threads` or a queue later. **Using worker_threads right now would add more infrastructure than value**, worker file, message parsing, lifecycle, error handling etc.  
