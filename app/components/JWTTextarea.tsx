import React, { useRef, useState, forwardRef, ForwardedRef } from "react";
import highlightJwt from "./HighlightJWT";

type JwtTextareaProps = {
    onChange?: (value: string) => void;
    errorMessage?: string | null;
    value: string | null;
    onValueChange?: (value: string) => void;
    showSegmentTooltips?: boolean;
};

export default forwardRef(function JwtTextarea(
    { onChange, errorMessage, value, onValueChange, showSegmentTooltips = false }: JwtTextareaProps,
    ref: ForwardedRef<HTMLTextAreaElement>
) {
    const highlightRef = useRef<HTMLPreElement | null>(null);
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

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
                    onMouseLeave={() => setTooltip(null)}
                    className={
                        "jwt-highlight absolute inset-0 z-20 overflow-auto rounded-xl p-4 font-mono leading-6 whitespace-pre-wrap pointer-events-none"
                    }
                    style={{ minHeight: 673, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                    {highlightJwt(value ? value : "", showSegmentTooltips, setTooltip)}
                </pre>

                <textarea
                    ref={ref} // Hier weiterreichen
                    id="jwt"
                    value={value ? value : ""}
                    onChange={handleChange}
                    onScroll={handleScroll}
                    spellCheck={false}
                    placeholder="Paste JWT here"
                    className={(errorMessage ? "border-red-500 " : "") +"dark:caret-white jwt-input absolute inset-0 z-10 overflow-auto bg-transparent leading-6 text-transparent caret-black outline-none placeholder:text-gray-400 font-mono border border-gray-300 dark:border-[#1e1e1e] dark:bg-[#17181b] outline-blue-100 w-full resize-none rounded-lg p-4"}
                    style={{ minHeight: 673 }}
                />

                {tooltip && showSegmentTooltips && (
                    <div
                        className="pointer-events-none fixed z-50 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[bg-[#17181b]] px-2 py-1 text-xs text-gray-900 dark:text-gray-100 shadow-lg"
                        style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
                    >
                        {tooltip.text}
                    </div>
                )}
            </div>
            <style jsx>{`
                .jwt-highlight::selection {
                    background: rgba(59,130,246,0.18);
                    color: inherit;
                }
                .jwt-input::selection {
                    background: rgba(59,130,246,0.18);
                    color: transparent;
                }
            `}</style>
        </div>
    );
});