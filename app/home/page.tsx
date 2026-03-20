"use client";

import { useState } from "react";
import PrettyPrint from "@/app/components/prettyPrint";

export default function Home() {
    const [token, setToken] = useState("");
    const [header, setHeader] = useState("");
    const [payload, setPayload] = useState("");
    const [signatureValid, setSignatureValid] = useState(null);

    const handleDecode = async () => {
        if (!token) return;

        try {
            const res = await fetch("/api/decode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            const { header, payload, signatureValid } = await res.json();
            setHeader(header);
            setPayload(payload);
            setSignatureValid(signatureValid);
        } catch (err) {
            console.error("Error decoding token:", err);
        }
    };

    return (
        <div className="w-full h-full p-4 md:p-20 space-y-6">
            <h1 className="font-bold text-4xl text-center">checkwt</h1>

            <div className="w-full">
                Paste a JWT below that you'd like to decode, validate, and verify.
            </div>

            <div className="flex md:flex-row flex-col gap-4">
                <div className="w-full h-full">
                    <div className="text-xl font-bold">JSON Web Token</div>

                    <textarea
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="font-mono border border-gray-300 outline-blue-100 w-full resize-none rounded-lg h-139 p-4"
                    />

                    <button
                        onClick={handleDecode}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                        Decode
                    </button>
                </div>

                <div className="flex flex-col gap-4 w-full h-full">
                    <div>
                        <div className="text-xl font-bold">Decoded Header</div>
                        <div className="bg-gray-50 rounded-lg border border-gray-300 h-64 p-4">
                            <PrettyPrint data={header} />
                        </div>
                    </div>

                    <div>
                        <div className="text-xl font-bold">Decoded Payload</div>
                        <div className="bg-gray-50 rounded-lg border border-gray-300 h-64 p-4">
                            <PrettyPrint data={payload} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}