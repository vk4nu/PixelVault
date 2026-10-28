import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (!success && !isInstallable) {
        setShowGuide(true);
      }
    } catch {
      setShowGuide(true);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <button
        id="pwa-install-btn"
        onClick={handleInstallClick}
        title="Install Pixel Vault to your Home Screen"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#20242B] hover:bg-[#2A3039] active:scale-95 border border-[#373E48] text-xs font-medium text-[#A8C7FA] transition"
      >
        <Download className="w-3.5 h-3.5 text-[#A8C7FA]" />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1E232A] border border-[#353C46] p-5 shadow-2xl text-[#E2E2E6]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Add to Home Screen</h3>
                <p className="text-xs text-gray-400">Google Pixel & Mobile Installation</p>
              </div>
            </div>

            <div className="bg-[#14171C] rounded-xl p-3.5 text-xs space-y-2.5 text-gray-300 border border-[#2A313B]">
              {isIOS ? (
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Tap the <strong>Share</strong> button in your browser toolbar.</li>
                  <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              ) : (
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Tap the <strong>three dots menu (⋮)</strong> in Chrome on your Pixel.</li>
                  <li>Select <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
                  <li>Confirm to run with native full-screen biometric security!</li>
                </ol>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Runs offline with local hardware encryption.</span>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#2A303A] hover:bg-[#343C48] text-sm font-semibold text-white transition active:scale-98"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
