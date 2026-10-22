import app from './app';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'node:http';

const server = createServer(app);

const vite = await createViteServer({
  configFile: 'vite.config.ts',
  server: { middlewareMode: true, hmr: { server } },
  appType: 'spa',
});
app.use(vite.middlewares);

const port = Number(process.env.PORT ?? 3000);
server.listen(port, '0.0.0.0', () => {
  console.log(`Vehicle Desk preview listening on ${port}`);
});

const shutdown = async () => {
  server.close();
  await vite.close();
};
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
