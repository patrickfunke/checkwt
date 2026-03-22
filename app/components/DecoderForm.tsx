import PrettyPrint from "./prettyPrint";
import JwtTextarea from "./JWTTextarea";
import {useEffect, useRef, useState} from "react";
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
    // JWT-in-JWE outer layer
    const [outerHeader, setOuterHeader] = useState("");
    const [outerUsedKey, setOuterUsedKey] = useState("");

    const jwtRef = useRef<HTMLTextAreaElement>(null);

    const clearState = () => {
        setErrorMessage(null);
        setHeader("");
        setPayload("");
        setUsedKey("");
        setSignatureValid(null);
        setSignatureInvalidReason(null);
        setTokenType("");
        setOuterHeader("");
        setOuterUsedKey("");
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
            const data = await res.json();

            if (data.type === 'JWT-in-JWE') {
                setTokenType('JWT-in-JWE');
                setOuterHeader(data.outer?.header ?? "");
                setOuterUsedKey(data.outer?.usedKey ?? "");
                setHeader(data.inner?.header ?? "");
                setPayload(data.inner?.payload ?? "");
                const sv = data.inner?.signatureValid;
                setSignatureValid(sv?.verified ?? null);
                setSignatureInvalidReason(sv?.reason ?? null);
                setUsedKey(data.inner?.usedKey ?? "");
            } else {
                const { header, payload, signatureValid, usedKey, type } = data;
                const { verified, reason } = signatureValid ?? {};
                setHeader(header ?? "");
                setPayload(payload ?? "");
                setSignatureValid(verified ?? null);
                setSignatureInvalidReason(reason ?? null);
                setUsedKey(usedKey ?? "");
                setTokenType(type ?? "");
                setOuterHeader("");
                setOuterUsedKey("");
            }
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
            <div className="flex flex-col gap-4">
                <TextAreaWrapper
                    title="JSON Web Token"
                    messages={[
                        ...(errorMessage ? [{ type: "error" as const, message: errorMessage }] : []),
                        ...(tokenType === 'JWT-in-JWE' && signatureValid === true ? [{
                            type: "success" as const,
                            message: `Inner JWT signature is valid`,
                            icon: `/correct.png`
                        }] : []),
                        ...(tokenType === 'JWT-in-JWE' && signatureValid === false ? [{
                            type: "error" as const,
                            message: `Inner JWT signature is invalid`,
                            icon: `/wrong.png`
                        }] : []),
                        ...(tokenType !== 'JWE' && tokenType !== 'JWT-in-JWE' && signatureValid === true ? [{
                            type: "success" as const,
                            message: `Signature is valid`,
                            icon: `/correct.png`
                        }] : []),
                        ...(tokenType !== 'JWE' && tokenType !== 'JWT-in-JWE' && signatureValid === false ? [{
                            type: "error" as const,
                            message: `Signature is invalid`,
                            icon: `/wrong.png`
                        }] : []),
                        ...(tokenType ? [{ type: "info" as const, message: `Detected: ${tokenType}` }] : []),
                    ]}
                    showDescription={false}
                    onClear={() => {
                        clearState();
                        setToken("");
                        setValue("");
                        if (jwtRef.current) {
                            jwtRef.current.focus();
                        }
                    }}
                    formContentText={token}
                >
                    <JwtTextarea
                        ref={jwtRef}
                        onChange={(token) => setToken(token)}
                        errorMessage={errorMessage}
                        value={value}
                        onValueChange={(val: string) => setValue(val)}
                        showSegmentTooltips={signatureValid === undefined || signatureValid === true}
                    />
                </TextAreaWrapper>

                {/* Outer JWE layer (JWT-in-JWE only) */}
                {tokenType === 'JWT-in-JWE' && (
                    <>
                        <TextAreaWrapper
                            title="Outer JWE Header"
                            deleteEnabled={false}
                            description="The encryption header — how the inner JWT was encrypted."
                            showDescription={outerHeader !== ""}
                            formContentText={outerHeader}
                        >
                            <div className="overflow-x-clip dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-24 p-4">
                                <PrettyPrint data={outerHeader} />
                            </div>
                        </TextAreaWrapper>

                        <TextAreaWrapper
                            title="Decryption Key"
                            deleteEnabled={false}
                            description="The private key used to decrypt the JWE."
                            showDescription={outerUsedKey !== ""}
                            formContentText={outerUsedKey}
                        >
                            <div className="overflow-x-clip dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-24 p-4">
                                <PrettyPrint data={outerUsedKey} />
                            </div>
                        </TextAreaWrapper>
                    </>
                )}

                <TextAreaWrapper
                    title={tokenType === 'JWT-in-JWE' ? "Inner JWT Header" : "Decoded Header"}
                    deleteEnabled={false}
                    description={`Tells you what type of token and how it's signed (like the method used to protect it).`}
                    showDescription={header !== ""}
                    formContentText={header}
                >
                    <div className="overflow-x-clip dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={header} />
                    </div>
                </TextAreaWrapper>

                <TextAreaWrapper
                    title={tokenType === 'JWT-in-JWE' ? "Inner JWT Payload" : "Decoded Payload"}
                    deleteEnabled={false}
                    description={`Contains the actual data (for example, user ID or permissions).`}
                    showDescription={payload !== ""}
                    formContentText={payload}
                >
                    <div className="overflow-x-clip dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                        <PrettyPrint data={(() => {
                            try {
                                return JSON.parse(payload);
                            } catch {
                                return payload;
                            }
                        })()} />
                    </div>
                </TextAreaWrapper>

                <div className="mb-20">
                    <TextAreaWrapper
                        title={tokenType === 'JWT-in-JWE' ? "Signing Key" : "Used Keys"}
                        deleteEnabled={false}
                        description={`A secret or private key is used to create a signature so you can verify the token hasn't been tampered with.`}
                        showDescription={usedKey !== ""}
                        formContentText={usedKey}
                    >
                        <div className="overflow-x-clip dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                            <PrettyPrint data={usedKey} />
                        </div>
                    </TextAreaWrapper>
                </div>
            </div>
        </>
    );
}
