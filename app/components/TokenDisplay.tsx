"use client";

import React, { useState } from "react";
import TextAreaWrapper from "@/app/components/TextAreaWrapper.tsx";

interface TokenDisplayProps {
    token: string;
    title: string;
    showLegend?: boolean;
}

const COLOR_CLASSES = [
    "text-red-600 dark:text-red-400",
    "text-yellow-600 dark:text-yellow-400",
    "text-green-600 dark:text-green-400",
    "text-blue-600 dark:text-blue-400",
    "text-black dark:text-white",
];

const LEGEND_JWT = [
    { label: "Header", bg: "bg-red-500" },
    { label: "Payload", bg: "bg-yellow-500" },
    { label: "Signature", bg: "bg-green-500" },
];

const LEGEND_JWE = [
    { label: "Protected Header", bg: "bg-red-500" },
    { label: "Encrypted Key", bg: "bg-yellow-500" },
    { label: "Initialization Vector", bg: "bg-green-500" },
    { label: "Ciphertext", bg: "bg-blue-500" },
    { label: "Authentication Tag", bg: "bg-white border border-gray-400 dark:border-gray-500" },
];

export function TokenLegend({ partCount }: { partCount: number }) {
    const items = partCount === 5 ? LEGEND_JWE : LEGEND_JWT;
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs opacity-70">
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0 ${item.bg}`} />
                    {item.label}
                </span>
            ))}
            <span className="flex items-center gap-1.5">
                <span className="text-purple-400 font-bold leading-none">·</span>
                separator
            </span>
        </div>
    );
}

function highlightToken(
    value: string,
    setTooltip: React.Dispatch<React.SetStateAction<{ text: string; x: number; y: number } | null>>
): React.ReactNode {
    if (!value) return null;

    const parts = value.split(".");
    const isJwe = parts.length === 5;
    const labels = isJwe
        ? ["Protected Header", "Encrypted Key", "Initialization Vector", "Ciphertext", "Authentication Tag"]
        : ["Header", "Payload", "Signature"];

    return parts.map((part, index) => (
        <React.Fragment key={index}>
            <span
                className={(COLOR_CLASSES[index] ?? "text-black dark:text-white") + " pointer-events-auto"}
                onMouseEnter={(e) => {
                    setTooltip({
                        text: labels[index] ?? `Segment ${index + 1}`,
                        x: e.clientX,
                        y: e.clientY,
                    });
                }}
                onMouseMove={(e) => {
                    setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : prev);
                }}
                onMouseLeave={() => setTooltip(null)}
            >
                {part}
            </span>
            {index < parts.length - 1 && <span className="text-purple-400">.</span>}
        </React.Fragment>
    ));
}

export default function TokenDisplay({ token, title, showLegend = true }: TokenDisplayProps) {
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
    const parts = token ? token.split(".") : [];

    return (
        <div>
            <TextAreaWrapper title={title} deleteEnabled={false} formContentText={token}>
                <div
                    className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-[#1e1e1e] min-h-24 p-4"
                    onMouseLeave={() => setTooltip(null)}
                >
                    <pre
                        className="font-mono text-sm leading-6"
                        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-all" }}
                    >
                        {token
                            ? highlightToken(token, setTooltip)
                            : <span className="text-gray-400 dark:text-gray-600 italic">Token will appear here after encoding</span>
                        }
                    </pre>
                </div>
            </TextAreaWrapper>
            {tooltip && (
                <div
                    className="pointer-events-none fixed z-50 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101826] px-2 py-1 text-xs text-gray-900 dark:text-gray-100 shadow-lg"
                    style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
                >
                    {tooltip.text}
                </div>
            )}
            {showLegend && parts.length >= 3 && (
                <TokenLegend partCount={parts.length} />
            )}
        </div>
    );
}
