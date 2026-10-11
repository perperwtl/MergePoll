declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    TYPESAFE_API_KEY?: string;
    ORGANIZER_TOKEN?: string;
    LOCAL_DEMO?: string;
  }
}
