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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#200b24]/85 backdrop-blur-md animate-fadeIn text-[#FFFFC5]">
      <div className="bg-[#341539] rounded-3xl shadow-2xl max-w-2xl w-full border border-[rgba(255,255,197,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgba(255,255,197,0.18)] flex items-center justify-between bg-[rgba(255,255,197,0.02)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(255,255,197,0.1)] border border-[rgba(255,255,197,0.25)] flex items-center justify-center text-[#FFFFC5]">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#FFFFC5]">Cloudflare Only + GitHub CI/CD Guide</h3>
              <p className="text-xs text-[rgba(255,255,197,0.65)]">
                How this software runs 100% on Cloudflare's serverless edge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[rgba(255,255,197,0.6)] hover:text-[#FFFFC5] rounded-full hover:bg-[rgba(255,255,197,0.1)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#FFFFC5]">
          {/* Architecture Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[rgba(255,255,197,0.04)] border border-[rgba(255,255,197,0.18)] rounded-2xl">
              <span className="font-extrabold text-[#FFFFC5] block mb-1">1. Cloudflare Pages</span>
              <p className="text-[rgba(255,255,197,0.7)] text-[11px] leading-relaxed">
                Hosts the single-page application & serverless Pages Functions edge API.
              </p>
            </div>

            <div className="p-3.5 bg-[rgba(255,255,197,0.04)] border border-[rgba(255,255,197,0.18)] rounded-2xl">
              <span className="font-extrabold text-[#FFFFC5] block mb-1">2. Cloudflare D1</span>
              <p className="text-[rgba(255,255,197,0.7)] text-[11px] leading-relaxed">
                Serverless SQLite storing envelopes, signature placements, and audit trails.
              </p>
            </div>

            <div className="p-3.5 bg-[rgba(255,255,197,0.04)] border border-[rgba(255,255,197,0.18)] rounded-2xl">
              <span className="font-extrabold text-[#FFFFC5] block mb-1">3. Cloudflare R2</span>
              <p className="text-[rgba(255,255,197,0.7)] text-[11px] leading-relaxed">
                Zero-egress object storage for original PDFs, signatures, and sealed documents.
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#FFFFC5] uppercase tracking-wider">
              1. Provision Cloudflare Resources via Wrangler
            </h4>

            <div className="space-y-2">
              <p className="text-[rgba(255,255,197,0.75)]">Run these commands once in your terminal to initialize D1 and R2:</p>

              <div className="bg-[#200b24] text-[#FFFFC5] border border-[rgba(255,255,197,0.2)] p-3 rounded-xl font-mono text-[11px] relative group">
                <code>npx wrangler d1 create cloudsign-db</code>
                <button
                  onClick={() => copyCode('npx wrangler d1 create cloudsign-db')}
                  className="absolute right-2 top-2 p-1.5 bg-[rgba(255,255,197,0.1)] hover:bg-[rgba(255,255,197,0.2)] rounded text-[#FFFFC5]"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-[#200b24] text-[#FFFFC5] border border-[rgba(255,255,197,0.2)] p-3 rounded-xl font-mono text-[11px] relative group">
                <code>npx wrangler r2 bucket create cloudsign-documents</code>
                <button
                  onClick={() => copyCode('npx wrangler r2 bucket create cloudsign-documents')}
                  className="absolute right-2 top-2 p-1.5 bg-[rgba(255,255,197,0.1)] hover:bg-[rgba(255,255,197,0.2)] rounded text-[#FFFFC5]"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h4 className="text-xs font-bold text-[#FFFFC5] uppercase tracking-wider pt-2">
              2. Configure GitHub Secrets for CI/CD
            </h4>

            <p className="text-[rgba(255,255,197,0.75)]">
              In your GitHub Repository &gt; <b>Settings</b> &gt; <b>Secrets and variables</b> &gt; <b>Actions</b>, add:
            </p>

            <ul className="space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFFFC5] shrink-0" />
                <span>
                  <code className="bg-[rgba(255,255,197,0.1)] px-2 py-0.5 rounded font-mono font-bold text-[#FFFFC5]">
                    CLOUDFLARE_API_TOKEN
                  </code>{' '}
                  - Create in Cloudflare Dashboard with Pages & D1 edit permissions
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFFFC5] shrink-0" />
                <span>
                  <code className="bg-[rgba(255,255,197,0.1)] px-2 py-0.5 rounded font-mono font-bold text-[#FFFFC5]">
                    CLOUDFLARE_ACCOUNT_ID
                  </code>{' '}
                  - Found on your Cloudflare dashboard sidebar
                </span>
              </li>
            </ul>

            <h4 className="text-xs font-bold text-[#FFFFC5] uppercase tracking-wider pt-2">
              3. Automatic Push & Deploy
            </h4>

            <p className="text-[rgba(255,255,197,0.75)]">
              Every git push to <code className="bg-[rgba(255,255,197,0.1)] px-1.5 py-0.5 rounded font-mono">master</code> triggers the
              deployment to Cloudflare edge:
            </p>

            <div className="bg-[#200b24] border border-[rgba(255,255,197,0.2)] rounded-xl p-3 font-mono text-[11px] text-[#FFFFC5] space-y-1">
              <div>git add .</div>
              <div>git commit -m "Deploy CloudSign to Cloudflare"</div>
              <div>git push origin master</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,197,0.15)] flex justify-end bg-[rgba(255,255,197,0.02)]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-extrabold text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] rounded-full transition shadow-md"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
