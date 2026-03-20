"use client";

import { use, useEffect, useState } from "react";
import PrettyPrint from "@/app/components/prettyPrint";
import JwtTextarea from "@/app/components/JWTTextarea.tsx";
import { Button } from "@/components/ui/button";

export default function Home() {
    const [token, setToken] = useState("");
    const [header, setHeader] = useState("");
    const [payload, setPayload] = useState("");
    const [signatureValid, setSignatureValid] = useState(null);
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


    const handleDecode = async () => {
        setErrorMessage(null);
        if (!token) {
            setHeader("");
            setPayload("");
            setSignatureValid(null);
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
                setErrorMessage(error);
                setHeader("");
                setPayload("");
                setSignatureValid(null);
                return;
            }
            setErrorMessage(null);
            const { header, payload, signatureValid } = await res.json();
            setHeader(header);
            setPayload(payload);
            setSignatureValid(signatureValid);
        } catch (err) {
            console.error("Error decoding token:", err);
        }
    };

    useEffect(() => {
        handleDecode();
    }, [token])

    return (
        <div className="w-full h-screen p-4 md:p-10 space-y-6 dark:bg-[#111111] dark:text-white">
            <button className="absolute top-10 right-10 cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2252 10.0845C14.54 9.95039 14.8559 10.244 14.7134 10.555C14.3379 11.3742 13.8066 12.1157 13.1463 12.7369C12.2739 13.5575 11.2056 14.1406 10.0435 14.4303C8.88133 14.7201 7.6643 14.7068 6.50878 14.3918C5.35325 14.0767 4.29789 13.4705 3.44363 12.631C2.58937 11.7915 1.9648 10.7469 1.62965 9.59707C1.2945 8.44722 1.25998 7.23061 1.52941 6.06361C1.79883 4.89661 2.36318 3.81825 3.16847 2.9317C3.76901 2.27056 4.48855 1.73258 5.28668 1.34413C5.59577 1.1937 5.88975 1.51373 5.74469 1.82539V1.82539C3.32126 7.032 8.59731 12.4835 13.8804 10.2315L14.2252 10.0845Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path></svg>
            </button>
            <h1 className="font-bold text-4xl text-center uppercase">checkwtf</h1>
            <div className="text-sm text-center max-w-200 mx-auto">
                Decode, verify, and generate JSON Web Tokens, which are an open, industry standard <a href="https://datatracker.ietf.org/doc/html/rfc7519" target="_blank" className="underline">RFC-7519</a> method for representing claims securely between two parties.
            </div>
            <div className="flex gap-4">
                <div className="">
                    Paste a JWT below that you'd like to decode, validate, and verify.
                </div>
                <div className="text-red-500">{errorMessage ?? ''}</div>
            </div>
            <div className="flex md:flex-row flex-col gap-4">
                <div className="flex flex-col gap-4 w-full">
                    <div className="w-full">
                    <div className="text-xl font-bold w-full flex justify-between items-center">
                        JSON Web Token
                        <div className="flex gap-2">
                            <Button className="" onClick={() => copyTextToClipboard(token)}><img className="w-4 h-4 cursor-pointer " src="/copy.png" alt="Copy to Clipboard" /></Button>
                            <Button className="" onClick={() => {
                                setToken("");
                                setValue("");
                            }}><img className="w-4 h-4 cursor-pointer " src="/clear.png" alt="Clear" /></Button>
                        </div>
                    </div>
                    <JwtTextarea onChange={(token) => setToken(token)} errorMessage={errorMessage} value={value} onValueChange={(val: string) => setValue(val)}/>
                </div>
                </div>


                <div className="flex flex-col gap-4 w-full h-full">
                    <div>
                        <div className="text-xl font-bold">Decoded Header</div>
                        <div className="bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-300 dark:border-[#1e1e1e] h-48 p-4">
                            <PrettyPrint data={header} />
                        </div>
                    </div>

                    <div>
                        <div className="text-xl font-bold">Decoded Payload</div>
                        <div className="bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-300 dark:border-[#1e1e1e] h-48 p-4">
                            <PrettyPrint data={payload} />
                        </div>
                    </div>

                    <div>
                        <div className="text-xl font-bold">Used keys</div>
                        <div className="bg-gray-50 rounded-lg border border-gray-300 h-48 p-4">

                            <PrettyPrint data={{"keys": [{"kid":"dsaj", "alg":"HS256"}]}} />

                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}