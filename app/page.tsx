import Link from "next/link";

export default function Home() {
  return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
            <Link
                href="/home"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
                Zu Home
            </Link>
        </div>

        <div className="font-bold text-3xl">Was ist JWT (JSON Web Token)?</div>
        <div className="text-sm">Ein Standard (RFC 7519) für kompakte, URL-sichere Tokens</div>
        <div className="text-sm flex gap-2 items-start bg-yellow-500/10 px-4 py-3 border border-yellow-300 rounded-lg w-full">
            <img src="/lightbulb.png" alt="Lightbulb icon" className="w-6 mt-0.5 shrink-0"/>
            <div><span className="font-bold">Wichtig: </span>
                Signiert, aber nicht verschlüsselt — Inhalt kann von jedem gelesen werden (Base64 codiert)</div>
        </div>
        <div className="font-bold">Für was?</div>
        <div className="text-sm">Login / Session-Management, API-Authentifizierung</div>
        <div className="font-bold">Wie ist der Aufbau?</div>
        <div className="w-full">
            <img src="/jwt_structure.png" alt="structure image" className="w-full h-auto"/>
        </div>

        <div className="font-bold text-3xl">Was ist JWE (JSON Web Encryption)?</div>
        <div className="text-sm">Standard für verschlüsselte Tokens (Teil der JOSE-Spezifikation)</div>
        <div className="text-sm flex gap-2 items-start bg-yellow-500/10 px-4 py-3 border border-yellow-300 rounded-lg w-full">
            <img src="/lightbulb.png" alt="Lightbulb icon" className="w-6 mt-0.5 shrink-0"/>
            <div><span className="font-bold">Unterschied zu JWT: </span>
                JWT = meist JWS (signiert) — JWE = verschlüsselt
            </div>
        </div>
        <div className="font-bold">Für was?</div>
        <div className="text-sm">Schutz sensibler Daten durch Verschlüsselung, Übertragung sensibler Informationen, sichere Kommunikation zwischen Services</div>
    </div>
  );
}
