import React from 'react';

interface PixelPhoneFrameProps {
  children: React.ReactNode;
  isFrameActive: boolean;
}

export const PixelPhoneFrame: React.FC<PixelPhoneFrameProps> = ({ children, isFrameActive }) => {
  if (!isFrameActive) {
    return <div className="w-full min-h-screen bg-[#0C0E12] text-[#E2E2E6]">{children}</div>;
  }

  return (
    <div className="w-full min-h-screen bg-[#08090C] flex items-center justify-center p-2 sm:p-6 overflow-x-hidden">
      {/* Google Pixel Chassis Outer Shell */}
      <div className="relative w-full max-w-[430px] h-[92vh] max-h-[920px] rounded-[48px] bg-[#1A1D24] p-[10px] shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_2px_rgba(255,255,255,0.08)] flex flex-col justify-between border border-[#303744]">
        {/* Right side Pixel buttons (Power & Volume rocker) */}
        <div className="hidden sm:block absolute -right-[13px] top-[140px] w-[3px] h-[36px] bg-[#3B4352] rounded-r-sm" />
        <div className="hidden sm:block absolute -right-[13px] top-[195px] w-[3px] h-[65px] bg-[#3B4352] rounded-r-sm" />

        {/* Pixel Inner Screen Bezel */}
        <div className="relative w-full h-full rounded-[40px] bg-[#0E1116] overflow-hidden flex flex-col border border-white/5">
          {/* Top Status Bar & Camera Punch-hole */}
          <div className="relative z-40 w-full h-8 bg-[#111419] flex items-center justify-between px-6 shrink-0 select-none text-[11px] font-mono text-gray-400">
            <span>9:41</span>
            {/* Center Front Camera Punch-hole */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2 border border-gray-400 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Main Application Viewport */}
          <div className="flex-1 w-full overflow-y-auto relative flex flex-col bg-[#0E1116]">
            {children}
          </div>

          {/* Bottom Gesture Navigation Pill */}
          <div className="w-full h-4 bg-[#111419] flex items-center justify-center shrink-0">
            <div className="w-28 h-1 rounded-full bg-gray-500/40" />
          </div>
        </div>
      </div>
    </div>
  );
};
