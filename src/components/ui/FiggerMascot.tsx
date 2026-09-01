import React from "react";
import { cn } from "@/lib/utils";

interface FiggerMascotProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  isThinking?: boolean;
}

export function FiggerMascot({ className, isThinking = false, ...props }: FiggerMascotProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("drop-shadow-lg", className)}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            .animate-float {
              animation: float 3s ease-in-out infinite;
            }
            @keyframes wave {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-15deg); }
            }
            .animate-wave {
              animation: wave 2s ease-in-out infinite;
              transform-origin: 25px 75px;
            }
            @keyframes blink {
              0%, 96%, 98% { transform: scaleY(1); }
              97%, 100% { transform: scaleY(0.1); }
            }
            .animate-blink {
              animation: blink 4s infinite;
              transform-origin: center;
            }
          `}
        </style>
        <linearGradient id="figgerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#84cc16" /> {/* Lime green */}
          <stop offset="50%" stopColor="#f59e0b" /> {/* Amber */}
          <stop offset="100%" stopColor="#ea580c" /> {/* Orange */}
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#shadow)" className="animate-float">
        {/* Legs */}
        <rect x="75" y="140" width="10" height="25" fill="#65a30d" />
        <rect x="115" y="140" width="10" height="25" fill="#65a30d" />

        {/* Boots */}
        <path d="M 65 165 C 65 155 85 155 85 165 C 85 175 65 175 65 165 Z" fill="#78350f" />
        <path d="M 60 168 C 60 160 85 160 90 168 C 90 178 60 178 60 168 Z" fill="#522408" />
        
        <path d="M 105 165 C 105 155 125 155 125 165 C 125 175 105 175 105 165 Z" fill="#78350f" />
        <path d="M 100 168 C 100 160 125 160 130 168 C 130 178 100 178 100 168 Z" fill="#522408" />

        {/* Left Arm and Glove (Thumbs up, waving) */}
        <g className="animate-wave">
          <path d="M 40 100 Q 20 100 25 75" fill="none" stroke="#65a30d" strokeWidth="8" strokeLinecap="round" />
          <circle cx="25" cy="75" r="10" fill="#78350f" />
          <rect x="18" y="58" width="8" height="15" rx="4" fill="#78350f" /> {/* Thumb */}
        </g>
        
        {/* Right Arm (Resting on hip) */}
        <path d="M 160 100 Q 180 110 165 130" fill="none" stroke="#65a30d" strokeWidth="8" strokeLinecap="round" />
        
        {/* Right Glove */}
        <circle cx="165" cy="130" r="10" fill="#78350f" />

        {/* Body (Leaf shape) */}
        <path 
          d="M 100 40 C 170 40 170 100 140 145 C 100 160 50 145 40 100 C 25 50 70 40 100 40 Z" 
          fill="url(#figgerGrad)" 
        />
        
        {/* Circuit lines on body */}
        <path d="M 50 120 L 100 100 L 150 115" fill="none" stroke="#064e3b" strokeWidth="2" opacity="0.4" />
        <path d="M 100 40 L 95 100" fill="none" stroke="#064e3b" strokeWidth="2" opacity="0.4" />
        <circle cx="100" cy="100" r="4" fill="#064e3b" opacity="0.6" />
        <circle cx="150" cy="115" r="3" fill="#064e3b" opacity="0.6" />

        {/* Eyes Base */}
        <g className="animate-blink">
          <circle cx="82" cy="75" r="14" fill="white" />
          <circle cx="118" cy="75" r="14" fill="white" />

          {/* Pupils (Animated when thinking) */}
          <g className={isThinking ? "animate-pulse" : ""}>
            <circle cx={isThinking ? "85" : "82"} cy={isThinking ? "72" : "75"} r="6" fill="black" />
            <circle cx={isThinking ? "115" : "118"} cy={isThinking ? "72" : "75"} r="6" fill="black" />
            
            {/* Eye shines */}
            <circle cx={isThinking ? "87" : "84"} cy={isThinking ? "70" : "73"} r="2" fill="white" />
            <circle cx={isThinking ? "117" : "120"} cy={isThinking ? "70" : "73"} r="2" fill="white" />
          </g>
        </g>

        {/* Smile */}
        <path 
          d="M 80 95 Q 100 120 120 95 Q 100 110 80 95 Z" 
          fill="white" 
          stroke="black"
          strokeWidth="1"
        />
        {/* Tongue inside smile */}
        <path 
          d="M 90 105 Q 100 115 110 105 Z" 
          fill="#ef4444" 
        />

        {/* Hat */}
        <ellipse cx="100" cy="38" rx="60" ry="12" fill="#b45309" />
        <path d="M 65 38 L 75 10 C 80 5 120 5 125 10 L 135 38 Z" fill="#92400e" />
        {/* Hat Band */}
        <path d="M 72 30 Q 100 38 128 30 L 133 38 Q 100 45 67 38 Z" fill="#3f6212" />
        
        {/* FIG text on hat */}
        <text x="100" y="24" fill="white" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
          FIG
        </text>
      </g>
    </svg>
  );
}
