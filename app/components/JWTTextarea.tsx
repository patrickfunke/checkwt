import React, { useRef, useState } from "react";

type JwtTextareaProps = {
    onChange?: (value: string) => void;
    errorMessage?: string | null;
    value: string | null;
    onValueChange?: (value: string) => void;
};

export default function JwtTextarea({ onChange, errorMessage, value, onValueChange }: JwtTextareaProps) {
    const highlightRef = useRef<HTMLPreElement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        onValueChange?.(newValue);
        onChange?.(newValue);
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (!highlightRef.current) return;
        highlightRef.current.scrollTop = e.currentTarget.scrollTop;
        highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }

    return (
        <div className="w-full">
            <div className="relative min-h-35">
                <pre
                    ref={highlightRef}
                    aria-hidden="true"
                    className="pointer-events-none min-h-35 overflow-auto rounded-xl p-4 font-mono leading-6 whitespace-pre-wrap wrap-break-word"
                >
                  {highlightJwt(value ? value : "")}
                </pre>

                <textarea
                    id="jwt"
                    value={value ? value : ""}
                    onChange={handleChange}
                    onScroll={handleScroll}
                    spellCheck={false}
                    placeholder="Paste JWT here"
                    className={(errorMessage ? "border-red-500 " : "") +"absolute inset-0 min-h-35 overflow-auto bg-transparent leading-6 text-transparent caret-black outline-none placeholder:text-gray-400 font-mono border border-gray-300 dark:border-[#1e1e1e] outline-blue-100 w-full resize-none rounded-lg h-165 p-4"}
                />
            </div>
        </div>
    );
}

function highlightJwt(value: string): React.ReactNode {
    if (!value) {
        return <span className="text-transparent"> </span>;
    }

    const parts = value.split(".");

    return parts.map((part, index) => {
        const colorClasses = ["text-red-600 dark:text-red-400", "text-yellow-600 dark:text-yellow-400", "text-green-600 dark:text-green-400", "text-blue-600 dark:text-blue-400", "text-black dark:text-white"];

        return (
            <React.Fragment key={index}>
                <span className={colorClasses[index]}>{part}</span>
                {index < parts.length - 1 && <span className="text-purple-400">.</span>}
            </React.Fragment>
        );
    });
}