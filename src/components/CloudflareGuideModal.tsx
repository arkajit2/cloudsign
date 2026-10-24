import React from 'react';
import { X, Cloud, CheckCircle2, Copy } from 'lucide-react';

interface CloudflareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareGuideModal: React.FC<CloudflareGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Command copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-navy-900 to-navy-950 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cloudflare Only + GitHub CI/CD Guide</h3>
              <p className="text-xs text-slate-400">
                How this software runs 100% on Cloudflare's serverless edge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs">
          {/* Architecture Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="font-bold text-orange-900 block mb-1">1. Cloudflare Pages</span>
              <p className="text-slate-600 text-[11px]">
                Hosts the single-page application & serverless Pages Functions edge API.
              </p>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
              <span className="font-bold text-cyan-900 block mb-1">2. Cloudflare R2</span>
              <p className="text-slate-600 text-[11px]">
                Zero-egress object storage for original PDFs, signatures, and sealed documents.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="font-bold text-emerald-900 block mb-1">3. Cloudflare D1</span>
              <p className="text-slate-600 text-[11px]">
                Serverless SQLite storing envelopes, signature placements, and audit trails.
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Provision Cloudflare Resources via Wrangler
            </h4>

            <div className="space-y-2">
              <p className="text-slate-600">Run these commands once in your terminal to initialize D1 and R2:</p>

              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] relative group">
                <code>npx wrangler d1 create cloudsign-db</code>
                <button
                  onClick={() => copyCode('npx wrangler d1 create cloudsign-db')}
                  className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] relative group">
                <code>npx wrangler r2 bucket create cloudsign-documents</code>
                <button
                  onClick={() => copyCode('npx wrangler r2 bucket create cloudsign-documents')}
                  className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pt-2">
              2. Configure GitHub Secrets for CI/CD
            </h4>

            <p className="text-slate-600">
              In your GitHub Repository &gt; <b>Settings</b> &gt; <b>Secrets and variables</b> &gt; <b>Actions</b>, add:
            </p>

            <ul className="space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">
                    CLOUDFLARE_API_TOKEN
                  </code>{' '}
                  - Create in Cloudflare Dashboard with Pages & D1 edit permissions
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">
                    CLOUDFLARE_ACCOUNT_ID
                  </code>{' '}
                  - Found on your Cloudflare dashboard sidebar
                </span>
              </li>
            </ul>

            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pt-2">
              3. Automatic Push & Deploy
            </h4>

            <p className="text-slate-600">
              Every git push to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">main</code> triggers the
              GitHub Actions workflow (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.github/workflows/deploy.yml</code>):
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-700 space-y-1">
              <div>git add .</div>
              <div>git commit -m "Deploy CloudSign to Cloudflare"</div>
              <div>git push origin main</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-navy-900 hover:bg-navy-950 rounded-xl transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
