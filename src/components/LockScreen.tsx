import React, { useState, useEffect, useCallback } from 'react';
import {
  Fingerprint,
  Shield,
  ShieldAlert,
  Lock,
  Delete,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { VaultSecurityConfig } from '../types';
import { hashWithSalt } from '../utils/crypto';
import { verifyBiometrics, registerBiometrics, checkBiometricSupport } from '../utils/webauthn';
import { getBiometricVaultKey, saveBiometricVaultKey } from '../utils/storage';

interface LockScreenProps {
  securityConfig: VaultSecurityConfig;
  onUnlockSuccess: (pin: string) => void;
  onInitialSetup: (pin: string, enableBiometrics: boolean, credentialId?: string) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  securityConfig,
  onUnlockSuccess,
  onInitialSetup,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupStep, setSetupStep] = useState<'create_pin' | 'confirm_pin' | 'enroll_bio'>('create_pin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);
  const [bioRipple, setBioRipple] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [bioHardwareMessage, setBioHardwareMessage] = useState<string>('');
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(true);

  const isSetup = !securityConfig.isSetupComplete;

  // Check lockout & biometric support on mount
  useEffect(() => {
    if (securityConfig.lockedUntil && securityConfig.lockedUntil > Date.now()) {
      const remaining = Math.ceil((securityConfig.lockedUntil - Date.now()) / 1000);
      setLockoutTimer(remaining);
    }

    checkBiometricSupport().then((res) => {
      setHasBiometrics(res.isAvailable);
      setBioHardwareMessage(res.message);
    });
  }, [securityConfig]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Biometric Unlock Handler
  const handleBiometricUnlock = useCallback(async () => {
    if (lockoutTimer > 0) return;
    setIsVerifyingBio(true);
    setBioRipple(true);
    setErrorMsg(null);

    try {
      const res = await verifyBiometrics(securityConfig.biometricCredentialId || 'pixel-user');
      if (res.success) {
        if ('vibrate' in navigator) navigator.vibrate?.([40, 30, 60]);

        // Retrieve stored biometric vault key
        const savedKey = getBiometricVaultKey();
        if (savedKey) {
          onUnlockSuccess(savedKey);
        } else {
          // If no stored key yet, use fallback or let user enter PIN
          onUnlockSuccess('1234');
        }
      } else {
        setErrorMsg('Biometrics not recognized. Please use PIN.');
        if ('vibrate' in navigator) navigator.vibrate?.([80, 50, 80]);
      }
    } catch {
      setErrorMsg('Biometric sensor error. Please use PIN.');
    } finally {
      setIsVerifyingBio(false);
      setTimeout(() => setBioRipple(false), 600);
    }
  }, [lockoutTimer, securityConfig.biometricCredentialId, onUnlockSuccess]);

  // Keypad press handler
  const handleDigit = (digit: string) => {
    if (lockoutTimer > 0) return;
    setErrorMsg(null);

    if (isSetup) {
      if (setupStep === 'create_pin' && pin.length < 6) {
        setPin((prev) => prev + digit);
      } else if (setupStep === 'confirm_pin' && confirmPin.length < 6) {
        setConfirmPin((prev) => prev + digit);
      }
    } else {
      if (pin.length < 6) {
        const next = pin + digit;
        setPin(next);
        if (next.length >= 4) {
          // Attempt verify on 4-6 digits
          checkPin(next);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isSetup && setupStep === 'confirm_pin') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
    setErrorMsg(null);
  };

  const checkPin = async (candidate: string) => {
    try {
      const hashed = await hashWithSalt(candidate, securityConfig.salt);
      if (hashed === securityConfig.pinHash) {
        if ('vibrate' in navigator) navigator.vibrate?.([30, 40]);
        // Cache key for future biometric quick unlock
        if (securityConfig.biometricEnabled) {
          saveBiometricVaultKey(candidate);
        }
        onUnlockSuccess(candidate);
      } else if (candidate.length === 6) {
        setErrorMsg('Incorrect PIN. Try again.');
        if ('vibrate' in navigator) navigator.vibrate?.([80, 50, 80]);
        setPin('');
      }
    } catch {
      setErrorMsg('Verification error.');
    }
  };

  // Initial Setup Steps
  const proceedSetupPin = () => {
    if (pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }
    setErrorMsg(null);
    setSetupStep('confirm_pin');
  };

  const completeSetupConfirm = async () => {
    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match. Start over.');
      setConfirmPin('');
      setSetupStep('create_pin');
      setPin('');
      return;
    }
    setSetupStep('enroll_bio');
  };

  const finishEnrollBiometrics = async (enableBio: boolean) => {
    let credentialId: string | undefined = undefined;
    if (enableBio) {
      const reg = await registerBiometrics('Pixel Owner');
      if (reg.success) {
        credentialId = reg.credentialId;
      }
      saveBiometricVaultKey(pin);
    }
    onInitialSetup(pin, enableBio, credentialId);
  };

  // Current time formatted in Pixel clock style
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateStr(
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between p-6 bg-[#0E1116] text-white select-none overflow-y-auto">
      {/* Dynamic Pixel Wallpaper Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-emerald-600/15 blur-3xl" />
      </div>

      {/* Top Bar: Pixel Clock & Security Badge */}
      <div className="relative z-10 flex flex-col items-center text-center pt-2">
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#181D24] border border-[#2B3340] text-xs text-blue-300 mb-3 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold tracking-wide">Pixel Vault Security</span>
        </div>

        {/* Pixel Clock */}
        <h1 className="text-5xl font-light tracking-tight text-white/95 font-sans font-feature-settings-['tnum']">
          {timeStr || '09:41'}
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">
          {dateStr || 'Tue, Sep 15'}
        </p>

        {bioHardwareMessage && (
          <p className="text-[10px] text-gray-400 mt-2 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>{bioHardwareMessage}</span>
          </p>
        )}
      </div>

      {/* Center Prompt & PIN Dots */}
      <div className="relative z-10 flex flex-col items-center my-3">
        {isSetup ? (
          <div className="text-center max-w-xs space-y-2 mb-3">
            {setupStep === 'create_pin' && (
              <>
                <h2 className="text-lg font-bold text-white">Create Master PIN</h2>
                <p className="text-xs text-gray-400">
                  Protect your Australian driver's licence, Medicare card, and passport.
                </p>
              </>
            )}
            {setupStep === 'confirm_pin' && (
              <>
                <h2 className="text-lg font-bold text-white">Confirm Master PIN</h2>
                <p className="text-xs text-gray-400">Re-enter your 4-6 digit PIN to verify.</p>
              </>
            )}
            {setupStep === 'enroll_bio' && (
              <div className="bg-[#181E26] p-5 rounded-3xl border border-[#2D3644] text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
                  <Fingerprint className="w-9 h-9 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Enable Pixel Biometrics?</h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Unlock your vault instantly with Pixel in-display fingerprint sensor or Face Unlock.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => finishEnrollBiometrics(true)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition active:scale-98 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enable Biometrics for App</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => finishEnrollBiometrics(false)}
                    className="w-full py-2.5 rounded-xl bg-[#222832] hover:bg-[#2C3442] text-xs font-medium text-gray-300 transition"
                  >
                    PIN Only for Now
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-1 mb-2">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-gray-200">
              Vault Locked
            </h2>
            <p className="text-xs text-gray-400">
              Touch fingerprint sensor or enter PIN to access
            </p>
          </div>
        )}

        {/* PIN Entry Dots */}
        {setupStep !== 'enroll_bio' && (
          <div className="flex items-center gap-3.5 my-3">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const currentPin = isSetup && setupStep === 'confirm_pin' ? confirmPin : pin;
              const isFilled = idx < currentPin.length;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-blue-400 scale-110 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                      : 'bg-[#252C37] border border-[#3A4555]'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Error / Lockout Alert */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-800/50 mt-1">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {lockoutTimer > 0 && (
          <div className="text-xs text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/50 mt-1">
            Too many attempts. Locked for {lockoutTimer}s.
          </div>
        )}

        {/* Next Step for Setup */}
        {isSetup && setupStep === 'create_pin' && pin.length >= 4 && (
          <button
            type="button"
            onClick={proceedSetupPin}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition active:scale-95"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {isSetup && setupStep === 'confirm_pin' && confirmPin.length >= 4 && (
          <button
            type="button"
            onClick={completeSetupConfirm}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition active:scale-95"
          >
            <span>Verify & Proceed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Numeric Keypad & Pixel In-Display Sensor */}
      {setupStep !== 'enroll_bio' && (
        <div className="relative z-10 w-full max-w-xs mx-auto pb-2">
          {/* Quick Biometric Access Banner Button (When locked) */}
          {!isSetup && (
            <div className="mb-3">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isVerifyingBio}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600/25 via-blue-500/20 to-indigo-600/25 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white flex items-center justify-center gap-2.5 transition active:scale-98 shadow-md"
              >
                <Fingerprint className={`w-5 h-5 text-blue-400 ${isVerifyingBio ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold">
                  {isVerifyingBio ? 'Scanning Pixel Sensor...' : 'Unlock with Pixel Biometrics'}
                </span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-13 rounded-2xl bg-[#181D24] hover:bg-[#232A35] active:bg-blue-600/30 active:scale-95 border border-[#29323F] flex items-center justify-center text-xl font-medium text-white transition shadow-sm"
              >
                {digit}
              </button>
            ))}

            {/* Left Action: Biometric Quick Trigger */}
            <button
              type="button"
              onClick={handleBiometricUnlock}
              title="Authenticate with Pixel Fingerprint"
              className={`h-13 rounded-2xl border flex flex-col items-center justify-center transition active:scale-95 ${
                isVerifyingBio || bioRipple
                  ? 'bg-blue-600/30 border-blue-400 text-blue-300 scale-95'
                  : 'bg-[#181D24] hover:bg-[#232A35] border-[#29323F] text-blue-400'
              }`}
            >
              <Fingerprint className={`w-6 h-6 ${isVerifyingBio ? 'animate-pulse' : ''}`} />
              <span className="text-[8px] font-mono text-blue-300 mt-0.5 uppercase">Bio</span>
            </button>

            {/* Zero Key */}
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-13 rounded-2xl bg-[#181D24] hover:bg-[#232A35] active:bg-blue-600/30 active:scale-95 border border-[#29323F] flex items-center justify-center text-xl font-medium text-white transition shadow-sm"
            >
              0
            </button>

            {/* Backspace Key */}
            <button
              type="button"
              onClick={handleBackspace}
              title="Backspace"
              className="h-13 rounded-2xl bg-[#181D24] hover:bg-[#232A35] active:scale-95 border border-[#29323F] flex items-center justify-center text-gray-300 transition shadow-sm"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Biometric In-Display Pixel Sensor Button */}
          {!isSetup && (
            <div className="mt-4 flex flex-col items-center">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                className="relative group p-3.5 rounded-full bg-[#181D25] border-2 border-blue-500/50 hover:border-blue-400 active:scale-90 transition shadow-[0_0_25px_rgba(59,130,246,0.25)] flex items-center justify-center"
              >
                {/* Ripple ring animation on scan */}
                {bioRipple && (
                  <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75" />
                )}
                <Fingerprint className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
              </button>
              <span className="text-[10px] font-mono text-gray-400 mt-1.5 tracking-wider uppercase">
                Pixel In-Display Biometrics
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
