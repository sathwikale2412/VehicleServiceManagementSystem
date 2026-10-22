import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const rewrittenPath = req.query.path;
  const normalizedPath = Array.isArray(rewrittenPath) ? rewrittenPath.join('/') : rewrittenPath;
  if (typeof normalizedPath === 'string' && normalizedPath.length > 0) {
    const remainingQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'path') continue;
      for (const part of Array.isArray(value) ? value : [value]) {
        if (typeof part === 'string') remainingQuery.append(key, part);
      }
    }
    const suffix = remainingQuery.toString();
    req.url = `/api/${normalizedPath}${suffix ? `?${suffix}` : ''}`;
  } else if (req.url?.startsWith('/api/index')) {
    req.url = '/api/health';
  }
  return app(req, res);
}
