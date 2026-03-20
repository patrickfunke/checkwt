import React, { useState, useRef } from "react";
import PrettyPrint from "../components/prettyPrint";


function prettifyJson(input: string): string {
  try {
    const obj = JSON.parse(input);
    return JSON.stringify(obj, null, 2);
  } catch {
    return input; // Show as-is if not valid JSON
  }
}

export default function EditableJson({ initialValue = "{}", className = "", onChange }: { initialValue?: string; className?: string; onChange?: (val: string) => void }) {
  const [value, setValue] = useState(initialValue);
  const [display, setDisplay] = useState(prettifyJson(initialValue));
  const ref = useRef<HTMLDivElement>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText;
    setValue(text);
    setDisplay(prettifyJson(text));
    if (onChange) onChange(text);
  };

  return (
    <div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={`border rounded p-2 min-h-[100px] font-mono bg-white ${className}`}
        onInput={handleInput}
        style={{ whiteSpace: "pre-wrap", outline: "none" }}
        aria-label="Editable JSON input"
      >
        {value}
      </div>
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1">Prettified output:</div>
        <PrettyPrint data={display} />
      </div>
    </div>
  );
}