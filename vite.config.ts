import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const mimeTypes: Record<string, string> = {
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

function copyDirectory(source: string, target: string) {
  if (!existsSync(source)) {
    return;
  }
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry);
    const targetPath = join(target, entry);
    if (statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function generatedAssetPlugin(): Plugin {
  const root = process.cwd();
  return {
    name: 'generated-asset-plugin',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url?.split('?')[0] ?? '';
        if (!url.startsWith('/assets/') && !url.startsWith('/data/')) {
          next();
          return;
        }
        const filePath = resolve(root, url.slice(1));
        if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
          next();
          return;
        }
        response.setHeader('Content-Type', mimeTypes[extname(filePath)] ?? 'application/octet-stream');
        createReadStream(filePath).pipe(response);
      });
    },
    closeBundle() {
      copyDirectory(resolve(root, 'assets'), resolve(root, 'dist/assets'));
      copyDirectory(resolve(root, 'data'), resolve(root, 'dist/data'));
    }
  };
}

export default defineConfig({
  plugins: [generatedAssetPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  }
});
