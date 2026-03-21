"use client";

import { useEffect, useState } from "react";
import PrettyPrint from "@/app/components/prettyPrint";
import JwtTextarea from "@/app/components/JWTTextarea.tsx";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";
import Link from "next/link";

export default function Home() {
    const [token, setToken] = useState("");
    const [header, setHeader] = useState("");
    const [payload, setPayload] = useState("");
    const [usedKey, setUsedKey] = useState("");
    const [signatureValid, setSignatureValid] = useState(null);
    const [signatureInvalidReason, setSignatureInvalidReason] = useState(null);
    const [tokenType, setTokenType] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [value, setValue] = useState<string>("");

    const focusTokenInput = () => {
        const el = document.getElementById("jwt") as HTMLTextAreaElement | null;
        if (!el) {
            return;
        }

        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
        const end = el.value.length;
        el.setSelectionRange(end, end);
    };

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            const data = event.data as { type?: unknown; text?: unknown } | undefined;
            if (!data || typeof data.type !== "string") {
                return;
            }

            if (data.type === "copyToDecode" || data.type === "send" || data.type === "draft") {
                if (typeof data.text !== "string") {
                    return;
                }
                setValue(data.text);
                setToken(data.text);
                return;
            }

            if (data.type === "focusDecodeTokenInput") {
                focusTokenInput();
            }
        };

        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);


    async function copyTextToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const clearState = () => {
        setErrorMessage(null);
        setHeader("");
        setPayload("");
        setUsedKey("");
        setSignatureValid(null);
        setSignatureInvalidReason(null);
        setTokenType("");
    }

    const setError = (error: string) => {
        clearState();
        setErrorMessage(error);
    }

    const handleDecode = async () => {
        if (!token) {
            clearState();
            return;
        }

        try {
            const res = await fetch("/api/decode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });
            if (!res.ok) {
                const { error } = await res.json();
                setError(error);
                return;
            }
            setErrorMessage(null);
            const { header, payload, signatureValid, usedKey, type } = await res.json();
            const { verified, reason } = await signatureValid;
            setHeader(header ?? "");
            setPayload(payload ?? "");
            setSignatureValid(verified);
            setSignatureInvalidReason(reason);
            setUsedKey(usedKey ?? "");
            setTokenType(type ?? "");
        } catch (err) {
            setError("Failed to parse token.");
        }
    };

    useEffect(() => {
        handleDecode();
    }, [token])

    return (
        <>
        <div className="w-full h-screen p-4 md:p-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <ThemeSwitcher/>
                <Link
                    href="/encode"
                    className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                    Go to Encode
                </Link>
            </div>
            <div className="flex items-center mx-auto w-fit gap-4">
                <img src="/favicon.ico" alt="favicon.ico"  className="w-10 rounded-xl"/>
                <h1 className="font-bold text-4xl text-center uppercase">checkwtf</h1>
            </div>
            <div className="text-sm text-center max-w-200 mx-auto">
                Decode, verify, and generate JSON Web Tokens, which are an open, industry standard <a href="https://datatracker.ietf.org/doc/html/rfc7519" target="_blank" className="underline">RFC-7519</a> method for representing claims securely between two parties.
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                <div className="">
                    Paste a JWT below that you'd like to decode, validate, and verify.
                </div>
                <div className="text-red-500">{errorMessage ?? ''}</div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                    <div className="text-xl font-bold flex justify-between items-center">
                            <div className="flex gap-2">
                            <div>JSON Web Token</div>
                            {signatureValid !== null && <div className={(signatureValid === true ? "text-green-500" : "text-red-500") + " flex flex-row items-center gap-2 text-sm"}>
                                {signatureValid === true ? <img className="w-2 h-2 inline" src="/correct.png" alt="Valid" /> : <img className="w-2 h-2 inline" src="/wrong.png" alt="Invalid" />}
                                {signatureValid === true ? "Signature is valid" : `Signature is invalid: ${signatureInvalidReason ?? ''}`}
                            </div>
                            }
                            {tokenType && <div className="text-sm italic ml-2">Detected: {tokenType}</div>}
                        </div>
                        <div className="flex gap-2">
                            <Button className="cursor-pointer" title="Copy" onClick={() => copyTextToClipboard(token)}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15H12C13.6569 15 15 13.6569 15 12V8C15 6.34315 13.6569 5 12 5H8C6.34315 5 5 6.34315 5 8V12C5 13.6569 6.34315 15 8 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 0.25C9.33915 0.25 10.5138 0.952094 11.177 2.00819C11.4679 2.47151 11.0737 3 10.5266 3C10.2123 3 9.93488 2.81318 9.7352 2.57055C9.32304 2.06973 8.6994 1.75 8 1.75H4C2.75736 1.75 1.75 2.75736 1.75 4V8C1.75 8.69927 2.06986 9.32232 2.57062 9.73428C2.81326 9.93389 3 10.2113 3 10.5255C3 11.0726 2.47146 11.4669 2.00808 11.176C0.952101 10.513 0.25 9.33902 0.25 8V4C0.25 1.92893 1.92893 0.25 4 0.25H8Z" fill="currentColor"></path></svg>
                            </Button>
                            <Button className="cursor-pointer" title="Clear" onClick={() => {
                                clearState();
                                setValue("");
                            }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.1094 3.3359L1 8L4.1094 12.6641C4.6658 13.4987 5.60249 14 6.60555 14H15V2H6.60555C5.60249 2 4.6658 2.5013 4.1094 3.3359Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7 6L11 10M11 6L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                            </Button>
                        </div>
                    </div>
                    <JwtTextarea
                        onChange={(token) => setToken(token)}
                        errorMessage={errorMessage}
                        value={value}
                        onValueChange={(val: string) => setValue(val)}
                        showSegmentTooltips={signatureValid === true}
                    />
                </div>


                <div>
                    <div className="text-xl font-bold flex justify-between items-center">
                        <div>Decoded Header</div>
                        <Button className="cursor-pointer" title="Copy" onClick={() => copyTextToClipboard(token)}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15H12C13.6569 15 15 13.6569 15 12V8C15 6.34315 13.6569 5 12 5H8C6.34315 5 5 6.34315 5 8V12C5 13.6569 6.34315 15 8 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 0.25C9.33915 0.25 10.5138 0.952094 11.177 2.00819C11.4679 2.47151 11.0737 3 10.5266 3C10.2123 3 9.93488 2.81318 9.7352 2.57055C9.32304 2.06973 8.6994 1.75 8 1.75H4C2.75736 1.75 1.75 2.75736 1.75 4V8C1.75 8.69927 2.06986 9.32232 2.57062 9.73428C2.81326 9.93389 3 10.2113 3 10.5255C3 11.0726 2.47146 11.4669 2.00808 11.176C0.952101 10.513 0.25 9.33902 0.25 8V4C0.25 1.92893 1.92893 0.25 4 0.25H8Z" fill="currentColor"></path></svg>
                        </Button>                    </div>
                    <div className="bg-gray-50 dark:bg-[#0a1a3a] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={header} />
                    </div>
                </div>

                <div className="lg:col-start-2">
                    <div className="text-xl font-bold flex justify-between items-center">
                        <div>Decoded Payload</div>
                        <Button className="cursor-pointer" title="Copy" onClick={() => copyTextToClipboard(token)}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15H12C13.6569 15 15 13.6569 15 12V8C15 6.34315 13.6569 5 12 5H8C6.34315 5 5 6.34315 5 8V12C5 13.6569 6.34315 15 8 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 0.25C9.33915 0.25 10.5138 0.952094 11.177 2.00819C11.4679 2.47151 11.0737 3 10.5266 3C10.2123 3 9.93488 2.81318 9.7352 2.57055C9.32304 2.06973 8.6994 1.75 8 1.75H4C2.75736 1.75 1.75 2.75736 1.75 4V8C1.75 8.69927 2.06986 9.32232 2.57062 9.73428C2.81326 9.93389 3 10.2113 3 10.5255C3 11.0726 2.47146 11.4669 2.00808 11.176C0.952101 10.513 0.25 9.33902 0.25 8V4C0.25 1.92893 1.92893 0.25 4 0.25H8Z" fill="currentColor"></path></svg>
                        </Button>                    </div>
                    <div className="bg-gray-50 dark:bg-[#0a1a3a] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={payload} />
                    </div>
                </div>

                <div className="lg:col-start-2">
                    <div className="text-xl font-bold flex justify-between items-center">
                        <div>Used Keys</div>
                        <Button className="cursor-pointer" title="Copy" onClick={() => copyTextToClipboard(token)}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15H12C13.6569 15 15 13.6569 15 12V8C15 6.34315 13.6569 5 12 5H8C6.34315 5 5 6.34315 5 8V12C5 13.6569 6.34315 15 8 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 0.25C9.33915 0.25 10.5138 0.952094 11.177 2.00819C11.4679 2.47151 11.0737 3 10.5266 3C10.2123 3 9.93488 2.81318 9.7352 2.57055C9.32304 2.06973 8.6994 1.75 8 1.75H4C2.75736 1.75 1.75 2.75736 1.75 4V8C1.75 8.69927 2.06986 9.32232 2.57062 9.73428C2.81326 9.93389 3 10.2113 3 10.5255C3 11.0726 2.47146 11.4669 2.00808 11.176C0.952101 10.513 0.25 9.33902 0.25 8V4C0.25 1.92893 1.92893 0.25 4 0.25H8Z" fill="currentColor"></path></svg>
                        </Button>                    </div>
                    <div className="bg-gray-50 dark:bg-[#0a1a3a] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={usedKey} />
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
