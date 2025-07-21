import React, { useState, useRef,useEffect } from "react";
import { motion } from "framer-motion";

type UploadTerminalProps = {
  onUploadComplete?: (token: string, link: string) => void;
};

export function UploadTerminal({ onUploadComplete }: UploadTerminalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle'|'progress'|'done'|'error'>('idle');
  const [token, setToken] = useState("");
  const [link, setLink] = useState("");
  const [typewriter, setTypewriter] = useState("");
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStage('idle');
      setProgress(0);
      setError("");
      setLog([]);
    }
  }

  async function startUpload() {
    if (!file) return;
    setStage('progress');
    setProgress(0);
    setError("");
    setLog([`> UPLOAD ${file.name}`,'Establishing connection...']);
    // Simulate upload with real progress
    const form = new FormData();
    form.append('file', file);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/files/upload', true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          setStage('done');
          setProgress(100);
          setLog(l => [...l, 'Upload complete. Generating token...']);
          // Simulate token
          const resp = JSON.parse(xhr.responseText);
          const t = resp.token || randomToken();
          const lnk = resp.link || `https://silentparcel.io/${t}`;
          setToken(t);
          setLink(lnk);
          // Typewriter effect
          let i = 0;
          setTypewriter("");
          const tw = setInterval(() => {
            setTypewriter(t.slice(0, i+1));
            i++;
            if (i >= t.length) clearInterval(tw);
          }, 60);
          if (onUploadComplete) onUploadComplete(t, lnk);
        } else {
          setStage('error');
          setError('Upload failed.');
        }
      };
      xhr.onerror = () => {
        setStage('error');
        setError('Network error.');
      };
      xhr.send(form);
    } catch (e) {
      setStage('error');
      setError('Upload failed.');
    }
  }

  function randomToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; ++i) out += chars[Math.floor(Math.random()*chars.length)];
    return out;
  }

  // ASCII spinner for retro loading
  const spinnerFrames = ['|', '/', '-', '\\'];
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  // Animate spinner
  // @ts-ignore
  useEffect(() => {
    if (stage === 'progress') {
      const spin = setInterval(() => setSpinnerIdx(i => (i+1)%4), 120);
      return () => clearInterval(spin);
    }
  }, [stage]);

  return (
    <div className="w-full max-w-md mx-auto bg-[var(--retro-bg)] border border-[var(--retro-accent)] rounded-lg p-6 font-mono text-[var(--retro-fg)] shadow-lg">
      <div className="mb-4 text-center text-lg font-bold tracking-wider text-[var(--retro-fg)]">UPLOAD TERMINAL</div>
      <div className="mb-4">
        <input
          ref={inputRef}
          type="file"
          className="block w-full text-sm text-[var(--retro-fg)] file:bg-[var(--retro-accent)] file:text-[var(--retro-bg)] file:rounded file:px-2 file:py-1 file:border-none file:mr-2"
          onChange={handleFile}
          disabled={stage==='progress'}
        />
      </div>
      {file && stage!=='done' && (
        <div className="mb-4 text-xs text-[var(--retro-accent)]">Selected: {file.name}</div>
      )}
      {stage==='progress' && (
        <div className="mb-4">
          <div className="text-xs text-[var(--retro-accent)] mb-1 flex items-center gap-2">
            <span>Uploading:</span>
            <span className="font-bold">{file?.name}</span>
            <span className="text-[var(--retro-fg)]">{spinnerFrames[spinnerIdx]}</span>
          </div>
          <div className="text-[var(--retro-progress)] text-xs font-mono mb-1">[{'#'.repeat(Math.floor(progress/5)).padEnd(20, ' ')}] {progress}%</div>
          <div className="text-[var(--retro-accent)] text-xs font-mono">Transmitting packet... <span className="animate-pulse">{'.'.repeat((progress/10)%4+1)}</span></div>
        </div>
      )}
      {stage==='done' && (
        <div className="mb-4">
          <div className="text-green-400 text-xs font-mono mb-2">Upload complete.</div>
          <div className="text-[var(--retro-fg)] text-xs font-mono mb-2">File Token: <span className="text-green-300">{typewriter}</span></div>
          <div className="text-[var(--retro-accent)] text-xs font-mono">Share Link: <span className="text-green-200">{link}</span></div>
          <motion.div
            className="text-green-400 text-xs font-mono mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 1] }}
            transition={{ duration: 1.2 }}
          >
            ACCESS GRANTED
          </motion.div>
        </div>
      )}
      {stage==='error' && (
        <div className="mb-4 text-xs text-[var(--retro-error)]">{error}</div>
      )}
      {log.length > 0 && (
        <div className="mb-2 text-xs text-[var(--retro-accent)] font-mono bg-[var(--retro-bg)]/60 rounded p-2">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button
          className="bg-[var(--retro-accent)] text-[var(--retro-bg)] rounded px-4 py-2 font-bold text-sm disabled:opacity-60"
          onClick={startUpload}
          disabled={!file || stage==='progress'}
        >
          {stage==='progress' ? 'Uploading...' : 'Start Upload'}
        </button>
        <button
          className="bg-[var(--retro-error)] text-[var(--retro-bg)] rounded px-4 py-2 font-bold text-sm"
          onClick={() => { setFile(null); setStage('idle'); setProgress(0); setError(''); setLog([]); setToken(''); setLink(''); setTypewriter(''); }}
          disabled={stage==='progress'}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
