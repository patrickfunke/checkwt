import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface TabsBarProps {
  onTabSelected: (tab: string) => void;
  tabsContent: React.ReactNode;
}

export default function TabsBar({ onTabSelected, tabsContent }: TabsBarProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <Tabs
        defaultValue="decode"
        className="w-full flex flex-col items-center"
        onValueChange={(val) => onTabSelected(val)}
      >
        <TabsList className="w-[340px] md:w-[400px] rounded-full bg-gray-100 dark:bg-gray-800 m-4 p-1 flex gap-2 shadow-md">
          <TabsTrigger
            value="decode"
            className="w-1/2 rounded-full py-2 text-base text-sm font-semibold transition-all
                       data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm
                       dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
          >
            Decode
          </TabsTrigger>
          <TabsTrigger
            value="encode"
            className="w-1/2 rounded-full py-2 text-base text-sm font-semibold transition-all
                       data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm
                       dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
          >
            Encode
          </TabsTrigger>
        </TabsList>

        <div className="w-full animate-fade-in">
          <div className="w-full">{tabsContent}</div>
        </div>
      </Tabs>
    </div>
  );
}