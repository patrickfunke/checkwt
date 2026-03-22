"use client";

import Link from "next/link";
import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";
import DecoderForm from "../components/DecoderForm";
import EncoderForm from "../components/EncoderForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
    const [tab, setTab] = useState<"decode" | "encode">("decode");

    return (
        <div className="w-full p-4 md:p-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <ThemeSwitcher />
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/">Zu Info</Link>
                    </Button>
                </div>
            </div>
            <div className="flex items-center mx-auto w-fit gap-4">
                <img src="/favicon.ico" alt="favicon.ico" className="w-10 rounded-xl" />
                <h1 className="font-bold text-4xl text-center">CheckWTF - Finally understand JWT and JWE's</h1>
            </div>
            <div className="opacity-60 text-sm mx-auto w-fit max-w-200 text-center">
                Decode, verify, and generate JSON Web Tokens, which are an open, industry standard <a href="https://datatracker.ietf.org/doc/html/rfc7519" target="_blank" className="underline">RFC-7519</a> method for representing claims securely between two parties.
            </div>
            <div className="flex w-full max-w-xs mx-auto rounded-lg bg-muted p-[3px] gap-[3px]">
                <button
                    onClick={() => setTab("decode")}
                    className={`flex-1 rounded-md py-1 text-sm font-medium transition-all ${tab === "decode" ? "bg-background text-foreground shadow-sm dark:bg-input/30 dark:border dark:border-input" : "text-muted-foreground hover:text-foreground"}`}
                >Decode</button>
                <button
                    onClick={() => setTab("encode")}
                    className={`flex-1 rounded-md py-1 text-sm font-medium transition-all ${tab === "encode" ? "bg-background text-foreground shadow-sm dark:bg-input/30 dark:border dark:border-input" : "text-muted-foreground hover:text-foreground"}`}
                >Encode</button>
            </div>
            <div className={tab !== "decode" ? "hidden" : ""}>
                <DecoderForm />
            </div>
            <div className={tab !== "encode" ? "hidden" : ""}>
                <EncoderForm />
            </div>
        </div>
    );
}
