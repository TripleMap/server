import { NestFactory, FastifyAdapter } from '@nestjs/core';
import { config } from 'dotenv';
config();

import { CustomExceptionFilter } from './exeptions/custom-exception.filter';
import { AppModule } from './app/app.module';

import * as compression from 'fastify-compress';
import * as cors from 'cors';
import * as dnsPrefetchControl from 'dns-prefetch-control';
import * as frameguard from 'frameguard';
import * as hidePoweredBy from 'hide-powered-by';
import * as hsts from 'hsts';
import * as ienoopen from 'ienoopen';
import * as xssProtection from 'x-xss-protection';
import * as helmet from 'fastify-helmet';
import * as iltorb from 'iltorb';
import * as fStatic from 'fastify-static';
import * as path from 'path';

(async () => {
	const fastify = new FastifyAdapter({ logger: false });
	const app = await NestFactory.create(AppModule, fastify);

	app.useGlobalFilters(new CustomExceptionFilter());

	fastify.use(dnsPrefetchControl());
	fastify.use(frameguard());
	fastify.use(hidePoweredBy());
	fastify.use(hsts());
	fastify.use(ienoopen());
	fastify.use(xssProtection());

	fastify.register(helmet);
	fastify.use(cors());
	fastify.register(compression, { brotli: iltorb });

	fastify.register(fStatic, { root: path.join(__dirname, '../client') });
	fastify.get('/', (req, reply) => reply.sendFile('index.html'));
	fastify.get('/tdmap', (req, reply) => reply.sendFile('index.html'));
	fastify.get('/login', (req, reply) => reply.sendFile('index.html'));
	console.log(process.env.PORT);

	await app.listen(process.env.PORT && !isNaN(+ process.env.PORT) ? + process.env.PORT : 3000, '0.0.0.0');
})();
