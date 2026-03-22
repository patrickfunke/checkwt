"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import TextAreaWrapper from "@/app/components/TextAreaWrapper.tsx";
import TokenDisplay from "@/app/components/TokenDisplay";

const JWT_ALGS = ["EdDSA", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"] as const;
const JWE_ALGS = ["RSA-OAEP", "RSA-OAEP-256", "RSA-OAEP-384", "RSA-OAEP-512", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW", "A128KW", "A256KW"] as const;
const JWE_ENCS = ["A128GCM", "A192GCM", "A256GCM", "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512"] as const;

function base64urlDecode(str: string): string {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
    return atob(padded);
}

function parsePayload(text: string): object | null {
    const trimmed = text.trim();
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
    const parts = trimmed.split(".");
    if (parts.length === 3 || parts.length === 5) {
        try { return JSON.parse(base64urlDecode(parts[1])); } catch { /* fall through */ }
    }
    try { return JSON.parse(base64urlDecode(trimmed)); } catch { return null; }
}

export default function JWEEncoderForm() {
    const [jwtAlg, setJwtAlg] = useState<(typeof JWT_ALGS)[number]>("EdDSA");
    const [outerJweAlg, setOuterJweAlg] = useState<(typeof JWE_ALGS)[number]>("RSA-OAEP-256");
    const [outerJweEnc, setOuterJweEnc] = useState<(typeof JWE_ENCS)[number]>("A256GCM");
    const [payload, setPayload] = useState(() => {
        const exp = Math.floor(Date.now() / 1000) + 20 * 60;
        return `{\n  "sub": "79bc12c1-8529-47ae-ac91-5cd67197ae86",\n  "aud": "api.example.com",\n  "exp": ${exp}\n}`;
    });
    const [innerJwt, setInnerJwt] = useState("");
    const [encoded, setEncoded] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [payloadError, setPayloadError] = useState(false);

    const doEncodeCall = async () => {
        const parsedPayload = parsePayload(payload);
        if (!parsedPayload) {
            setErrorMessage("Payload must be valid JSON or a base64-encoded JSON string");
            setEncoded("");
            setInnerJwt("");
            return;
        }
        try {
            const res = await fetch("/api/encode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "jwt-in-jwe",
                    innerHeader: { alg: jwtAlg, typ: "JWT" },
                    outerHeader: { alg: outerJweAlg, enc: outerJweEnc, typ: "JWT" },
                    payload: parsedPayload,
                }),
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
            console.error("Error encoding JWE:", err);
            setErrorMessage("Encoding failed");
            setEncoded("");
            setInnerJwt("");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* LEFT: controls */}
            <div className="flex flex-col gap-4">

                <TextAreaWrapper title="Step 1 — Sign: Inner JWT" deleteEnabled={false} copyEnabled={false} formContentText={""}>
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] p-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium" htmlFor="jwe-jwt-alg-select">Signing Algorithm (alg)</label>
                            <select
                                id="jwe-jwt-alg-select"
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

                <TextAreaWrapper title="Step 2 — Encrypt: Outer JWE" deleteEnabled={false} copyEnabled={false} formContentText={""}>
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] p-4 space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium" htmlFor="jwe-alg-select">Key Wrap Algorithm (alg Header)</label>
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
                            <label className="text-sm font-medium" htmlFor="jwe-enc-select">Content Encryption Algorithm (enc Header)</label>
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

                <TextAreaWrapper title="Inner JWT Payload" deleteEnabled={false} formContentText={payload}>
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

                <Button
                    onClick={doEncodeCall}
                    className="w-full rounded-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4"
                >
                    Encode JWT → JWE
                </Button>

                {errorMessage && (
                    <div className="text-red-500 text-sm">{errorMessage}</div>
                )}
            </div>

            {/* RIGHT: output */}
            <div className="flex flex-col gap-4">
                <div className="opacity-60 text-sm lg:block hidden">&nbsp;</div>
                <TokenDisplay token={innerJwt} title="Inner JWT (signed)" />
                <TokenDisplay token={encoded} title="Outer JWE (encrypted)" />
            </div>
        </div>
    );
}
