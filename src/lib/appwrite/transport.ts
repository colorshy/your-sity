import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";
let configured = false;
export function configureTransport() {
  if (
    !configured &&
    (process.env.HTTPS_PROXY ||
      process.env.HTTP_PROXY ||
      process.env.https_proxy ||
      process.env.http_proxy)
  ) {
    setGlobalDispatcher(new EnvHttpProxyAgent());
    configured = true;
  }
}
