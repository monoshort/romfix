/**
 * Cloudflare Worker: serveert de statische Romfix-rekentool via [assets].
 */
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/contact' || url.pathname === '/contact/') {
            return env.ASSETS.fetch(new Request(new URL('/contact.html', url.origin), request));
        }
        return env.ASSETS.fetch(request);
    },
};
