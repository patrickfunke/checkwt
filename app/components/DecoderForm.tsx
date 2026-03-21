import { Button } from "@/components/ui/button";
import PrettyPrint from "./prettyPrint";
import JwtTextarea from "./JWTTextarea";
import { useEffect, useState } from "react";
import TextAreaWrapper from "@/app/components/TextAreaWrapper.tsx";

export default function DecoderForm() {
    const [token, setToken] = useState("");
    const [header, setHeader] = useState("");
    const [payload, setPayload] = useState("");
    const [usedKey, setUsedKey] = useState("");
    const [signatureValid, setSignatureValid] = useState(null);
    const [signatureInvalidReason, setSignatureInvalidReason] = useState(null);
    const [tokenType, setTokenType] = useState<string>("");
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
    }, [token]);
    return (
        <>
            <div className="opacity-60 text-sm mb-2">
                Paste a JWT below that you'd like to decode, validate, and verify.
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <TextAreaWrapper
                        title="JSON Web Token"
                        messages={[
                            ...(errorMessage ? [{type: "error" as const, message: errorMessage}] : []),
                            ...(tokenType !== 'JWE' && signatureValid === true ? [{
                                type: "success" as const,
                                message: `Signature is valid`,
                                icon: `/correct.png`
                            }] : []),
                            ...(tokenType !== 'JWE' && signatureValid === false ? [{
                                type: "error" as const,
                                message: `Signature is invalid`,
                                icon: `/wrong.png`
                            }] : []),
                            ...(tokenType ? [{type: "info" as const, message: `Detected: ${tokenType}`}] : []),
                        ]}
                    >
                        <JwtTextarea
                            onChange={(token) => setToken(token)}
                            errorMessage={errorMessage}
                            value={value}
                            onValueChange={(val: string) => setValue(val)}
                            showSegmentTooltips={signatureValid === true}
                        />
                    </TextAreaWrapper>
                </div>


                <div>
                    <TextAreaWrapper
                        title="Decoded Header"
                        deleteEnabled={false}
                        description={`Tells you <span class="italic">what type of token</span> and <span class="italic">how it's signed</span> (like the method used to protect it).`}
                    >
                        <div
                            className="overflow-x-clip bg-gray-50 dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                            <PrettyPrint data={header}/>
                        </div>
                    </TextAreaWrapper>
                </div>

                <div className="col-start-2">

                    <TextAreaWrapper
                        title="Decoded Payload"
                        deleteEnabled={false}
                        description={`Contains the <span className="italic">actual data</span> (for example, user ID or permissions).`}
                    >
                        <div
                            className="overflow-x-clip bg-gray-50 dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                            <PrettyPrint data={payload}/>
                        </div>
                    </TextAreaWrapper>
                </div>

                <div className="col-start-2 mb-20">
                    <TextAreaWrapper
                        title="Used Keys"
                        deleteEnabled={false}
                        description={`A secret or private key is used to create a signature so you can <span className="italic">verify the token hasn't been tampered with</span>.`}
                    >
                        <div
                            className="overflow-x-clip bg-gray-50 dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                            <PrettyPrint data={usedKey}/>
                        </div>
                    </TextAreaWrapper>
                </div>
            </div>
        </>
    );
}