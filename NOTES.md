# Implementation Notes

- I extracted the initial guess into a private helper to separate the setup decision from the iteration formula, while keeping the behavior encapsulated inside the algorithm class.
- I split the calculate endpoint into schema, router, and service files so HTTP validation stays at the edge and the calculation workflow stays reusable.
- I kept `common/models/square-root` as the pure domain layer and created `src/square-root` as the API feature module, so Express/Zod concerns do not leak into the calculation model.
- I wrapped the calculation in `setImmediate` to create an async boundary for the POC while preserving the deterministic `SqrtCalculator` + `NewtonRaphsonAlgorithm` flow; if the calculation became genuinely expensive, this boundary could move to `worker_threads`.
- I chose `setImmediate` because this square-root calculation is cheap and the README allows it as a lightweight POC option; I would not describe it as true parallel CPU work, but it keeps the service contract async and easy to replace with `worker_threads` or a queue later. **Using worker_threads right now would add more infrastructure than value**, worker file, message parsing, lifecycle, error handling etc.  
- I added Prisma behind a feature repository so the service persists successful calculations without coupling the route or the calculation model to database details.
- I used Prisma 7's generated-client output and SQLite driver adapter, and added prebuild/pretest generation so ignored generated files are recreated on a fresh checkout.
- I added a `prestart:dev` Prisma setup step so a reviewer can run the normal dev script and get generated client code plus an initialized SQLite table before the API starts.

route -> service -> repository -> Prisma
- I used the last returned calculation `id` as the history cursor, ordered newest-first, and fetch `limit + 1` rows to know when to expose `nextCursor`.
