'use client';

import React from 'react';
import { Github, Mail } from 'lucide-react';

const DeveloperSection = () => {
  return (
    <footer className="mt-16 pt-8 border-t border-border/40">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-ink-light/60">
        <span>Built by Chan Meng</span>
        <span className="hidden sm:inline">·</span>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ChanMeng666"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-ink-light transition-colors"
          >
            <Github className="h-3 w-3" />
            GitHub
          </a>
          <a
            href="mailto:chanmeng.dev@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-ink-light transition-colors"
          >
            <Mail className="h-3 w-3" />
            联系
          </a>
          <a
            href="https://github.com/ChanMeng666/chinese-redefine"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink-light transition-colors"
          >
            项目仓库
          </a>
        </div>
      </div>
    </footer>
  );
};

export default DeveloperSection;
