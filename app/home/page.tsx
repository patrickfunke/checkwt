"use client";

import { useEffect, useState } from "react";
import PrettyPrint from "@/app/components/prettyPrint";
import JwtTextarea from "@/app/components/JWTTextarea.tsx";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";

export default function Home() {
    const [token, setToken] = useState("");
    const [header, setHeader] = useState("");
    const [payload, setPayload] = useState("");
    const [usedKey, setUsedKey] = useState("");
    const [signatureValid, setSignatureValid] = useState(null);
    const [signatureInvalidReason, setSignatureInvalidReason] = useState(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [value, setValue] = useState<string>("");


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
            const { header, payload, signatureValid, usedKey } = await res.json();
            const { verified, reason } = await signatureValid;
            setHeader(header ?? "");
            setPayload(payload ?? "");
            setSignatureValid(verified);
            setSignatureInvalidReason(reason);
            setUsedKey(usedKey ?? "");
        } catch (err) {
            setError("Failed to parse token.");
        }
    };

    useEffect(() => {
        handleDecode();
    }, [token])

    return (
        <div className="w-full h-screen p-4 md:p-10 space-y-6 dark:bg-[#111111] dark:text-white">
            <ThemeSwitcher/>
            <div className="flex items-center mx-auto w-fit gap-4">
                <img src="/favicon.ico" alt="favicon.ico"  className="w-10 rounded-xl"/>
                <h1 className="font-bold text-4xl text-center uppercase">checkwtf</h1>
            </div>
            <div className="text-sm text-center max-w-200 mx-auto">
                Decode, verify, and generate JSON Web Tokens, which are an open, industry standard <a href="https://datatracker.ietf.org/doc/html/rfc7519" target="_blank" className="underline">RFC-7519</a> method for representing claims securely between two parties.
            </div>
            <div className="flex gap-4">
                <div className="">
                    Paste a JWT below that you'd like to decode, validate, and verify.
                </div>
                <div className="text-red-500">{errorMessage ?? ''}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-xl font-bold flex justify-between items-center">
                        <div className="flex gap-2">
                            <div>JSON Web Token</div>
                            {signatureValid !== null && <div className={(signatureValid === true ? "text-green-500" : "text-red-500") + " flex flex-row items-center gap-2 text-sm"}>
                                {signatureValid === true ? <img className="w-2 h-2 inline" src="/correct.png" alt="Valid" /> : <img className="w-2 h-2 inline" src="/wrong.png" alt="Invalid" />}
                                {signatureValid === true ? "Signature is valid" : `Signature is invalid: ${signatureInvalidReason ?? ''}`}
                            </div>
                            }
                        </div>
                        <div className="flex gap-2">
                            <Button className="" title="Copy" onClick={() => copyTextToClipboard(token)}><img className="w-4 h-4 cursor-pointer " src="/copy.png" alt="Copy" /></Button>
                            <Button className="" title="Clear" onClick={() => {
                                clearState();
                                setValue("");
                            }}><img className="w-4 h-4 cursor-pointer " src="/clear.png" alt="Clear" /></Button>
                        </div>
                    </div>
                    <JwtTextarea onChange={(token) => setToken(token)} errorMessage={errorMessage} value={value} onValueChange={(val: string) => setValue(val)}/>
                </div>


                <div>
                    <div className="text-xl font-bold flex justify-between items-center">
                        <div>Decoded Header</div>
                        <Button className="" title="Copy" onClick={() => copyTextToClipboard(token)}><img className="w-4 h-4 cursor-pointer " src="/copy.png" alt="Copy" /></Button>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={header} />
                    </div>
                </div>

                <div className="col-start-2">
                    <div className="text-xl font-bold flex justify-between items-center">
                        <div>Decoded Payload</div>
                        <Button className="" title="Copy" onClick={() => copyTextToClipboard(token)}><img className="w-4 h-4 cursor-pointer " src="/copy.png" alt="Copy" /></Button>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={payload} />
                    </div>
                </div>

                <div className="col-start-2">
                    <div className="text-xl font-bold flex justify-between items-center">
                        <div>Used Keys</div>
                        <Button className="" title="Copy" onClick={() => copyTextToClipboard(token)}><img className="w-4 h-4 cursor-pointer " src="/copy.png" alt="Copy" /></Button>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={usedKey} />
                    </div>
                </div>
            </div>
        </div>
    );
}