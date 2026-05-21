import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

const allowedCorsOrigins = new Set([
  'https://sac-repuestos.com.ar',
  'https://6000-firebase-studio-1764450840999.cluster-f73ibkkuije66wssuontdtbx6q.cloudworkstations.dev',
]);

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin(origin, callback) {
      if (!origin) return callback(null, false);

      callback(null, allowedCorsOrigins.has(normalizeOrigin(origin)));
    },
    methods: 'GET,POST,PATCH,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Autopartes API')
    .setDescription('API para el sistema de búsqueda de repuestos')
    .setVersion('1.0')
    .addTag('productos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
