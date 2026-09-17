
import React from 'react';
import { FormattedValue } from '../types';

interface DisplayProps {
    value: FormattedValue;
    onBackspace: () => void; // Add backspace handler prop
    memoryActive?: boolean;
    aeroGlass?: boolean;
}

const Display: React.FC<DisplayProps> = ({ value, onBackspace, memoryActive = false, aeroGlass = false }) => {
    const { yard, feet, inch, numerator, denominator, isNegative, showFeetLabel, showInchLabel, showYardLabel, showDash, inputBuffer, secondaryDisplay, dimension, dimensionLabel } = value;

    // We only render parts that have value or are active
    const hasFeet = feet !== 0 || showFeetLabel;
    // If numerator exists or label is forced, we ensure the inch section renders.
    const hasInch = inch !== 0 || showInchLabel;
    // Yard is usually exclusive or primary, but we'll render it if active
    const hasYard = showYardLabel; // Always show if explicitly set

    // Special case: if input buffer is active for first number and we aren't showing labels yet
    const isSimpleNumber = !showFeetLabel && !showInchLabel && !showYardLabel && !showDash && numerator === 0;

    const dimPrefix = dimension === 2 ? 'SQ ' : (dimension === 3 ? 'CB ' : '');
    const dimensionValue = yard !== 0 || showYardLabel ? yard : (inch !== 0 || showInchLabel ? inch : feet);

    return (
        <div
            onClick={onBackspace}
            className={`w-full flex-1 min-h-[160px] rounded-xl border border-[#c6d5e2] bg-[#f8fafc] px-5 py-4 shadow-inner relative flex flex-col justify-between overflow-hidden cursor-pointer active:bg-[#eef3f7] dark:border-[#16304a] dark:bg-[#0d1114] dark:active:bg-[#10161b] ${aeroGlass ? 'aero-glass-display' : ''}`}
        >
            <div className="flex justify-between items-start w-full h-6 text-[#85909d] text-[10px] font-mono tracking-[0.16em] uppercase">
                <span className="flex items-center gap-2">
                    {memoryActive && <span className="rounded bg-[#0b3aa5] px-1.5 py-0.5 text-[9px] font-bold text-white tracking-normal">M</span>}
                    {inputBuffer ? 'ENTRY' : 'RESULT'}
                </span>
            </div>

            <div className="flex flex-col h-full justify-end">
                {/* Main Numbers (Top Row) */}
                <div className="flex items-end justify-end w-full select-none pb-1">

                    {dimension > 1 && dimensionLabel ? (
                        <div className="flex w-full flex-col items-end justify-end">
                                <span className="text-6xl sm:text-[5rem] font-mono text-[#17212b] break-all text-right leading-tight dark:text-[#f1f3f6]">
                                {isNegative ? '-' : ''}{dimensionValue}
                            </span>
                            <span className="mt-2 text-xl sm:text-2xl font-sans font-medium tracking-wide text-[#f1f3f6]">
                                {dimensionLabel}
                            </span>
                        </div>
                    ) : isSimpleNumber ? (
                            <span className="text-6xl sm:text-[5rem] font-mono text-[#17212b] break-all text-right leading-tight dark:text-[#f1f3f6]">
                            {/* If typing a decimal, inputBuffer might be "5.", show that directly if active */}
                            {inputBuffer ? inputBuffer : feet}
                        </span>
                    ) : (
                        <div className="flex items-end justify-end gap-4 text-[#17212b] sm:gap-5 dark:text-[#f1f3f6]">

                            {isNegative && (
                                <span className="mr-2 text-4xl font-mono text-[#697887] dark:text-[#8993a0]">-</span>
                            )}

                            {/* Yard */}
                            {hasYard && (
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl sm:text-[4rem] font-mono leading-none">
                                        {yard}
                                    </span>
                                    <span className={`mt-1 text-[10px] font-bold tracking-widest text-[#667789] dark:text-[#8793a1] ${showYardLabel ? 'opacity-100' : 'opacity-0'}`}>
                                        {dimPrefix}YARD
                                    </span>
                                </div>
                            )}

                            {/* Dash Separator (Only if mixing Yards and Feet, or Feet and Inches) */}
                            {showDash && hasYard && (showFeetLabel || hasFeet) && (
                                <div className="flex flex-col justify-start h-[3.5rem] sm:h-[4rem] lg:h-[5rem]">
                                <span className="self-center text-2xl font-mono text-[#71808e] dark:text-[#5d6670]">-</span>
                                </div>
                            )}


                            {/* Feet */}
                            {((hasFeet || showFeetLabel) && !showYardLabel) && (
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl sm:text-[4rem] font-mono leading-none">
                                        {feet}
                                    </span>
                                    <span className={`mt-1 text-[10px] font-bold tracking-widest text-[#667789] dark:text-[#8793a1] ${showFeetLabel ? 'opacity-100' : 'opacity-0'}`}>
                                        {dimPrefix}FEET
                                    </span>
                                </div>
                            )}

                            {/* Dash Separator */}
                            {showDash && !hasYard && (
                                <div className="flex flex-col justify-start h-[3.5rem] sm:h-[4rem] lg:h-[5rem]">
                                    <span className="self-center text-2xl font-mono text-[#71808e] dark:text-[#5d6670]">-</span>
                                </div>
                            )}

                            {/* Inches */}
                            {(hasInch || showInchLabel) && (
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl sm:text-[4rem] font-mono leading-none">
                                        {inch}
                                    </span>
                                    <span className={`mt-1 text-[10px] font-bold tracking-widest text-[#667789] dark:text-[#8793a1] ${showInchLabel ? 'opacity-100' : 'opacity-0'}`}>
                                        {dimPrefix}INCH
                                    </span>
                                </div>
                            )}

                            {/* Fraction */}
                            {numerator > 0 && (
                                <div className="flex flex-col items-start justify-end self-end mb-0.5 ml-1">
                                    <div className="flex flex-col items-center leading-none font-mono">
                                        <span className="mb-0.5 border-b border-[#64707d] px-1 text-xl sm:text-2xl">
                                            {numerator}
                                        </span>
                                        <span className="text-xl sm:text-2xl px-1">
                                            {denominator === 0 ? '' : denominator}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Secondary Display (Bottom Row) - Converted Value */}
                <div className="mt-2 flex h-10 w-full items-end justify-end border-t border-[#cbd8e3] pt-1 dark:border-[#1b2a38]">
                    <span className="font-mono text-2xl tracking-wider text-[#657483] dark:text-[#7d8793]">
                        {secondaryDisplay}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Display);
