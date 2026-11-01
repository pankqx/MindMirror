
import { motion, useReducedMotion } from "framer-motion";

type WeatherProps = {
  kind: "clear" | "clouds" | "rain" | "storm";
  title: string;
  message: string;
};

export default function Weather({
  kind,
  title,
  message,
}: WeatherProps) {

  const reducedMotion = useReducedMotion();

  const rainCount = kind === "storm" ? 7 : 4;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">

      <div className="relative mx-auto w-full max-w-[260px] h-[210px] overflow-hidden rounded-t-[130px] rounded-b-2xl bg-cream flex items-center justify-center">

        <svg
          viewBox="0 0 260 210"
          className="w-full h-full"
          role="img"
          aria-label={`${kind} weather illustration`}
        >

          {/* SUN */}

          {(kind === "clear" || kind === "clouds") && (
            <motion.circle
              cx="130"
              cy="85"
              r="35"
              fill="#F5C66B"
              animate={
                reducedMotion
                  ? {}
                  : {
                      scale: [1, 1.08, 1],
                      opacity: [0.8, 1, 0.8],
                    }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />
          )}

          {/* CLOUDS */}

          {(kind === "clouds" ||
            kind === "rain" ||
            kind === "storm") && (

            <motion.g
              animate={
                reducedMotion
                  ? {}
                  : { x: [-4, 4, -4] }
              }
              transition={{
                duration: 6,
                repeat: Infinity,
              }}
            >

              <path
                d="M55 125 C40 125 35 105 50 95 C55 70 90 68 105 90 C125 75 150 90 150 110 C170 120 160 140 145 140 H60 Z"
                fill={kind === "storm" ? "#555C75" : "#B9C9CF"}
              />

              <path
                d="M105 125 C95 105 115 90 130 95 C140 70 175 75 185 100 C205 105 205 130 185 140 H110 Z"
                fill={kind === "storm" ? "#737C91" : "#D7E1E3"}
              />

            </motion.g>
          )}

          {/* RAIN */}

          {(kind === "rain" || kind === "storm") && (

            <motion.g
              animate={
                reducedMotion
                  ? {}
                  : { y: [0, 12, 0] }
              }
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              stroke={kind === "storm" ? "#4F5BD5" : "#8FB9A8"}
              strokeWidth="3"
              strokeLinecap="round"
            >

              {Array.from(
                { length: rainCount },
                (_, i) => (
                  <line
                    key={i}
                    x1={70 + i * 20}
                    y1="150"
                    x2={65 + i * 20}
                    y2="165"
                  />
                )
              )}

            </motion.g>
          )}

          {/* CLEAR WEATHER DETAILS */}

          {kind === "clear" && (
            <g fill="#F5C66B">
              <circle cx="45" cy="45" r="3" />
              <circle cx="210" cy="55" r="4" />
              <circle cx="205" cy="170" r="3" />
            </g>
          )}

        </svg>

      </div>

      <div className="text-center mt-5">

        <h2 className="text-xl font-extrabold text-ink">
          {title}
        </h2>

        <p className="text-gray-500 mt-2">
          {message}
        </p>

      </div>

    </div>
  );
}
