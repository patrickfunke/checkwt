"use client";

import Link from "next/link";
import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";
import DecoderForm from "../components/DecoderForm";
import EncoderForm from "../components/EncoderForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="w-full p-4 md:p-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <ThemeSwitcher />
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/">Zu Info</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/chat">Zum Chat</Link>
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
            <Tabs defaultValue="decode" className="w-full">
                <TabsList className="w-full max-w-xs mx-auto">
                    <TabsTrigger value="decode" className="flex-1">Decode</TabsTrigger>
                    <TabsTrigger value="encode" className="flex-1">Encode</TabsTrigger>
                </TabsList>
                <TabsContent value="decode">
                    <DecoderForm />
                </TabsContent>
                <TabsContent value="encode">
                    <EncoderForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
