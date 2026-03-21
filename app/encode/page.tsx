"use client";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/app/components/ThemeSwitcher.tsx";
import Link from "next/link";
import { useState } from "react";
import EncoderForm from "../components/EncoderForm";

export default function Encode() {
    

    return (
        <div className="w-full h-screen p-4 md:p-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <ThemeSwitcher />
            </div>

            <div className="flex items-center mx-auto w-fit gap-4">
                <img src="/favicon.ico" alt="favicon.ico" className="w-10 rounded-xl" />
                <h1 className="font-bold text-4xl text-center uppercase">checkwtf</h1>
            </div>

            <div className="text-sm text-center max-w-200 mx-auto">
                Create signed JWTs or encrypted JWEs with jose-compatible algorithms.
            </div>

            <EncoderForm />
        </div>
    );
};