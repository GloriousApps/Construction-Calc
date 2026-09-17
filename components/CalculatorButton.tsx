
import React from 'react';
import { ButtonType } from '../types';

interface CalculatorButtonProps {
  label: string;
  type?: ButtonType;
  onClick: () => void;
  className?: string;
  cols?: number;
}

import { Haptics, ImpactStyle } from '@capacitor/haptics';

const CalculatorButton: React.FC<CalculatorButtonProps> = ({
  label,
  type = ButtonType.Neutral,
  onClick,
  className = '',
  cols = 1
}) => {

  const handleClick = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Ignore errors on platforms where not supported
    }
    onClick();
  };

  const baseClasses = "h-full w-full rounded-2xl font-bold shadow-[0_3px_0_rgba(0,0,0,0.18)] active:translate-y-px active:shadow-none transition-all flex items-center justify-center select-none";

  let typeClasses = "";
  let textClasses = "text-xl";

  switch (type) {
    case ButtonType.Primary:
      typeClasses = "bg-[#f3b9bc] hover:bg-[#eba7ab] text-[#5c1f24] dark:bg-[#9f3035] dark:hover:bg-[#b53b41] dark:text-white";
      textClasses = "text-sm uppercase tracking-wide";
      break;
    case ButtonType.Secondary:
      typeClasses = "bg-[#f7dfa0] hover:bg-[#efd18a] text-[#4a3500] dark:bg-[#ad8200] dark:hover:bg-[#c29300] dark:text-white";
      textClasses = "text-2xl";
      break;
    case ButtonType.Accent:
      typeClasses = "bg-[#a8ded6] hover:bg-[#91d3c9] text-[#084b44] dark:bg-[#08766b] dark:hover:bg-[#0b887b] dark:text-white";
      textClasses = "text-2xl";
      break;
    case ButtonType.Neutral:
      typeClasses = "bg-[#e7edf2] hover:bg-[#dbe4eb] text-[#18232e] dark:bg-[#242b33] dark:hover:bg-[#303944] dark:text-white";
      textClasses = "text-xl font-mono";
      break;
    case ButtonType.Memory:
      typeClasses = "bg-[#bfd0e7] hover:bg-[#aec4df] text-[#193655] dark:bg-[#17385f] dark:hover:bg-[#204a7b] dark:text-white";
      textClasses = "text-xl";
      break;
    case ButtonType.Danger:
      typeClasses = "bg-[#efb5b7] hover:bg-[#e5a1a4] text-[#5c1f24] dark:bg-[#8e292e] dark:hover:bg-[#a2343a] dark:text-white";
      textClasses = "text-sm uppercase tracking-wide";
      break;
    case ButtonType.Function:
      typeClasses = "bg-[#f6d0a1] hover:bg-[#edbf89] text-[#5d3000] dark:bg-[#aa5800] dark:hover:bg-[#c36700] dark:text-white";
      textClasses = "text-2xl";
      break;
  }

  return (
    <div
      className="min-h-0"
      style={{ gridColumn: cols > 1 ? `span ${cols} / span ${cols}` : undefined }}
    >
      <button
        onClick={handleClick}
        className={`aero-key aero-key-${type} ${baseClasses} ${typeClasses} ${textClasses} ${className}`}
      >
        {label}
      </button>
    </div>
  );
};

export default React.memo(CalculatorButton);
