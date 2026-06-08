export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request)
    const headers = new Headers(response.headers)

    headers.set('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://browser.sentry-cdn.com https://js.sentry-cdn.com https://challenges.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.sentry.io https://www.google-analytics.com https://analytics.google.com https://game.mscarabia.com https://api.gameanalytics.com https://recaptchaenterprise.googleapis.com https://challenges.cloudflare.com; " +
      "frame-src 'self' https://dont-touch-purple.web.app https://challenges.cloudflare.com; " +
      "worker-src 'self' blob:; " +
      "base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;"
    )
    headers.set('X-Frame-Options', 'DENY')
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    headers.set('X-XSS-Protection', '0')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}
