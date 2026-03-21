import { Button } from "@/components/ui/button";
import { useState } from "react";
import JwtTextarea from "./JWTTextarea";
import highlightJwt from "./HighlightJWT";
import TextAreaWrapper from "@/app/components/TextAreaWrapper.tsx";

const JWT_ALGS = ["EdDSA", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"] as const;
const JWE_ALGS = ["RSA-OAEP", "RSA-OAEP-256", "RSA-OAEP-384", "RSA-OAEP-512", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"] as const;
const JWE_ENCS = ["A128GCM", "A192GCM", "A256GCM", "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512"] as const;

export default function EncoderForm() {
    const [mode, setMode] = useState<"jwt" | "jwe">("jwt");
    const [jwtAlg, setJwtAlg] = useState<(typeof JWT_ALGS)[number]>("EdDSA");
    const [jweAlg, setJweAlg] = useState<(typeof JWE_ALGS)[number]>("RSA-OAEP-256");
    const [jweEnc, setJweEnc] = useState<(typeof JWE_ENCS)[number]>("A256GCM");
    const [payload, setPayload] = useState('{"sub": "1234567890",\n  "name": "John Doe"}');
    const [encoded, setEncoded] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function copyTextToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    }

    const doEncodeCall = async () => {
        let parsedPayload;
        try {
            parsedPayload = JSON.parse(payload);
        } catch (e) {
            setErrorMessage("Payload is not valid JSON");
            setEncoded("");
            return;
        }

        const header = mode === "jwe"
            ? { alg: jweAlg, enc: jweEnc, typ: "JWT" }
            : { alg: jwtAlg, typ: "JWT" };

        try {
            const res = await fetch("/api/encode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mode, header, payload: parsedPayload }),
            });

            if (!res.ok) {
                const data = await res.json();
                setErrorMessage(data.error || "Encoding failed");
                setEncoded("");
                return;
            }

            const data = await res.json();
            setErrorMessage(null);
            setEncoded(data.token ?? "");
        } catch (err) {
            console.error("Error encoding JWT:", err);
            setErrorMessage("Encoding failed");
            setEncoded("");
        }
    };
    return (
        <>
        <div className="flex gap-4 opacity-60 text-sm mb-2">
                <div>Select mode and jose-supported algorithms, then generate your token from payload JSON.</div>
                <div className="text-red-500">{errorMessage ?? ""}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <TextAreaWrapper
                            title="Header Options"
                            deleteEnabled={false}
                            copyEnabled={false}
                            formContentText={""}
                        >
                            <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] p-4 space-y-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium" htmlFor="mode-select">Mode</label>
                                    <select
                                        id="mode-select"
                                        className="w-full rounded-md border border-gray-300 dark:border-[#1e1e1e] bg-white dark:bg-[#272829] px-3 py-2"
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as "jwt" | "jwe")}
                                    >
                                        <option value="jwt">JWT (JWS)</option>
                                        <option value="jwe">JWE</option>
                                    </select>
                                </div>

                                {mode === "jwt" ? (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium" htmlFor="jwt-alg-select">alg</label>
                                        <select
                                            id="jwt-alg-select"
                                            className="w-full rounded-md border border-gray-300 dark:border-[#1e1e1e] bg-white dark:bg-[#272829] px-3 py-2"
                                            value={jwtAlg}
                                            onChange={(e) => setJwtAlg(e.target.value as (typeof JWT_ALGS)[number])}
                                        >
                                            {JWT_ALGS.map((alg) => (
                                                <option key={alg} value={alg}>{alg}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium" htmlFor="jwe-alg-select">alg</label>
                                            <select
                                                id="jwe-alg-select"
                                                className="w-full rounded-md border border-gray-300 dark:border-[#1e1e1e] bg-white dark:bg-[#081327] px-3 py-2"
                                                value={jweAlg}
                                                onChange={(e) => setJweAlg(e.target.value as (typeof JWE_ALGS)[number])}
                                            >
                                                {JWE_ALGS.map((alg) => (
                                                    <option key={alg} value={alg}>{alg}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium" htmlFor="jwe-enc-select">enc</label>
                                            <select
                                                id="jwe-enc-select"
                                                className="w-full rounded-md border border-gray-300 dark:border-[#1e1e1e] bg-white dark:bg-[#081327] px-3 py-2"
                                                value={jweEnc}
                                                onChange={(e) => setJweEnc(e.target.value as (typeof JWE_ENCS)[number])}
                                            >
                                                {JWE_ENCS.map((enc) => (
                                                    <option key={enc} value={enc}>{enc}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </TextAreaWrapper>
                    </div>

                    <div>

                        <TextAreaWrapper
                            title="Payload"
                            deleteEnabled={false}
                            formContentText={payload}
                        >
                            <textarea
                                className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4 w-full font-mono resize-none"
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                spellCheck={false}
                                aria-label="Editable Payload JSON"
                                onBlur={() => {
                                try {
                                    const parsed = JSON.parse(payload);
                                    setPayload(JSON.stringify(parsed, null, 2));
                                } catch (e) {
                                    // Invalid JSON, don't format
                                }
                            }}
                            />
                        </TextAreaWrapper>
                    </div>

                    <Button onClick={doEncodeCall}
                            className="w-full rounded-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4">
                        {mode === "jwe" ? "Encode JWE" : "Encode JWT"}
                    </Button>
                </div>

                <div>
                    <TextAreaWrapper
                        title="Encoded Token"
                        deleteEnabled={false}
                        formContentText={encoded}
                    >
                        <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                            <textarea
                                className="w-full min-h-[420px] bg-transparent font-mono outline-none resize-none"
                                value={encoded}
                                readOnly
                                spellCheck={false}
                                aria-label="Encoded JWT output"
                            />
                        </div>
                    </TextAreaWrapper>

                </div>
            </div>
            </>
    );
};