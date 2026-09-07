import React, { useState, useRef } from 'react';
import { RotateCcw, Check, Lock, Hash } from 'lucide-react';

const DOTS = [
  { id: 1, row: 0, col: 0, x: 25, y: 25 },
  { id: 2, row: 0, col: 1, x: 75, y: 25 },
  { id: 3, row: 0, col: 2, x: 125, y: 25 },
  { id: 4, row: 1, col: 0, x: 25, y: 75 },
  { id: 5, row: 1, col: 1, x: 75, y: 75 },
  { id: 6, row: 1, col: 2, x: 125, y: 75 },
  { id: 7, row: 2, col: 0, x: 25, y: 125 },
  { id: 8, row: 2, col: 1, x: 75, y: 125 },
  { id: 9, row: 2, col: 2, x: 125, y: 125 }
];

export default function PatternLockInput({ value = [], onChange }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef(null);

  const selectedDots = Array.isArray(value) ? value : [];

  const handleDotInteract = (dotId) => {
    if (!selectedDots.includes(dotId)) {
      const next = [...selectedDots, dotId];
      onChange?.(next);
    }
  };

  const handlePointerDown = (dotId) => {
    setIsDrawing(true);
    handleDotInteract(dotId);
  };

  const handlePointerEnter = (dotId) => {
    if (isDrawing) {
      handleDotInteract(dotId);
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    onChange?.([]);
  };

  // Coordenadas de los puntos seleccionados para trazar las líneas SVG
  const getLinePoints = () => {
    return selectedDots.map(id => {
      const dot = DOTS.find(d => d.id === id);
      return dot ? { x: dot.x, y: dot.y } : null;
    }).filter(Boolean);
  };

  const linePoints = getLinePoints();

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-3 flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#FF5500]" />
          Patrón 3x3 de Desbloqueo
        </span>
        {selectedDots.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Limpiar trazo"
          >
            <RotateCcw className="w-3 h-3 text-[#FF5500]" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Grid Interactivo SVG */}
      <div 
        className="relative w-[150px] h-[150px] bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-inner touch-none cursor-crosshair flex items-center justify-center"
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg 
          ref={svgRef}
          viewBox="0 0 150 150" 
          className="w-full h-full"
        >
          {/* Líneas entre puntos conectados */}
          {linePoints.length > 1 && (
            <polyline
              points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#FF5500"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_6px_#FF5500]"
            />
          )}

          {/* Renderizado de los 9 nodos */}
          {DOTS.map((dot) => {
            const isSelected = selectedDots.includes(dot.id);
            const orderIndex = selectedDots.indexOf(dot.id);

            return (
              <g 
                key={dot.id}
                onPointerDown={() => handlePointerDown(dot.id)}
                onPointerEnter={() => handlePointerEnter(dot.id)}
                className="cursor-pointer"
              >
                {/* Zona de toque amplia invisible */}
                <circle 
                  cx={dot.x} 
                  cy={dot.y} 
                  r="18" 
                  fill="transparent" 
                />

                {/* Anillo exterior */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isSelected ? "9" : "6"}
                  fill={isSelected ? "rgba(255, 85, 0, 0.25)" : "#27272A"}
                  stroke={isSelected ? "#FF5500" : "#3F3F46"}
                  strokeWidth={isSelected ? "2" : "1.5"}
                  className="transition-all duration-150"
                />

                {/* Centro del nodo */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r="3.5"
                  fill={isSelected ? "#FF5500" : "#71717A"}
                  className={isSelected ? "drop-shadow-[0_0_4px_#FF5500]" : ""}
                />

                {/* Número de orden si está seleccionado */}
                {isSelected && (
                  <text
                    x={dot.x}
                    y={dot.y - 11}
                    textAnchor="middle"
                    fill="#FF5500"
                    fontSize="9"
                    fontWeight="bold"
                    className="font-mono pointer-events-none"
                  >
                    {orderIndex + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Secuencia visual */}
      <div className="mt-2 text-center w-full">
        {selectedDots.length > 0 ? (
          <div className="text-[11px] font-mono text-zinc-300 bg-zinc-900/90 py-1 px-2 rounded-lg border border-zinc-800 flex items-center justify-center gap-1">
            <span className="text-zinc-500 font-bold">Secuencia:</span>
            <span className="text-[#FF5500] font-bold">
              {selectedDots.join(' → ')}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-zinc-500 italic">
            Dibujá o hacé clic en los nodos en orden
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Componente miniatura estático para imprimir el patrón en el ticket o ver en la lista
 */
export function PatternThumbnail({ sequence = [], size = 70, isPrint = false }) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return (
      <span className={isPrint ? "text-gray-500 text-xs" : "text-zinc-500 text-xs italic"}>
        Sin patrón
      </span>
    );
  }

  const linePoints = sequence.map(id => {
    const dot = DOTS.find(d => d.id === id);
    return dot ? { x: dot.x, y: dot.y } : null;
  }).filter(Boolean);

  const strokeColor = isPrint ? "#000000" : "#FF5500";
  const nodeFill = isPrint ? "#000000" : "#FF5500";
  const inactiveFill = isPrint ? "#cccccc" : "#3F3F46";

  return (
    <div className="flex flex-col items-center">
      <svg 
        viewBox="0 0 150 150" 
        style={{ width: `${size}px`, height: `${size}px` }}
        className={isPrint ? "border border-gray-400 rounded bg-white" : "border border-zinc-800 rounded-lg bg-zinc-950"}
      >
        {linePoints.length > 1 && (
          <polyline
            points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={strokeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {DOTS.map((dot) => {
          const isSelected = sequence.includes(dot.id);
          const orderIdx = sequence.indexOf(dot.id);
          return (
            <g key={dot.id}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={isSelected ? "8" : "4"}
                fill={isSelected ? nodeFill : inactiveFill}
              />
              {isSelected && (
                <text
                  x={dot.x}
                  y={dot.y - 10}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="12"
                  fontWeight="bold"
                >
                  {orderIdx + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <span className={`text-[10px] font-mono mt-0.5 ${isPrint ? "text-black font-bold" : "text-[#FF5500]"}`}>
        {sequence.join('-')}
      </span>
    </div>
  );
}
