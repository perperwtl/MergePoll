import { env } from "cloudflare:workers";
import Introduction from "./introduction";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Introduction
      demo={(env as unknown as { PUBLIC_DEMO?: string }).PUBLIC_DEMO === "true"}
    />
  );
}
