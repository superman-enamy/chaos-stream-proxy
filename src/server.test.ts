import fastify from 'fastify';
import { registerRoutes } from './routes';
import {
  HLS_PROXY_MASTER,
  HLS_PROXY_MEDIA,
  SEGMENTS_PROXY_SEGMENT
} from './segments/constants';

describe('Chaos Stream Proxy server', () => {
  const env = process.env;
  let app = null;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    app = fastify();
    registerRoutes(app);
  });

  afterEach(() => {
    process.env = env;
  });

  it.each([HLS_PROXY_MASTER, HLS_PROXY_MEDIA, SEGMENTS_PROXY_SEGMENT])(
    'route %p contains x-version header',
    async (route) => {
      const response = await app.inject(route);
      expect(response.headers).toEqual(
        expect.objectContaining({
          'x-version': process.env.npm_package_version
        })
      );
    }
  );

  it('requires token when running with env JWT_SECRET set', async () => {
    process.env.JWT_SECRET = 'somesecret';
    const appInternal = fastify();
    registerRoutes(appInternal);
    const invalidResponse = await appInternal.inject('/?token=invalid');
    expect(invalidResponse.statusCode).toEqual(401);

    const validResponse = await appInternal.inject(
      '/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55IjoidGVzdGNvbXBhbnkiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiaWF0IjoxNjg2MTUzMzU5fQ.wHnzxMdoPZlzdU0GDCzEwd5lnEmq-rX2Ew0yODxqlzg'
    );
    expect(validResponse.statusCode).toEqual(200);
  });

  it('ignores token when running without env JWT_SECRET set', async () => {
    process.env.JWT_SECRET = undefined;
    const appInternal = fastify();
    registerRoutes(appInternal);
    const response = await appInternal.inject('/?token=invalid');
    expect(response.statusCode).toEqual(200);
  });
});
