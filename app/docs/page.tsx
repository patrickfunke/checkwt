"use client";

import { useEffect } from 'react';

export default function DocsPage() {
  useEffect(() => {
    document.title = 'API Docs';

    const cssId = 'swagger-ui-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/swagger-ui-dist/swagger-ui.css';
      document.head.appendChild(link);
    }

    function init() {
      // initialize Swagger UI from global bundle
      // @ts-ignore
      if (!(window as any).SwaggerUIBundle) return;
      // @ts-ignore
      (window as any).SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        layout: 'BaseLayout',
        requestInterceptor: (req) => {
          try {
            const original = new URL(req.url);
            // Route external requests to local origin + /api prefix
            const local = new URL(window.location.origin);
            // Ensure path is prefixed with /api when calling Next API routes
            let pathname = original.pathname;
            if (!pathname.startsWith('/api')) {
              pathname = '/api' + pathname;
            }
            local.pathname = pathname;
            const newUrl = local.toString();
            req.url = newUrl;
          } catch (e) {
            // leave request unchanged on error
          }
          return req;
        },
      });
    }

    if (!(window as any).SwaggerUIBundle) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js';
      s.async = true;
      s.onload = init;
      document.body.appendChild(s);
    } else {
      init();
    }

    return () => {
      const el = document.getElementById('swagger-ui');
      if (el) el.innerHTML = '';
    };
  }, []);

  return <div id="swagger-ui" style={{ height: '100vh' }} />;
}
