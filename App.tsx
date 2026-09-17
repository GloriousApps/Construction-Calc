
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import Display from './components/Display';
import CalculatorButton from './components/CalculatorButton';
import { ButtonType, Operator } from './types';
import { formatConstructionUnit, builderToDisplay } from './utils/formatter';
import { calculatorReducer, initialCalculatorState, CalculatorActionType } from './utils/calculatorReducer';
import { checkForUpdate, downloadUpdate, installAPK, GithubRelease } from './utils/updateChecker';
import { UpdateModal } from './components/UpdateModal';
import { SettingsModal } from './components/SettingsModal';

const APP_VERSION = '1.0.1';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [visualTheme, setVisualTheme] = useState<'default' | 'aero'>(() => window.localStorage.getItem('construction-calc-visual-theme') === 'aero' ? 'aero' : 'default');
  const [showSettings, setShowSettings] = useState(false);
  const [showTape, setShowTape] = useState(false);
  const [fractionDenominator, setFractionDenominator] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem('construction-calc-fraction-denominator'));
    return [2, 4, 8, 16, 32, 64].includes(stored) ? stored : 64;
  });
  const [normalDecimalPlaces, setNormalDecimalPlaces] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem('construction-calc-normal-decimals'));
    return stored >= 1 && stored <= 6 ? stored : 6;
  });
  const [engineeringDecimalPlaces, setEngineeringDecimalPlaces] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem('construction-calc-engineering-decimals'));
    return stored >= 1 && stored <= 6 ? stored : 5;
  });
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>(() => {
    const stored = window.localStorage.getItem('construction-calc-orientation');
    return stored === 'portrait' || stored === 'landscape' ? stored : 'auto';
  });
  const [wideViewport, setWideViewport] = useState(() => window.matchMedia('(min-width: 700px)').matches);
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);
  const isLandscape = orientation === 'landscape' || (orientation === 'auto' && wideViewport);

  // Update State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateRelease, setUpdateRelease] = useState<GithubRelease | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState(APP_VERSION);

  useEffect(() => {
    CapacitorApp.getInfo()
      .then(({ version }) => setAppVersion(version))
      .catch(() => setAppVersion(APP_VERSION));
  }, []);

  const runUpdateCheck = useCallback(async (): Promise<GithubRelease | null> => {
    const release = await checkForUpdate();
    if (release) {
      setUpdateRelease(release);
      setShowUpdateModal(true);
      return release;
    }
    return null;
  }, []);

  const startSettingsUpdate = useCallback((release: GithubRelease) => {
    setUpdateRelease(release);
    setShowSettings(false);
    setShowUpdateModal(true);
  }, []);

  // Check for updates on mount
  useEffect(() => {
    runUpdateCheck();
  }, [runUpdateCheck]);

  const handleUpdateConfirm = async () => {
    if (!updateRelease) return;
    setUpdateError(null);
    setDownloadProgress(0);
    setIsDownloading(true);
    try {
      const filePath = await downloadUpdate(updateRelease, (progress) => {
        setDownloadProgress(progress);
      });
      setIsDownloading(false);
      await installAPK(filePath);
    } catch (error) {
      console.error('In-app update failed:', error);
      setIsDownloading(false);
      setUpdateError('Güncelleme indirilemedi veya kurulum başlatılamadı. Bağlantınızı kontrol edip tekrar deneyin.');
    }
  };

  const handleUpdateCancel = () => {
    setShowUpdateModal(false);
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleFractionDenominatorChange = useCallback((denominator: number) => {
    setFractionDenominator(denominator);
    window.localStorage.setItem('construction-calc-fraction-denominator', String(denominator));
  }, []);

  const handleVisualThemeChange = useCallback((theme: 'default' | 'aero') => {
    setVisualTheme(theme);
    window.localStorage.setItem('construction-calc-visual-theme', theme);
  }, []);

  const handleNormalDecimalPlacesChange = useCallback((places: number) => {
    setNormalDecimalPlaces(places);
    window.localStorage.setItem('construction-calc-normal-decimals', String(places));
  }, []);

  const handleEngineeringDecimalPlacesChange = useCallback((places: number) => {
    setEngineeringDecimalPlaces(places);
    window.localStorage.setItem('construction-calc-engineering-decimals', String(places));
  }, []);

  const handleOrientationChange = useCallback((value: 'auto' | 'portrait' | 'landscape') => {
    setOrientation(value);
    window.localStorage.setItem('construction-calc-orientation', value);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 700px)');
    const update = () => setWideViewport(media.matches);
    update();
    media.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      media.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Handlers wrapped in useCallback for stable references
  const handleNumber = useCallback((num: string) => {
    dispatch({ type: CalculatorActionType.NUMBER, payload: num });
  }, []);

  const handleDecimal = useCallback(() => {
    dispatch({ type: CalculatorActionType.DECIMAL });
  }, []);

  const handleConv = useCallback(() => {
    dispatch({ type: CalculatorActionType.CONVERSION });
  }, []);

  const handleUnit = useCallback((unit: 'feet' | 'inch' | 'yard') => {
    dispatch({ type: CalculatorActionType.UNIT, payload: unit });
  }, []);

  const handleFractionSlash = useCallback(() => {
    dispatch({ type: CalculatorActionType.FRACTION });
  }, []);

  const handleBackspace = useCallback(() => {
    dispatch({ type: CalculatorActionType.BACKSPACE });
  }, []);

  const handleOperator = useCallback((op: Operator) => {
    // Only used for visual buttons, keydown handles mapping separately? 
    // Actually keydown should use the same dispatch.
    dispatch({ type: CalculatorActionType.OPERATOR, payload: op });
  }, []);

  const handleEqual = useCallback(() => {
    dispatch({ type: CalculatorActionType.EQUAL });
  }, []);

  const handleClear = useCallback(() => {
    dispatch({ type: CalculatorActionType.CLEAR });
  }, []);

  const handleMemoryStore = useCallback(() => {
    dispatch({ type: CalculatorActionType.MEMORY_STORE });
  }, []);

  const handleMemoryRecall = useCallback(() => {
    dispatch({ type: CalculatorActionType.MEMORY_RECALL });
  }, []);

  const handleMemoryAdd = useCallback(() => {
    dispatch({ type: CalculatorActionType.MEMORY_ADD });
  }, []);

  const handleMemorySubtract = useCallback(() => {
    dispatch({ type: CalculatorActionType.MEMORY_SUBTRACT });
  }, []);

  const handleMemoryClear = useCallback(() => {
    dispatch({ type: CalculatorActionType.MEMORY_CLEAR });
  }, []);

  const openTapeFromLogo = useCallback(() => {
    setShowTape(true);
  }, []);

  const handleDimension = useCallback((dimension: 1 | 2 | 3) => {
    dispatch({ type: CalculatorActionType.SET_DIMENSION, payload: dimension });
  }, []);

  // Keyboard Event Listener
  // Optimized: depends ONLY on dispatch, which is stable. 
  // Should NOT re-attach on every state change.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      if (/^[0-9]$/.test(key)) { e.preventDefault(); dispatch({ type: CalculatorActionType.NUMBER, payload: key }); return; }
      if (key === '.' || key === ',') { e.preventDefault(); dispatch({ type: CalculatorActionType.DECIMAL }); return; }
      if (key === '+') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Add }); return; }
      if (key === '-') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Subtract }); return; }
      if (key === '*' || key.toLowerCase() === 'x') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Multiply }); return; }
      if (code === 'NumpadDivide') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Divide }); return; }
      if (key === '/') { e.preventDefault(); dispatch({ type: CalculatorActionType.FRACTION }); return; }
      if (key === 'Enter' || key === '=') { e.preventDefault(); dispatch({ type: CalculatorActionType.EQUAL }); return; }
      if (key === 'Backspace') { e.preventDefault(); dispatch({ type: CalculatorActionType.BACKSPACE }); return; }
      if (key === 'Escape' || key === 'Delete') { e.preventDefault(); dispatch({ type: CalculatorActionType.CLEAR }); return; }
      if (key.toLowerCase() === 'f') { e.preventDefault(); dispatch({ type: CalculatorActionType.UNIT, payload: 'feet' }); return; }
      if (key.toLowerCase() === 'i') { e.preventDefault(); dispatch({ type: CalculatorActionType.UNIT, payload: 'inch' }); return; }
      if (key.toLowerCase() === 'y') { e.preventDefault(); dispatch({ type: CalculatorActionType.UNIT, payload: 'yard' }); return; }
      if (key.toLowerCase() === 'c') { e.preventDefault(); dispatch({ type: CalculatorActionType.CONVERSION }); return; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array as dispatch is stable

  const isBuilding = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
  const displayData = isBuilding
    ? builderToDisplay(state.builder, state.inputBuffer, state.preferredUnit)
    : formatConstructionUnit(
      state.displayValue,
      state.convertedUnit,
      state.convertedDimension,
      state.activeDimension,
      state.preferredUnit,
      state.isUnitless,
      fractionDenominator,
      normalDecimalPlaces,
      engineeringDecimalPlaces
    );

  return (
    <div className={`flex min-h-[100dvh] w-full select-none items-center justify-center bg-[#e7edf2] p-3 font-display text-[#101820] sm:p-6 dark:bg-[#0d141a] dark:text-white ${visualTheme === 'aero' ? 'aero-glass-background' : ''}`}>
      <div className={`calculator-shell w-full overflow-hidden rounded-[30px] bg-white shadow-2xl dark:bg-[#171e24] ${visualTheme === 'aero' ? 'aero-glass-surface' : ''} ${isLandscape ? 'max-w-[1100px] h-[min(560px,calc(100dvh-32px))] flex-row' : 'max-w-[492px] h-[calc(100dvh-24px)] sm:h-[850px] sm:max-h-[90dvh] flex-col'} flex`}>
        <section className={`${isLandscape ? 'w-[52%] h-full pb-6' : 'flex-[4.8] pb-4'} min-h-0 px-6 pt-5 flex flex-col ${visualTheme === 'aero' ? 'aero-glass-display-section' : ''}`}>
          <div className="relative h-12 mb-3 shrink-0">
            <button type="button" onClick={openTapeFromLogo} className={`absolute left-1/2 top-0 z-10 h-12 w-64 -translate-x-1/2 rounded-full bg-[#363636] px-3 flex items-center justify-center shadow-inner ${visualTheme === 'aero' ? 'aero-glass-logo' : ''}`} title="Geçmiş işlemler için dokunun" aria-label="Geçmiş işlemlerini açmak için dokunun">
              <img src="./construction-calc-logo.png" alt="Construction Calc" className="h-10 w-52 object-contain" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Ayarları aç"
              className={`absolute right-0 top-0 z-20 h-11 w-11 rounded-lg border border-[#c7d4e0] bg-[#e7edf2] text-2xl leading-none text-[#526274] active:translate-y-px dark:border-[#2a3b4e] dark:bg-[#252d36] dark:text-[#c0cad7] ${visualTheme === 'aero' ? 'aero-glass-control' : ''}`}
            >
              ⚙
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-end">
          <Display value={displayData} onBackspace={handleBackspace} memoryActive={state.memoryHasValue} aeroGlass={visualTheme === 'aero'} />
          </div>
        </section>

        <section className={`${isLandscape ? 'w-[48%] h-full border-l border-[#c7d4e0] px-3 py-4 justify-center dark:border-[#1b3446]' : 'flex-[5.2] border-t border-[#c7d4e0] px-3 pb-4 pt-0 dark:border-[#1b3446]'} min-h-0 bg-[#f1f5f8] flex flex-col dark:bg-[#151b20] ${visualTheme === 'aero' ? 'aero-glass-keypad' : ''}`}>
          <div
            className={`grid grid-cols-5 grid-rows-5 gap-2 min-h-0 ${isLandscape ? 'aspect-square h-auto self-center' : 'w-full h-[96%] mt-auto'}`}
            style={isLandscape ? { width: 'min(100%, calc(100dvh - 80px))' } : undefined}
          >
            <CalculatorButton label="Yds" type={ButtonType.Primary} onClick={() => handleUnit('yard')} />
            <CalculatorButton label="Feet" type={ButtonType.Primary} onClick={() => handleUnit('feet')} />
            <CalculatorButton label="Inch" type={ButtonType.Primary} onClick={() => handleUnit('inch')} />
            <CalculatorButton label="/" type={ButtonType.Primary} onClick={handleFractionSlash} />
            <CalculatorButton label="Clear" type={ButtonType.Primary} onClick={handleClear} />

            <CalculatorButton label="Conv" type={ButtonType.Accent} onClick={handleConv} />
            <CalculatorButton label="7" onClick={() => handleNumber('7')} />
            <CalculatorButton label="8" onClick={() => handleNumber('8')} />
            <CalculatorButton label="9" onClick={() => handleNumber('9')} />
            <CalculatorButton label="÷" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Divide)} />

            <CalculatorButton label="Store" type={ButtonType.Memory} onClick={handleMemoryStore} />
            <CalculatorButton label="4" onClick={() => handleNumber('4')} />
            <CalculatorButton label="5" onClick={() => handleNumber('5')} />
            <CalculatorButton label="6" onClick={() => handleNumber('6')} />
            <CalculatorButton label="×" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Multiply)} />

            <CalculatorButton label="Rcl" type={ButtonType.Memory} onClick={handleMemoryRecall} />
            <CalculatorButton label="1" onClick={() => handleNumber('1')} />
            <CalculatorButton label="2" onClick={() => handleNumber('2')} />
            <CalculatorButton label="3" onClick={() => handleNumber('3')} />
            <CalculatorButton label="−" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Subtract)} />

            <CalculatorButton label="M+" type={ButtonType.Memory} onClick={handleMemoryAdd} />
            <CalculatorButton label="0" onClick={() => handleNumber('0')} />
            <CalculatorButton label="." onClick={handleDecimal} />
            <CalculatorButton label="=" type={ButtonType.Function} onClick={handleEqual} />
            <CalculatorButton label="+" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Add)} />
          </div>
        </section>
      </div>
      {showTape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowTape(false)}>
          <div className="w-full max-w-sm max-h-[75dvh] overflow-hidden rounded-2xl border border-[#c7d4e0] bg-white shadow-2xl dark:border-[#2b3d50] dark:bg-[#202830]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#cbd8e3] px-5 py-4 dark:border-[#334454]">
              <h2 className="text-lg font-bold text-[#17212b] dark:text-white">Tape / Geçmiş</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => dispatch({ type: CalculatorActionType.TAPE_CLEAR })} className="rounded-lg bg-[#e1e8ee] px-2.5 py-1.5 text-xs font-bold text-[#3a4a58] dark:bg-[#394554] dark:text-[#d8e0e8]">Temizle</button>
                <button type="button" onClick={() => setShowTape(false)} className="rounded-full bg-[#d8e2eb] px-3 py-1 text-lg text-[#3a4a58] dark:bg-[#34465d] dark:text-white">×</button>
              </div>
            </div>
            <div className="max-h-[60dvh] overflow-y-auto p-3">
              {state.tape.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-[#687887] dark:text-[#94a2b0]">Henüz kayıt yok. Bir işlem tamamlayın.</p>
              ) : (
                <div className="space-y-2">
                  {[...state.tape].reverse().map((entry, reverseIndex) => {
                    const index = state.tape.length - 1 - reverseIndex;
                    return (
                      <button key={`${entry.expression}-${index}`} type="button" onClick={() => { dispatch({ type: CalculatorActionType.TAPE_RECALL, payload: index }); setShowTape(false); }} className="w-full rounded-xl bg-[#eef3f7] px-4 py-3 text-left transition-colors hover:bg-[#e1e8ee] dark:bg-[#171e24] dark:hover:bg-[#26333f]">
                        <div className="font-mono text-xs text-[#647482] dark:text-[#9aa8b6]">{entry.expression}</div>
                        <div className="mt-1 flex items-center justify-between"><span className="font-mono text-lg text-[#17212b] dark:text-white">{Number(entry.result.toFixed(6))}</span><span className="text-[10px] font-bold tracking-wider text-[#19ad9b]">{entry.dimension === 3 ? 'CB' : entry.dimension === 2 ? 'SQ' : ''}</span></div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <UpdateModal
        isOpen={showUpdateModal}
        version={appVersion}
        releaseNotes={updateRelease?.body || ''}
        onConfirm={handleUpdateConfirm}
        onCancel={handleUpdateCancel}
        isDownloading={isDownloading}
        progress={downloadProgress}
        error={updateError}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        darkMode={darkMode}
        toggleTheme={() => setDarkMode(!darkMode)}
        visualTheme={visualTheme}
        onVisualThemeChange={handleVisualThemeChange}
        fractionDenominator={fractionDenominator}
        onFractionDenominatorChange={handleFractionDenominatorChange}
        normalDecimalPlaces={normalDecimalPlaces}
        onNormalDecimalPlacesChange={handleNormalDecimalPlacesChange}
        engineeringDecimalPlaces={engineeringDecimalPlaces}
        onEngineeringDecimalPlacesChange={handleEngineeringDecimalPlacesChange}
        orientation={orientation}
        onOrientationChange={handleOrientationChange}
        onCheckForUpdates={runUpdateCheck}
        onStartUpdate={startSettingsUpdate}
        version="v2.0.2"
      />
    </div>
  );
}
