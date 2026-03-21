"use client";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";
import Link from "next/link";
import { useState } from "react";

const JWT_ALGS = ["EdDSA", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"] as const;
const JWE_ALGS = ["RSA-OAEP", "RSA-OAEP-256", "RSA-OAEP-384", "RSA-OAEP-512", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"] as const;
const JWE_ENCS = ["A128GCM", "A192GCM", "A256GCM", "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512"] as const;

export default function Encode() {
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
        <div className="w-full h-screen p-4 md:p-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <ThemeSwitcher />
                <Link
                    href="/home"
                    className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                    Go to Decode
                </Link>
            </div>

            <div className="flex items-center mx-auto w-fit gap-4">
                <img src="/favicon.ico" alt="favicon.ico" className="w-10 rounded-xl" />
                <h1 className="font-bold text-4xl text-center uppercase">checkwtf</h1>
            </div>

            <div className="text-sm text-center max-w-200 mx-auto">
                Create signed JWTs or encrypted JWEs with jose-compatible algorithms.
            </div>

            <div className="flex gap-4">
                <div>Select mode and jose-supported algorithms, then generate your token from payload JSON.</div>
                <div className="text-red-500">{errorMessage ?? ""}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <div className="text-xl font-bold mb-2">Header Options</div>
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
                    </div>

                    <div>
                        <div className="text-xl font-bold mb-2">Payload</div>
                        <textarea
                            className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4 w-full font-mono resize-none"
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                            spellCheck={false}
                            aria-label="Editable Payload JSON"
                        />
                    </div>

                    <Button onClick={doEncodeCall} className="w-full rounded-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4">
                        {mode === "jwe" ? "Encode JWE" : "Encode JWT"}
                    </Button>
                </div>

                <div>
                    <div className="text-xl font-bold mb-2 flex items-center justify-between">
                        <div>Encoded Token</div>
                        <Button className="cursor-pointer"  title="Copy" onClick={() => copyTextToClipboard(encoded)}>
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15H12C13.6569 15 15 13.6569 15 12V8C15 6.34315 13.6569 5 12 5H8C6.34315 5 5 6.34315 5 8V12C5 13.6569 6.34315 15 8 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 0.25C9.33915 0.25 10.5138 0.952094 11.177 2.00819C11.4679 2.47151 11.0737 3 10.5266 3C10.2123 3 9.93488 2.81318 9.7352 2.57055C9.32304 2.06973 8.6994 1.75 8 1.75H4C2.75736 1.75 1.75 2.75736 1.75 4V8C1.75 8.69927 2.06986 9.32232 2.57062 9.73428C2.81326 9.93389 3 10.2113 3 10.5255C3 11.0726 2.47146 11.4669 2.00808 11.176C0.952101 10.513 0.25 9.33902 0.25 8V4C0.25 1.92893 1.92893 0.25 4 0.25H8Z" fill="currentColor"></path></svg>

                        </Button>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <textarea
                            className="w-full min-h-[420px] bg-transparent font-mono outline-none resize-none"
                            value={encoded}
                            readOnly
                            spellCheck={false}
                            aria-label="Encoded JWT output"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}