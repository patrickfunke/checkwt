"use client";
import { Button } from "@/components/ui/button";

import PrettyPrint from "../components/prettyPrint";

import React, { useState, useRef, useEffect } from "react";

export default function Encode() {
    // Placeholder for encoded JWT value
    const [header, setHeader] = useState('{"alg": "HS256"}');
    const [payload, setPayload] = useState('{"sub": "1234567890",\n  "name": "John Doe"}');
    const [encoded, setEncoded] = useState('');

    const doEncodeCall = () => {
        let parsedHeader, parsedPayload;
        try {
            parsedHeader = JSON.parse(header);
        } catch (e) {
            setEncoded("Error: Header is not valid JSON");
            return;
        }
        try {
            parsedPayload = JSON.parse(payload);
        } catch (e) {
            setEncoded("Error: Payload is not valid JSON");
            return;
        }
        fetch("/encode", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ headers: parsedHeader, payload: parsedPayload }),
        })
            .then(res => {
                console.log("Encode response status:", res.body);
                if (!res.ok) {
                    return res.json().then(data => {
                        throw new Error(data.error || "Encoding failed");
                    });
                }
                return res.json();
            })
            .then(data => {
                setEncoded(data.token);
            })
            .catch(err => {
                console.error("Error encoding JWT:", err);
                setEncoded(`Error: ${err.message}`);
            });
    };
    

    // Dummy encode function (replace with real JWT encoding logic as needed)
    useEffect(() => {
        // This is just a placeholder for demonstration
        setEncoded(btoa(header + '.' + payload));
    }, [header, payload]);

    return (
        <div className="p-4 w-full h-full rounded-lg bg-gray-100">
            <div className="flex flex-row gap-8 items-start w-full">
                {/* Left: Header and Payload stacked */}
                <div className="flex flex-col gap-8 w-1/2 min-w-[320px]">
                    <div>
                        <div className="text-xl font-bold mb-2">Header</div>
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            spellCheck={false}
                            className="border rounded p-2 min-h-[100px] font-mono bg-white mb-2"
                            style={{ whiteSpace: "pre-wrap", outline: "none" }}
                            aria-label="Editable Header JSON"
                            onInput={e => setHeader((e.target as HTMLDivElement).innerText)}
                        >
                        </div>
                    </div>
                    <div>
                        <div className="text-xl font-bold mb-2">Payload</div>
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            spellCheck={false}
                            className="border rounded p-2 min-h-[100px] font-mono bg-white mb-2"
                            style={{ whiteSpace: "pre-wrap", outline: "none" }}
                            aria-label="Editable Payload JSON"
                            onInput={e => setPayload((e.target as HTMLDivElement).innerText)}
                        >
                        </div>
                    </div>
                </div>
                {/* Right: Encoded JWT */}
                <div className="flex flex-col w-1/2 min-w-[320px]">
                    <div className="text-xl font-bold mb-2">Encoded JWT</div>
                    <textarea
                        className="border rounded p-2 min-h-[220px] font-mono bg-white mb-4 w-full resize-none"
                        value={encoded}
                        readOnly
                        style={{ whiteSpace: "pre-wrap", outline: "none" }}
                        aria-label="Encoded JWT output"
                    />
                </div>
            </div>
            <Button onClick={doEncodeCall} className="self-start w-full rounded-full">Encode</Button>
        </div>
    );
}