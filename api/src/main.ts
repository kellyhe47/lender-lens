import { loadLenders, type Lender } from './lenders';
import { buildServer } from './server';

const PORT = Number(process.env.PORT ?? 3001);

// Load and validate the lender rules before accepting any request. A bad file
// stops the server here with a readable message (FR-B9).
let lenders: Lender[];
try {
  lenders = loadLenders();
} catch (error) {
  console.error(`Cannot start: ${(error as Error).message}`);
  process.exit(1);
}

const server = buildServer(lenders, { logger: true });
try {
  await server.listen({ port: PORT });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
