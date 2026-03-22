"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import TextAreaWrapper from "@/app/components/TextAreaWrapper.tsx";
import TokenDisplay from "@/app/components/TokenDisplay";

const JWT_ALGS = ["EdDSA", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"] as const;

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

export default function JWTEncoderForm() {
    const [jwtAlg, setJwtAlg] = useState<(typeof JWT_ALGS)[number]>("EdDSA");
    const [payload, setPayload] = useState(() => {
        const exp = Math.floor(Date.now() / 1000) + 20 * 60;
        return `{\n  "sub": "79bc12c1-8529-47ae-ac91-5cd67197ae86",\n  "aud": "api.example.com",\n  "exp": ${exp}\n}`;
    });
    const [encoded, setEncoded] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [payloadError, setPayloadError] = useState(false);

    const doEncodeCall = async () => {
        const parsedPayload = parsePayload(payload);
        if (!parsedPayload) {
            setErrorMessage("Payload must be valid JSON or a base64-encoded JSON string");
            setEncoded("");
            return;
        }
        try {
            const res = await fetch("/api/encode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "jwt",
                    header: { alg: jwtAlg, typ: "JWT" },
                    payload: parsedPayload,
                }),
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* LEFT: controls */}
            <div className="flex flex-col gap-4">

                <TextAreaWrapper title="Signing Algorithm" deleteEnabled={false} copyEnabled={false} formContentText={""}>
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] p-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium" htmlFor="jwt-alg-select">Algorithm (alg)</label>
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

                <Button
                    onClick={doEncodeCall}
                    className="w-full rounded-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4"
                >
                    Encode JWT
                </Button>

                {errorMessage && (
                    <div className="text-red-500 text-sm">{errorMessage}</div>
                )}
            </div>

            {/* RIGHT: output */}
            <div className="flex flex-col gap-4">
                <div className="opacity-60 text-sm lg:block hidden">&nbsp;</div>
                <TokenDisplay token={encoded} title="Encoded JWT" />
            </div>
        </div>
    );
}
