"use client";

import Link from "next/link";
import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";
import DecoderForm from "./components/DecoderForm";
import JWTEncoderForm from "./components/JWTEncoderForm";
import JWEEncoderForm from "./components/JWEEncoderForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
    const [tab, setTab] = useState<"decode" | "encode-jwt" | "encode-jwe">("decode");

    return (
        <div className="w-full p-4 md:p-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <ThemeSwitcher />
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/docs">API Docs</Link>
                    </Button>
                </div>
            </div>
            <div className="flex items-center mx-auto w-fit gap-4">
                <img src="/favicon.ico" alt="favicon.ico" className="w-10 rounded-xl" />
                <h1 className="font-bold text-4xl text-center">CheckWTF - JWT & JWE Debugger</h1>
            </div>
            <div className="opacity-60 text-sm mx-auto w-fit max-w-200 text-center">
                Decode, verify, and generate JSON Web Tokens, which are an open, industry standard <a href="https://datatracker.ietf.org/doc/html/rfc7519" target="_blank" className="underline">RFC-7519</a> method for representing claims securely between two parties.
            </div>
            <div className="flex w-full max-w-sm mx-auto rounded-lg bg-muted p-[3px] gap-[3px]">
                <button
                    onClick={() => setTab("decode")}
                    className={`flex-1 rounded-md py-1 text-sm font-medium transition-all ${tab === "decode" ? "bg-background text-foreground shadow-sm dark:bg-input/30 dark:border dark:border-input" : "text-muted-foreground hover:text-foreground"}`}
                >Decoder</button>
                <button
                    onClick={() => setTab("encode-jwt")}
                    className={`flex-1 rounded-md py-1 text-sm font-medium transition-all ${tab === "encode-jwt" ? "bg-background text-foreground shadow-sm dark:bg-input/30 dark:border dark:border-input" : "text-muted-foreground hover:text-foreground"}`}
                >JWT Encoder</button>
                <button
                    onClick={() => setTab("encode-jwe")}
                    className={`flex-1 rounded-md py-1 text-sm font-medium transition-all ${tab === "encode-jwe" ? "bg-background text-foreground shadow-sm dark:bg-input/30 dark:border dark:border-input" : "text-muted-foreground hover:text-foreground"}`}
                >JWE Encoder</button>
            </div>
            <div className={tab !== "decode" ? "hidden" : ""}>
                <DecoderForm />
            </div>
            <div className={tab !== "encode-jwt" ? "hidden" : ""}>
                <JWTEncoderForm />
            </div>
            <div className={tab !== "encode-jwe" ? "hidden" : ""}>
                <JWEEncoderForm />
            </div>
        </div>
    );
}
