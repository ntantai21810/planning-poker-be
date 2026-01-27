import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import * as tls from 'tls';
import { AppModule } from './app.module';

async function bootstrap() {
  const sslEnabled = process.env.SSL_ENABLED === 'true';
  const sslKeyPath = process.env.SSL_KEY_PATH || '/app/certs/privkey.pem';
  const sslCertPath = process.env.SSL_CERT_PATH || '/app/certs/fullchain.pem';

  let httpsOptions: tls.SecureContextOptions | undefined = undefined;

  if (sslEnabled) {
    if (existsSync(sslKeyPath) && existsSync(sslCertPath)) {
      httpsOptions = {
        key: readFileSync(sslKeyPath),
        cert: readFileSync(sslCertPath),
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
      };
      console.log('🔒 SSL certificates loaded, HTTPS mode enabled (TLS 1.2/1.3)');
    } else {
      console.warn('⚠️ SSL_ENABLED is true but certificate files not found, falling back to HTTP');
    }
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`🚀 Server running on ${protocol}://localhost:${port}`);
}
bootstrap();
