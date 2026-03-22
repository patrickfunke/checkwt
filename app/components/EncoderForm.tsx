import { Button } from "@/components/ui/button";
import { useState } from "react";
import TextAreaWrapper from "@/app/components/TextAreaWrapper.tsx";

const JWT_ALGS = ["EdDSA", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"] as const;
const JWE_ALGS = ["RSA-OAEP", "RSA-OAEP-256", "RSA-OAEP-384", "RSA-OAEP-512", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW", "A128KW", "A256KW"] as const;
const JWE_ENCS = ["A128GCM", "A192GCM", "A256GCM", "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512"] as const;

export default function EncoderForm() {
    const [mode, setMode] = useState<"jwt" | "jwt-in-jwe">("jwt");
    const [jwtAlg, setJwtAlg] = useState<(typeof JWT_ALGS)[number]>("EdDSA");
    const [outerJweAlg, setOuterJweAlg] = useState<(typeof JWE_ALGS)[number]>("RSA-OAEP-256");
    const [outerJweEnc, setOuterJweEnc] = useState<(typeof JWE_ENCS)[number]>("A256GCM");
    const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe"\n}');
    const [encoded, setEncoded] = useState('');
    const [innerJwt, setInnerJwt] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [payloadError, setPayloadError] = useState(false);

    function base64urlDecode(str: string): string {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
        return atob(padded);
    }

    function parsePayload(text: string): object | null {
        const trimmed = text.trim();
        try {
            return JSON.parse(trimmed);
        } catch {
            // fall through
        }
        const parts = trimmed.split('.');
        if (parts.length === 3 || parts.length === 5) {
            try {
                return JSON.parse(base64urlDecode(parts[1]));
            } catch {
                // fall through
            }
        }
        try {
            return JSON.parse(base64urlDecode(trimmed));
        } catch {
            return null;
        }
    }

    const doEncodeCall = async () => {
        const parsedPayload = parsePayload(payload);
        if (!parsedPayload) {
            setErrorMessage("Payload must be valid JSON or a base64-encoded JSON string");
            setEncoded("");
            setInnerJwt("");
            return;
        }

        try {
            let body: object;
            if (mode === "jwt-in-jwe") {
                body = {
                    mode: "jwt-in-jwe",
                    innerHeader: { alg: jwtAlg, typ: "JWT" },
                    outerHeader: { alg: outerJweAlg, enc: outerJweEnc, typ: "JWT" },
                    payload: parsedPayload,
                };
            } else {
                body = {
                    mode: "jwt",
                    header: { alg: jwtAlg, typ: "JWT" },
                    payload: parsedPayload,
                };
            }

            const res = await fetch("/api/encode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                setErrorMessage(data.error || "Encoding failed");
                setEncoded("");
                setInnerJwt("");
                return;
            }

            const data = await res.json();
            setErrorMessage(null);
            setEncoded(data.token ?? "");
            setInnerJwt(data.innerJwt ?? "");
        } catch (err) {
            console.error("Error encoding JWT:", err);
            setErrorMessage("Encoding failed");
            setEncoded("");
            setInnerJwt("");
        }
    };

    return (
        <>
            <div className="flex gap-4 opacity-60 text-sm mb-2">
                <div>Select mode and jose-supported algorithms, then generate your token from payload JSON.</div>
                <div className="text-red-500">{errorMessage ?? ""}</div>
            </div>

            <div className="flex flex-col gap-4">
                <TextAreaWrapper title="Mode" deleteEnabled={false} copyEnabled={false} formContentText={""}>
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] p-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium" htmlFor="mode-select">Mode</label>
                            <select
                                id="mode-select"
                                className="w-full rounded-md border border-gray-300 dark:border-[#1e1e1e] bg-white dark:bg-[#272829] px-3 py-2"
                                value={mode}
                                onChange={(e) => setMode(e.target.value as "jwt" | "jwt-in-jwe")}
                            >
                                <option value="jwt">JWT (signed only)</option>
                                <option value="jwt-in-jwe">JWT-in-JWE (sign then encrypt)</option>
                            </select>
                        </div>
                    </div>
                </TextAreaWrapper>

                <TextAreaWrapper
                    title={mode === "jwt-in-jwe" ? "Step 1 — Sign: Inner JWT" : "Signing Algorithm"}
                    deleteEnabled={false}
                    copyEnabled={false}
                    formContentText={""}
                >
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] p-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium" htmlFor="jwt-alg-select">Signing Algorithm (alg)</label>
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
                    </div>
                </TextAreaWrapper>

                {mode === "jwt-in-jwe" && (
                    <TextAreaWrapper title="Step 2 — Encrypt: Outer JWE" deleteEnabled={false} copyEnabled={false} formContentText={""}>
                        <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] p-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium" htmlFor="jwe-alg-select">Key Wrap Algorithm (alg)</label>
                                <select
                                    id="jwe-alg-select"
                                    className="w-full rounded-md border border-gray-300 dark:border-[#1e1e1e] bg-white dark:bg-[#272829] px-3 py-2"
                                    value={outerJweAlg}
                                    onChange={(e) => setOuterJweAlg(e.target.value as (typeof JWE_ALGS)[number])}
                                >
                                    {JWE_ALGS.map((alg) => (
                                        <option key={alg} value={alg}>{alg}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium" htmlFor="jwe-enc-select">Content Encryption (enc)</label>
                                <select
                                    id="jwe-enc-select"
                                    className="w-full rounded-md border border-gray-300 dark:border-[#1e1e1e] bg-white dark:bg-[#272829] px-3 py-2"
                                    value={outerJweEnc}
                                    onChange={(e) => setOuterJweEnc(e.target.value as (typeof JWE_ENCS)[number])}
                                >
                                    {JWE_ENCS.map((enc) => (
                                        <option key={enc} value={enc}>{enc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </TextAreaWrapper>
                )}

                <TextAreaWrapper title="Payload" deleteEnabled={false} formContentText={payload}>
                    <textarea
                        className={`bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border min-h-48 p-4 w-full font-mono resize-none ${payloadError ? "border-red-500" : "border-gray-300 dark:border-[#1e1e1e]"}`}
                        value={payload}
                        onChange={(e) => {
                            setPayload(e.target.value);
                            setPayloadError(parsePayload(e.target.value) === null && e.target.value.trim() !== "");
                        }}
                        spellCheck={false}
                        aria-label="Editable Payload JSON"
                    />
                </TextAreaWrapper>

                <Button onClick={doEncodeCall}
                        className="w-full rounded-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4">
                    {mode === "jwt-in-jwe" ? "Encode JWT → JWE" : "Encode JWT"}
                </Button>

                {mode === "jwt-in-jwe" && (
                    <TextAreaWrapper title="Intermediate JWT (signed)" deleteEnabled={false} formContentText={innerJwt}>
                        <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-24 p-4">
                            <textarea
                                className="w-full min-h-[96px] bg-transparent font-mono outline-none resize-none"
                                value={innerJwt}
                                readOnly
                                spellCheck={false}
                                aria-label="Intermediate signed JWT"
                            />
                        </div>
                    </TextAreaWrapper>
                )}

                <TextAreaWrapper
                    title={mode === "jwt-in-jwe" ? "Final JWE (encrypted)" : "Encoded JWT"}
                    deleteEnabled={false}
                    formContentText={encoded}
                >
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <textarea
                            className="w-full min-h-[200px] bg-transparent font-mono outline-none resize-none"
                            value={encoded}
                            readOnly
                            spellCheck={false}
                            aria-label="Encoded token output"
                        />
                    </div>
                </TextAreaWrapper>
            </div>
        </>
    );
};
