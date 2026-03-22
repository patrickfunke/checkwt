"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Message {
    type: "error" | "info" | "success";
    message: string;
    icon?: string;
}

interface TextAreaWrapperProps {
    title: string;
    copyEnabled?: boolean;
    deleteEnabled?: boolean;
    showDescription?: boolean;
    messages?: Message[];
    description?: string;
    children: ReactNode;
    formContentText: string;
    onClear?: () => void;
}

export default function TextAreaWrapper({
                                            title,
                                            copyEnabled = true,
                                            deleteEnabled = true,
                                            showDescription = true,
                                            messages = [],
                                            description,
                                            children,
                                            formContentText,
                                            onClear,
                                        }: TextAreaWrapperProps) {
    const [copied, setCopied] = useState(false);

    const getParsedConentText = () => {
        if (formContentText === undefined || formContentText === null) return null;

        let textToCopy: string;

        if (typeof formContentText === "object") {
            textToCopy = JSON.stringify(formContentText, null, 2);
        } else {
            textToCopy = String(formContentText);
        }
        return textToCopy;
    }

    const handleCopy = async () => {
        const textToCopy = getParsedConentText();
        if (textToCopy == null) return;

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        }
    };

    const getMessageClasses = (type: Message["type"]) => {
        switch (type) {
            case "error":
                return "bg-red-500/10 text-red-500";
            case "info":
                return "bg-blue-500/10 text-blue-400";
            case "success":
                return "bg-green-500/10 text-green-400";
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Header mit Titel + Buttons */}
            <div className="flex justify-between items-center font-bold">
                <div className="flex gap-2 items-center">
                    <div>{title}</div>

                    {/* Messages */}
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-row items-center gap-2 text-xs px-2 py-1 rounded-lg border ${getMessageClasses(msg.type)}`}
                        >
                            { msg.icon && <img className="w-2 h-2 inline" src={msg.icon} alt="Box icon"/> }
                            {msg.message}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button disabled={true}> {/*Placeholder*/}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                             xmlns="http://www.w3.org/2000/svg">
                        </svg>
                    </Button>
                    {copyEnabled && (
                        <Button
                            title="Copy"
                            className="cursor-pointer"
                            onClick={handleCopy}
                            disabled={formContentText == ""}
                        >
                            {
                                copied ?
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"></path>
                                    </svg> :
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M8 15H12C13.6569 15 15 13.6569 15 12V8C15 6.34315 13.6569 5 12 5H8C6.34315 5 5 6.34315 5 8V12C5 13.6569 6.34315 15 8 15Z"
                                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                            strokeLinejoin="round"></path>
                                        <path
                                            d="M8 0.25C9.33915 0.25 10.5138 0.952094 11.177 2.00819C11.4679 2.47151 11.0737 3 10.5266 3C10.2123 3 9.93488 2.81318 9.7352 2.57055C9.32304 2.06973 8.6994 1.75 8 1.75H4C2.75736 1.75 1.75 2.75736 1.75 4V8C1.75 8.69927 2.06986 9.32232 2.57062 9.73428C2.81326 9.93389 3 10.2113 3 10.5255C3 11.0726 2.47146 11.4669 2.00808 11.176C0.952101 10.513 0.25 9.33902 0.25 8V4C0.25 1.92893 1.92893 0.25 4 0.25H8Z"
                                            fill="currentColor"></path>
                                    </svg>
                            }


                        </Button>
                    )}
                    {deleteEnabled && (
                        <Button title="Clear" className="cursor-pointer" onClick={handleClear}
                                disabled={formContentText == ""}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M4.1094 3.3359L1 8L4.1094 12.6641C4.6658 13.4987 5.60249 14 6.60555 14H15V2H6.60555C5.60249 2 4.6658 2.5013 4.1094 3.3359Z"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                    strokeLinejoin="round"></path>
                                <path d="M7 6L11 10M11 6L7 10" stroke="currentColor" strokeWidth="1.5"
                                      strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        </Button>
                    )}
                </div>
            </div>

            {/* Hauptinhalt */}
            {children}

            {(showDescription && description) && (
                <div
                    className="mt-2 text-sm flex gap-2 items-center bg-yellow-500/10 px-4 py-2 border border-yellow-300 rounded-lg w-full">
                    <img src="/lightbulb.png" alt="Lightbulb icon" className="w-6"/>
                    <div>{description }</div>
                </div>
            )}
        </div>
    );
}