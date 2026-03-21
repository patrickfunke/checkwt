"use client"

import Link from "next/link"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";

export default function Navbar({selected}: {selected: string}) {
    console.log("Selected:", selected);
    return (
        <>
        <div className="shadow-md flex flex-row items-center w-full h-min-48 bg-gray-100 dark:bg-[#1e1e1e] rounded-b-lg border border-gray-300 dark:border-[#1e1e1e] p-4">

<div className="flex items-center w-fit gap-4">
                <img src="/favicon.ico" alt="favicon.ico"  className="w-10 rounded-xl"/>
                <h1 className="font-bold text-4xl text-center uppercase">checkwtf</h1>
            </div>

            </div>
        </>
    );
};