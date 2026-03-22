import PrettyPrint from "./prettyPrint";
import JwtTextarea from "./JWTTextarea";
import {useEffect, useRef, useState} from "react";
import TextAreaWrapper from "@/app/components/TextAreaWrapper.tsx";
import { TokenLegend } from "@/app/components/TokenDisplay";

type StepStatus = "idle" | "success" | "failed" | "skipped" | "unknown";

interface StepItem {
    label: string;
    status: StepStatus;
    detail?: string;
}

function StepIcon({ status }: { status: StepStatus }) {
    if (status === "success") return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-500 flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
    );
    if (status === "failed") return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-500 flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </span>
    );
    if (status === "skipped") return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-500/10 text-gray-400 flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </span>
    );
    if (status === "unknown") return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/15 text-yellow-500 flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </span>
    );
    // idle
    return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0" />
    );
}

function StepsCard({ steps }: { steps: StepItem[] }) {
    return (
        <div className="rounded-lg border border-gray-300 dark:border-[#1e1e1e] bg-gray-50 dark:bg-[#1e1e1e] p-4 flex flex-col gap-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">Token validation steps</div>
            {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                    <StepIcon status={step.status} />
                    <div className="flex flex-col min-w-0">
                        <span className={`text-sm leading-5 ${step.status === "skipped" || step.status === "idle" ? "opacity-40" : ""}`}>
                            {step.label}
                        </span>
                        {step.detail && (
                            <span className={`text-xs leading-4 mt-0.5 ${step.status === "failed" ? "text-red-400" : step.status === "unknown" ? "text-yellow-400" : "opacity-50"}`}>
                                {step.detail}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatExpiry(exp: number): { label: string; detail: string; status: StepStatus } {
    const expMs = exp * 1000;
    const now = Date.now();
    const diffMs = expMs - now;
    const absMs = Math.abs(diffMs);

    const date = new Date(expMs).toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const mins = Math.floor(absMs / 60000);
    const hours = Math.floor(absMs / 3600000);
    const days = Math.floor(absMs / 86400000);

    let relative: string;
    if (absMs < 60000) relative = diffMs > 0 ? "expires in less than a minute" : "expired less than a minute ago";
    else if (hours < 1) relative = diffMs > 0 ? `expires in ${mins}m` : `expired ${mins}m ago`;
    else if (days < 1) relative = diffMs > 0 ? `expires in ${hours}h` : `expired ${hours}h ago`;
    else relative = diffMs > 0 ? `expires in ${days}d` : `expired ${days}d ago`;

    if (diffMs > 0) {
        return { label: "Token not expired", detail: `${date} · ${relative}`, status: "success" };
    } else {
        return { label: "Token expired", detail: `${date} · ${relative}`, status: "failed" };
    }
}

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

    // Compute steps
    const hasToken = token !== "";
    const hasDecoded = header !== "";

    // Parse exp from payload — API returns payload as an object, not a JSON string
    let parsedPayloadObj: Record<string, unknown> | null = null;
    if (payload) {
        const payloadAny = payload as unknown;
        if (typeof payloadAny === "object") {
            parsedPayloadObj = payloadAny as Record<string, unknown>;
        } else {
            try { parsedPayloadObj = JSON.parse(String(payload)); } catch { /* not JSON */ }
        }
    }
    const expClaim = typeof parsedPayloadObj?.exp === "number" ? parsedPayloadObj.exp : null;

    const steps: StepItem[] = [
        // Step 1: Token type detection
        {
            label: tokenType ? `${tokenType} detected` : "Token type",
            status: !hasToken ? "idle" : tokenType ? "success" : "failed",
            detail: !hasToken ? undefined : !tokenType && errorMessage ? errorMessage : undefined,
        },
        // Step 2: Base64 decode
        {
            label: "Base64url decode",
            status: !hasToken ? "idle" : hasDecoded ? "success" : tokenType ? "failed" : "failed",
            detail: !hasDecoded && hasToken ? (errorMessage ?? undefined) : undefined,
        },
        // Step 3: Decryption
        (tokenType === "JWT-in-JWE" || tokenType === "JWE") ? {
            label: "Decryption",
            status: !hasToken ? "idle" : hasDecoded ? "success" : "failed",
            detail: !hasDecoded && hasToken ? (errorMessage ?? undefined) : undefined,
        } : {
            label: "Decryption",
            status: !hasToken ? "idle" : "skipped",
            detail: tokenType === "JWT" ? "Not applicable for JWT" : undefined,
        },
        // Step 4: Signature
        tokenType === "JWE" ? {
            label: "Signature",
            status: !hasToken ? "idle" : "skipped",
            detail: "JWE does not have a signature",
        } : {
            label: signatureValid === true
                ? (tokenType === "JWT-in-JWE" ? "Inner JWT signature valid" : "Signature valid")
                : signatureValid === false
                ? (tokenType === "JWT-in-JWE" ? "Inner JWT signature invalid" : "Signature invalid")
                : "Signature",
            status: !hasToken ? "idle"
                : signatureValid === true ? "success"
                : signatureValid === false ? "failed"
                : hasDecoded ? "unknown"
                : "idle",
            detail: signatureValid === false && signatureInvalidReason ? signatureInvalidReason
                : signatureValid === null && hasDecoded ? "No matching public key found in store"
                : undefined,
        },
        // Step 5: Expiry
        expClaim !== null ? (() => {
            const r = formatExpiry(expClaim);
            return { label: r.label, status: r.status, detail: r.detail };
        })() : {
            label: "Expiry",
            status: !hasToken ? "idle" : hasDecoded ? "skipped" : "idle",
            detail: hasDecoded ? "No exp claim in payload" : undefined,
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* LEFT: steps + token input + legend */}
                <div className="flex flex-col gap-4">
                <StepsCard steps={steps} />
                <TextAreaWrapper
                    title="JSON Web Token"
                    messages={[]}
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
                {token && <TokenLegend partCount={token.split(".").length} />}
                </div>{/* end left column */}

                {/* RIGHT: decoded output */}
                <div className="flex flex-col gap-4">
                    {/* Outer JWE layer (JWT-in-JWE only) */}
                    {tokenType === 'JWT-in-JWE' && (
                        <>
                            <TextAreaWrapper
                                title="JWE Header"
                                deleteEnabled={false}
                                description="Plain text header — how the payload was encrypted and which key was used to encrypt the content encryption key (CEK)."
                                showDescription={outerHeader !== ""}
                                formContentText={outerHeader}
                            >
                                <div className="overflow-x-clip dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-24 p-4">
                                    <PrettyPrint data={outerHeader} />
                                </div>
                            </TextAreaWrapper>

                            <TextAreaWrapper
                                title="Key Encryption Key"
                                deleteEnabled={false}
                                description="Secret used to encrypt the content encryption key (CEK), referenced by the JWE header."
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
                        title={tokenType === 'JWT-in-JWE' ? "Inner JWT Header" : "JWT Header"}
                        deleteEnabled={false}
                        description={`How payload was signed and which key was used to sign it.`}
                        showDescription={header !== ""}
                        formContentText={header}
                    >
                        <div className="overflow-x-clip dark:bg-[#17181b] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-48 p-4">
                            <PrettyPrint data={header} />
                        </div>
                    </TextAreaWrapper>

                    <TextAreaWrapper
                        title={tokenType === 'JWT-in-JWE' ? "Inner JWT Payload" : "JWT Payload"}
                        deleteEnabled={false}
                        description={`Contains the actual data, like IDs or permissions.`}
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

                    <TextAreaWrapper
                        title={"JWS Signing Key"}
                        deleteEnabled={false}
                        description={`Secret or private key used to sign the payload, to ensure it hasn't been tampered with.`}
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
