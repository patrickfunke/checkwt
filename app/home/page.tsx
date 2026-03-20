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
        <div className="w-full h-full p-4 md:p-20 space-y-6">
            <h1 className="font-bold text-4xl text-center uppercase">checkwtf</h1>
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
                        <div className="bg-gray-50 rounded-lg border border-gray-300 h-48 p-4">
                            <PrettyPrint data={header} />
                        </div>
                    </div>

                    <div>
                        <div className="text-xl font-bold">Decoded Payload</div>
                        <div className="bg-gray-50 rounded-lg border border-gray-300 h-48 p-4">
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