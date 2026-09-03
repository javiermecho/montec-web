import React from 'react';

/**
 * Logotipo oficial de montec:
 * Utiliza exactamente la imagen oficial de marca completa:
 * 'mon' en naranja neón con el botón de encendido (⏻) en la 'o',
 * y 'tec' en blanco puro con su tipografía y diseño original.
 */
export default function MontecLogo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-12',
    xl: 'h-14 sm:h-16',
  };

  const currentHeight = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/logo-montec.png"
        alt="montec"
        className={`${currentHeight} w-auto object-contain transition-all duration-200 hover:opacity-95`}
      />
    </div>
  );
}
