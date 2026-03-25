"use client";

import { useState } from "react";
import { type PolicyObject } from "@/domain/models";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { prettyJson } from "@/lib/utils";

interface RawJsonTabProps {
  policy: PolicyObject;
}

export function RawJsonTab({ policy }: RawJsonTabProps) {
  const [copied, setCopied] = useState(false);
  const jsonStr = prettyJson(policy);

  async function handleCopy() {
    await navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          leftIcon={
            copied ? (
              <CheckIcon className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <CopyIcon className="w-3.5 h-3.5" />
            )
          }
        >
          {copied ? "Copied" : "Copy JSON"}
        </Button>
      </div>
      <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-auto max-h-[60vh] leading-relaxed">
        {jsonStr}
      </pre>
    </div>
  );
}
