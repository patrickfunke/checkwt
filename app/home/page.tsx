"use client";

import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";
import DecoderForm from "../components/DecoderForm";
import TabsBar from "../components/TabsBar";
import { TabsContent } from "@/components/ui/tabs";
import EncoderForm from "../components/EncoderForm";

export default function Home() {
    return (
        <>
            <div className="w-full h-screen p-4 md:p-10 space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <ThemeSwitcher/>
                </div>
                <div className="flex items-center mx-auto w-fit gap-4">
                    <img src="/favicon.ico" alt="favicon.ico"  className="w-10 rounded-xl"/>
                    <h1 className="font-bold text-4xl text-center">CheckWTF - Finally understand JWT and JWE's</h1>
                </div>
                <div className="opacity-60 text-sm mx-auto w-fit max-w-200 text-center">
                    Decode, verify, and generate JSON Web Tokens, which are an open, industry standard <a href="https://datatracker.ietf.org/doc/html/rfc7519" target="_blank" className="underline">RFC-7519</a> method for representing claims securely between two parties.
                </div>
                <TabsBar
                    onTabSelected={(tab) => console.log("Selected tab:", tab)}
                    tabsContent={
                        <div className="w-full">
                            <TabsContent className="w-full" value="decode">
                                <DecoderForm />
                            </TabsContent>
                            <TabsContent className="w-full" value="encode">
                                <EncoderForm />
                            </TabsContent>
                        </div>
                    }
                />
            </div>
        </>
    );
}
