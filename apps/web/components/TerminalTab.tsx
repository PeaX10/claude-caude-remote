"use client";

import { Terminal as TerminalIcon } from "lucide-react";

export function TerminalTab() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6" style={{paddingBottom: '120px'}}>
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TerminalIcon className="w-5 h-5" />
            Terminal Output
          </h3>
          
          <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg min-h-[400px]">
            <p className="mb-4">Terminal integration coming soon...</p>
            <p className="text-gray-500">
              This will allow you to execute commands directly in the Claude Code environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}