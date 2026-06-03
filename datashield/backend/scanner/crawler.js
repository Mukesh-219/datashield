import axios from 'axios';
import { load } from 'cheerio';

export async function crawlTarget(targetUrl, maxEndpoints = 10, timeout = 5000) {
  const discoveredLinks = new Set();
  const discoveredEndpoints = new Set();
  const forms = [];
  const getParams = [];

  const addEndpoint = (endpoint) => {
    if (!endpoint) return;
    if (!discoveredEndpoints.has(endpoint) && discoveredEndpoints.size < maxEndpoints) {
      discoveredEndpoints.add(endpoint);
    }
  };

  const addGetParams = (endpoint, params) => {
    if (!endpoint || !params || params.length === 0) return;
    const normalizedParams = Array.from(new Set(params.filter(Boolean)));
    if (normalizedParams.length === 0) return;

    const existing = getParams.find((item) => item.endpoint === endpoint);
    if (existing) {
      existing.params = Array.from(new Set([...existing.params, ...normalizedParams]));
    } else {
      getParams.push({ endpoint, params: normalizedParams });
    }
  };

  const normalizePath = (rawPath) => {
    if (!rawPath) return null;
    try {
      const url = new URL(rawPath, targetUrl);
      if (url.origin !== new URL(targetUrl).origin) return null;
      return url.pathname;
    } catch (err) {
      if (rawPath.startsWith('/')) return rawPath;
      return `/${rawPath}`;
    }
  };

  try {
    const res = await axios.get(targetUrl, { timeout });
    const html = res.data || '';
    const $ = load(html);
    const baseUrl = new URL(targetUrl);

    const addLink = (href) => {
      if (!href) return;
      try {
        const url = new URL(href, baseUrl);
        if (url.origin !== baseUrl.origin) return;
        const path = url.pathname || '/';
        discoveredLinks.add(path);
        addEndpoint(path);

        const params = Array.from(url.searchParams.keys()).filter(Boolean);
        addGetParams(path, params);
      } catch (error) {
        // skip invalid links
      }
    };

    $('a[href], link[href]').each((_, el) => {
      addLink($(el).attr('href'));
    });

    $('form').each((_, el) => {
      const form = $(el);
      let action = form.attr('action') || '';
      const method = (form.attr('method') || 'GET').trim().toUpperCase();

      action = normalizePath(action) || baseUrl.pathname || '/';
      addEndpoint(action);

      const inputNames = new Set();
      form.find('input[name], textarea[name], select[name]').each((_, field) => {
        const name = $(field).attr('name');
        if (name) inputNames.add(name);
      });

      const inputs = Array.from(inputNames);
      forms.push({ action, method, inputs });

      if (method === 'GET') {
        addGetParams(action, inputs);
      }
    });

    if (discoveredEndpoints.size === 0) {
      discoveredLinks.add('/');
      discoveredEndpoints.add('/');
    }

    return {
      links: Array.from(discoveredLinks).slice(0, maxEndpoints),
      forms,
      endpoints: Array.from(discoveredEndpoints).slice(0, maxEndpoints),
      getParams,
    };
  } catch (err) {
    return {
      links: ['/'],
      forms: [],
      endpoints: ['/'],
      getParams: [],
    };
  }
}

export default crawlTarget;
