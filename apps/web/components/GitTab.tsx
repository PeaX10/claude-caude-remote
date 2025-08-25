"use client";

import { GitBranch } from "lucide-react";
import type { GitStatus } from "@/lib/types";

interface GitTabProps {
  instanceGit: GitStatus | undefined;
}

export function GitTab({ instanceGit }: GitTabProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6" style={{paddingBottom: '120px'}}>
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Repository Status
          </h3>
          
          {instanceGit && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Modified Files</h4>
                <div className="space-y-2">
                  {instanceGit.modified.map((file) => (
                    <div key={file} className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                      <span className="text-amber-600 font-mono font-semibold">M</span> 
                      <span className="text-gray-800 text-sm font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Staged Files</h4>
                <div className="space-y-2">
                  {instanceGit.staged.map((file) => (
                    <div key={file} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                      <span className="text-green-600 font-mono font-semibold">A</span> 
                      <span className="text-gray-800 text-sm font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Untracked Files</h4>
                <div className="space-y-2">
                  {instanceGit.untracked.map((file) => (
                    <div key={file} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                      <span className="text-gray-600 font-mono font-semibold">?</span> 
                      <span className="text-gray-800 text-sm font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}