import Studio from "./studio";
export const dynamic = "force-dynamic";
export default function Page() {
  const daemonUrl = process.env.GAMEAGENT_DAEMON_URL;
  const token = process.env.GAMEAGENT_DAEMON_TOKEN;
  if (!daemonUrl || !token)
    return (
      <main className="setup">
        <h1>Game Agent Network</h1>
        <p>Connect your local production workspace.</p>
        <p>
          Initialize a project using the README, then run <code>pnpm dev</code>.
        </p>
      </main>
    );
  const url = new URL(daemonUrl);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.protocol !== "http:"
  )
    throw new Error("Studio requires a loopback daemon URL");
  const websocketUrl = new URL("/events/ws", daemonUrl);
  websocketUrl.protocol = "ws:";
  return <Studio websocketUrl={websocketUrl.toString()} />;
}
