import React from 'react';
import { Shield, Lock, Eye, EyeOff, Settings, Plus, Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onLock: () => void;
  hideSensitive: boolean;
  onToggleHideSensitive: () => void;
  onOpenSettings: () => void;
  onAddNew: () => void;
  isPixelFrameMode: boolean;
  onTogglePixelFrame: () => void;
  expiringSoonCount?: number;
  onOpenExpiringAlert?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLock,
  hideSensitive,
  onToggleHideSensitive,
  onOpenSettings,
  onAddNew,
  isPixelFrameMode,
  onTogglePixelFrame,
  expiringSoonCount,
  onOpenExpiringAlert,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#111419]/90 backdrop-blur-md border-b border-[#252C37] px-4 py-2.5 flex items-center justify-between text-white">
      {/* Brand & Security Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-[#13161C] rounded-[10px] flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold text-sm tracking-tight text-white">Pixel Vault</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Hardware Encrypted" />
          </div>
          <span className="text-[10px] font-mono text-gray-400">Biometric Protected</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Viewport Frame Toggle */}
        <button
          type="button"
          onClick={onTogglePixelFrame}
          title={isPixelFrameMode ? 'Switch to Full Screen' : 'Switch to Pixel Phone Frame'}
          className="p-1.5 rounded-xl bg-[#1C212A] hover:bg-[#252C36] text-gray-300 border border-[#2E3643] transition hidden sm:flex items-center justify-center"
        >
          {isPixelFrameMode ? (
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          )}
        </button>

        {/* Expiring Soon Alert Trigger */}
        {expiringSoonCount !== undefined && expiringSoonCount > 0 && (
          <button
            type="button"
            onClick={onOpenExpiringAlert}
            title={`${expiringSoonCount} document(s) expiring within 30 days`}
            className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition active:scale-95 flex items-center gap-1 font-mono text-xs font-bold"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{expiringSoonCount}</span>
          </button>
        )}

        {/* Privacy Shield Toggle */}
        <button
          type="button"
          onClick={onToggleHideSensitive}
          title={hideSensitive ? 'Show Sensitive Numbers' : 'Mask Sensitive Numbers'}
          className={`p-1.5 rounded-xl border transition ${
            hideSensitive
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-[#1C212A] border-[#2E3643] text-gray-400 hover:text-white'
          }`}
        >
          {hideSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Vault Settings"
          className="p-1.5 rounded-xl bg-[#1C212A] hover:bg-[#252C36] text-gray-300 border border-[#2E3643] transition"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Quick Lock Button */}
        <button
          type="button"
          onClick={onLock}
          title="Lock Vault Now"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition active:scale-95"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Lock</span>
        </button>
      </div>
    </header>
  );
};
