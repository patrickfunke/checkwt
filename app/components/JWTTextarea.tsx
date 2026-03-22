import React, { useRef } from "react";

type JwtTextareaProps = {
    onChange?: (value: string) => void;
    errorMessage?: string | null;
    value: string | null;
    onValueChange?: (value: string) => void;
};

const JwtTextarea = React.forwardRef<HTMLTextAreaElement, JwtTextareaProps>(function JwtTextarea(
    { onChange, errorMessage, value, onValueChange }: JwtTextareaProps,
    ref
) {
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
    };

    return (
        <div className="w-full">
            <div className="relative h-128 lg:h-256">
                <pre
                    ref={highlightRef}
                    aria-hidden="true"
                    className="jwt-highlight absolute inset-0 z-20 overflow-auto rounded-xl p-4 font-mono leading-6 whitespace-pre-wrap pointer-events-none"
                    style={{ height: '100%', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                    {highlightJwt(value ?? "")}
                </pre>

                <textarea
                    ref={(el) => {
                        if (!ref) return;
                        if (typeof ref === "function") {
                            (ref as (instance: HTMLTextAreaElement | null) => void)(el);
                        } else {
                            try {
                                (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                            } catch {}
                        }
                    }}
                    id="jwt"
                    value={value ?? ""}
                    onChange={handleChange}
                    onScroll={handleScroll}
                    spellCheck={false}
                    placeholder="Paste here..."
                    className={(errorMessage ? "border-red-500 " : "") + "jwt-input absolute inset-0 z-10 overflow-auto bg-transparent leading-6 text-transparent caret-black outline-none placeholder:text-gray-400 font-mono border border-gray-300 dark:border-[#1e1e1e] outline-blue-100 w-full resize-none rounded-lg p-4"}
                    style={{ height: '100%' }}
                />
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

export default JwtTextarea;

const COLOR_CLASSES = [
    "text-red-600 dark:text-red-400",
    "text-yellow-600 dark:text-yellow-400",
    "text-green-600 dark:text-green-400",
    "text-blue-600 dark:text-blue-400",
    "text-black dark:text-white",
];

function highlightJwt(value: string): React.ReactNode {
    if (!value) {
        return <span className="text-transparent"> </span>;
    }
    const parts = value.split(".");
    return parts.map((part, index) => (
        <React.Fragment key={index}>
            <span className={COLOR_CLASSES[index] ?? "text-black dark:text-white"}>
                {part}
            </span>
            {index < parts.length - 1 && <span className="text-purple-400">.</span>}
        </React.Fragment>
    ));
}
