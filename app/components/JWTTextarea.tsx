import React, { useRef, useState } from "react";

type JwtTextareaProps = {
    onChange?: (value: string) => void;
    errorMessage?: string | null;
};

export default function JwtTextarea({ onChange, errorMessage }: JwtTextareaProps) {
    const [value, setValue] = useState<string>("");
    const highlightRef = useRef<HTMLPreElement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        setValue(newValue);          // update internal state
        onChange?.(newValue);        // notify parent
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (!highlightRef.current) return;
        highlightRef.current.scrollTop = e.currentTarget.scrollTop;
        highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }

    return (
        <div className="w-full max-w-3xl">
            <div className="relative min-h-35">
                <pre
                    ref={highlightRef}
                    aria-hidden="true"
                    className="pointer-events-none min-h-35 overflow-auto rounded-xl p-4 text-lg font-mono leading-6 whitespace-pre-wrap wrap-break-word"
                >
                  {highlightJwt(value)}
                </pre>

                <textarea
                    id="jwt"
                    value={value}
                    onChange={handleChange}
                    onScroll={handleScroll}
                    spellCheck={false}
                    placeholder="Paste JWT here"
                    className={(errorMessage ? "border-red-500 " : "") +"absolute inset-0 min-h-35 overflow-auto bg-transparent text-lg leading-6 text-transparent caret-black outline-none placeholder:text-gray-400 font-mono border border-gray-300 outline-blue-100 w-full resize-none rounded-lg h-139 p-4"}
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
        const colorClasses = ["text-red-600", "text-yellow-600", "text-green-600", "text-blue-600", "text-black"];

        return (
            <React.Fragment key={index}>
                <span className={colorClasses[index]}>{part}</span>
                {index < parts.length - 1 && <span className="text-gray-900">.</span>}
            </React.Fragment>
        );
    });
}