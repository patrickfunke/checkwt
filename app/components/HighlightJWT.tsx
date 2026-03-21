import React from "react";

export default function highlightJwt(
    value: string,
    showSegmentTooltips: boolean,
    setTooltip: React.Dispatch<React.SetStateAction<{ text: string; x: number; y: number } | null>>
): React.ReactNode {
    if (!value) {
        return <span className="text-transparent"> </span>;
    }

    const parts = value.split(".");
    const labels = ["Header (Algorithm, Typ)", "Payload (Claims)", "Signature (Prüfung)", "Segment 4", "Segment 5"];

    return parts.map((part, index) => {
        const colorClasses = ["text-red-600 dark:text-red-400 decoration-red-500/30", "text-yellow-600 dark:text-yellow-400 decoration-yellow-500/30", "text-green-600 dark:text-green-400 decoration-green-500/30", "text-blue-600 dark:text-blue-400 decoration-blue-500/30", "text-black dark:text-white decoration-black/30"];

        return (
            <React.Fragment key={index}>
                <span
                    className={(colorClasses[index] || "text-black dark:text-white") + (showSegmentTooltips ? " pointer-events-auto underline decoration-dashed decoration-2" : "")}
                    onMouseEnter={(e) => {
                        if (!showSegmentTooltips) return;
                        setTooltip({
                            text: labels[index] || `Segment ${index + 1}`,
                            x: e.clientX,
                            y: e.clientY,
                        });
                    }}
                    onMouseMove={(e) => {
                        if (!showSegmentTooltips) return;
                        setTooltip((prev) => {
                            if (!prev) return prev;
                            return { ...prev, x: e.clientX, y: e.clientY };
                        });
                    }}
                    onMouseLeave={() => {
                        if (!showSegmentTooltips) return;
                        setTooltip(null);
                    }}
                >
                    {part}
                </span>
                {index < parts.length - 1 && <span className="text-purple-400">.</span>}
            </React.Fragment>
        );
    });
};