'use client';

import { useEffect, useRef, useState } from 'react';
import type { WebContainer } from '@webcontainer/api';
import { X, Maximize2 } from 'lucide-react';

interface TerminalProps {
  webContainer: WebContainer | null;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function Terminal({ 
  webContainer, 
  onClose, 
  isExpanded = false,
  onToggleExpand 
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!terminalRef.current) return;

    let mounted = true;

    // Dynamically import xterm to avoid SSR issues
    const initTerminal = async () => {
      try {
        const { Terminal: XTerm } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');

        if (!mounted || !terminalRef.current) return;

        // Initialize xterm
        const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      convertEol: true,
    });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Welcome message
        term.writeln('Welcome to Kode Terminal');
        term.writeln('Connecting to WebContainer...');
        term.writeln('');

        setIsReady(true);
        setIsLoading(false);

        // Handle resize
        const handleResize = () => {
          fitAddon.fit();
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          term.dispose();
        };
      } catch (error) {
        console.error('Error initializing terminal:', error);
        setIsLoading(false);
      }
    };

    initTerminal();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!webContainer || !xtermRef.current || !isReady) return;

    const term = xtermRef.current;
    let shellProcess: any = null;

    const startShell = async () => {
      try {
        shellProcess = await webContainer.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });

        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        const input = shellProcess.input.getWriter();
        
        term.onData((data: string) => {
          input.write(data);
        });

        term.writeln('Shell connected. Type commands below:');
        
        await shellProcess.exit;
        term.writeln('');
        term.writeln('Shell process exited');
      } catch (error) {
        console.error('Error starting shell:', error);
        term.writeln('');
        term.writeln(`Error: ${error instanceof Error ? error.message : 'Failed to start shell'}`);
      }
    };

    startShell();

    return () => {
      if (shellProcess) {
        shellProcess.kill();
      }
    };
  }, [webContainer, isReady]);

  useEffect(() => {
    // Fit terminal when expanded/collapsed
    if (fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 100);
    }
  }, [isExpanded]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Terminal</h3>
        <div className="flex items-center gap-2">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              title={isExpanded ? 'Minimize' : 'Maximize'}
            >
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-white">
            Loading terminal...
          </div>
        )}
        <div ref={terminalRef} className="h-full w-full p-2" />
      </div>
    </div>
  );
}
