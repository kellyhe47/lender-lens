import cors from '@fastify/cors';
import Fastify, { type FastifyError, type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { Lender } from './lenders';
import { buildQuote } from './quote';
import { validateQuoteRequest } from './validation';

/** The origin the web dev server runs on. Override with WEB_ORIGIN. */
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

/**
 * Builds the app without listening, so tests can drive it with `inject`.
 * Lenders are passed in: they are loaded once at startup, not per request.
 */
export function buildServer(lenders: Lender[], options: FastifyServerOptions = {}): FastifyInstance {
  const server = Fastify(options);

  server.register(cors, { origin: WEB_ORIGIN });

  // The only endpoint. Malformed input is a 400; a lender declining is a normal
  // 200 with that lender marked declined (FR-B13).
  server.post('/quote', (request, reply) => {
    const result = validateQuoteRequest(request.body);
    if (!result.ok) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', details: result.details });
    }
    return { offers: buildQuote(lenders, result.request) };
  });

  server.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: 'NOT_FOUND' });
  });

  server.setErrorHandler((error: FastifyError, request, reply) => {
    // Fastify rejects some requests before the route runs (body is not valid
    // JSON, wrong content type, too large). Those are the caller's fault: keep
    // Fastify's 4xx status and use the same body shape as our own validation.
    if (error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 500) {
      return reply
        .code(error.statusCode)
        .send({ error: 'VALIDATION_ERROR', details: [{ field: 'body', message: error.message }] });
    }
    // Anything else is our bug. Log it; never leak the message or stack (FR-B15).
    request.log.error(error);
    return reply.code(500).send({ error: 'INTERNAL_ERROR' });
  });

  return server;
}
