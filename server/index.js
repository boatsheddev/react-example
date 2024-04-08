import Fastify from 'fastify';
import fetch  from 'node-fetch';
import cors from '@fastify/cors';

const fastify = Fastify({
	logger: true,
});

await fastify.register(cors, { 
  // This is not recommended for production.
  origin: true,
})

// Pick up the CLIENT_SECRET env or use the default local environment instead
const CLIENT_SECRET = process.env.CLIENT_SECRET || '95fb244f-0858-4ea9-86b4-683850f14ae6';
const AUTHORIZATION_SERVER_TOKEN_URL = process.env.AUTHORIZATION_SERVER_TOKEN_URL || 'http://localhost:1991/api/token'; // e.g https://oauth2.googleapis.com/token

fastify.get('/token', async (request, reply) => {
	const { code, client_id, redirect_uri } = request.query;

	const data = await fetch(
		`${AUTHORIZATION_SERVER_TOKEN_URL}?grant_type=authorization_code&client_id=${client_id}&client_secret=${CLIENT_SECRET}&redirect_uri=${redirect_uri}&code=${code}`,
		{
			method: 'POST',
		}
	);

	reply.send(await data.json());
});

fastify.listen({port: 1995}, (error) => {
	if (error) throw error;
});
