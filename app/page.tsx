export default function Home() {
  return (
      <div className="max-w-5xl mx-auto p-10 space-y-8">
            <div className="font-bold text-4xl">Was ist JWT (JSON Web Token)?</div>
          Ein Standard (RFC 7519) für kompakte, URL-sichere Tokens
          <div className="mt-2 text-sm flex gap-2 items-center bg-yellow-500/10 px-4 py-2 border border-yellow-300 rounded-lg w-full">
              <img src="/lightbulb.png" alt="Lightbulb icon" className="w-6"/>
              <div><span className="font-bold">Wichtig: </span>
                  Signiert, aber nicht verschlüsselt
                  Inhalt kann von jedem gelesen werden (Base64 codiert)</div>
          </div>
            <div className="font-bold">Für was?</div>
            <div className="mt-2 text-sm flex gap-2 items-center py-2 rounded-lg w-full">
                <div>Login / Session-Management
                    API-Authentifizierung</div>
            </div>
          <div className="font-bold">Wie ist der Aufbau?</div>
          <div className="mt-2 text-sm flex gap-2 items-center w-full">
              <img src="/jwt_structure.png" alt="structure image" className=""/>
          </div>


          <div className="font-bold text-4xl">Was ist JWE (JSON Web Encryption)?</div>
          Standard für verschlüsselte Tokens (Teil der JOSE-Spezifikation)
          <div className="mt-2 text-sm flex gap-2 items-center bg-yellow-500/10 px-4 py-2 border border-yellow-300 rounded-lg w-full">
              <img src="/lightbulb.png" alt="Lightbulb icon" className="w-6"/>
              <div><span className="font-bold">Unterschied zu JWT: </span>
                  JWT = meist JWS (signiert)
                  JWE = verschlüsselt
              </div>
          </div>
          <div className="font-bold">Für was?</div>
          <div className="-mt-10 text-sm flex gap-2 items-center py-2 rounded-lg w-full">
              <div>Schutz sensibler Daten durch Verschlüsselung - Übertragung sensibler Informationen
                  Sichere Kommunikation zwischen Services</div>
          </div>
      </div>
  );
}
