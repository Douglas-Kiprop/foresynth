"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Bot } from 'lucide-react';

interface ElasticHueSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
}

const ElasticHueSlider: React.FC<ElasticHueSliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 360,
    step = 1,
    label = 'Adjust Hue',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const progress = ((value - min) / (max - min));
    const thumbPosition = progress * 100; // Percentage

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    return (
        <div className="scale-75 relative w-full max-w-xs flex flex-col items-center opacity-50 hover:opacity-100 transition-opacity" ref={sliderRef}>
            {label && <label htmlFor="hue-slider-native" className="text-gray-400 text-xs mb-1 font-mono">{label}</label>}
            <div className="relative w-full h-5 flex items-center">
                <input
                    id="hue-slider-native"
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseUp}
                    className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-20"
                    style={{ WebkitAppearance: 'none' }}
                />
                <div className="absolute left-0 w-full h-1 bg-gray-800 rounded-full z-0"></div>
                <div
                    className="absolute left-0 h-1 bg-primary rounded-full z-10"
                    style={{ width: `${thumbPosition}%` }}
                ></div>
                <motion.div
                    className="absolute top-1/2 transform -translate-y-1/2 z-30 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    style={{ left: `${thumbPosition}%` }}
                    animate={{ scale: isDragging ? 1.2 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: isDragging ? 20 : 30 }}
                >
                </motion.div>
            </div>
        </div>
    );
};

interface FeatureItemProps {
    name: string;
    value: string;
    position: string;
}

interface LightningProps {
    hue?: number;
    xOffset?: number;
    speed?: number;
    intensity?: number;
    size?: number;
}

const Lightning: React.FC<LightningProps> = ({
    hue = 190, // Default Cyanish
    xOffset = 0,
    speed = 1,
    intensity = 1,
    size = 1,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const gl = canvas.getContext("webgl");
        if (!gl) return;

        const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

        const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      
      #define OCTAVE_COUNT 10
      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }
      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }
      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }
      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }
      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));
          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }
      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }
      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;
          uv.x += uXOffset;
          uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
          float dist = abs(uv.x);
          vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
          vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
          col = pow(col, vec3(1.0));
          fragColor = vec4(col, 1.0);
      }
      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

        const compileShader = (source: string, type: number): WebGLShader | null => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
        gl.useProgram(program);

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(program, "aPosition");
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
        const iTimeLocation = gl.getUniformLocation(program, "iTime");
        const uHueLocation = gl.getUniformLocation(program, "uHue");
        const uXOffsetLocation = gl.getUniformLocation(program, "uXOffset");
        const uSpeedLocation = gl.getUniformLocation(program, "uSpeed");
        const uIntensityLocation = gl.getUniformLocation(program, "uIntensity");
        const uSizeLocation = gl.getUniformLocation(program, "uSize");

        const startTime = performance.now();
        const render = () => {
            resizeCanvas();
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
            const currentTime = performance.now();
            gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0);
            gl.uniform1f(uHueLocation, hue);
            gl.uniform1f(uXOffsetLocation, xOffset);
            gl.uniform1f(uSpeedLocation, speed);
            gl.uniform1f(uIntensityLocation, intensity);
            gl.uniform1f(uSizeLocation, size);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
        return () => { window.removeEventListener("resize", resizeCanvas); };
    }, [hue, xOffset, speed, intensity, size]);

    return <canvas ref={canvasRef} className="w-full h-full relative opacity-80 mix-blend-screen" />;
};

const FeatureItem: React.FC<FeatureItemProps> = ({ name, value, position }) => {
    return (
        <div className={`absolute ${position} z-10 group transition-all duration-300 hover:scale-110 cursor-default`}>
            <div className="flex items-center gap-2 relative">
                <div className="relative">
                    <div className="w-2 h-2 bg-primary rounded-full group-hover:animate-pulse"></div>
                    <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="relative">
                    <div className="font-orbitron font-medium text-foreground group-hover:text-primary transition-colors duration-300">{name}</div>
                    <div className="text-foreground/50 text-xs group-hover:text-foreground/80 transition-colors duration-300">{value}</div>
                    <div className="absolute -inset-2 bg-primary/5 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
            </div>
        </div>
    );
};

export const HeroSection: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [lightningHue, setLightningHue] = useState(190); // Default Cyan

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.3, delayChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="relative w-full min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">

            {/* Background elements */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-background/80"></div>
                <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-primary/10 to-blue-600/5 blur-[120px]"></div>

                {/* Lightning Layer */}
                <div className="absolute top-0 w-full left-1/2 transform -translate-x-1/2 h-full z-0">
                    <Lightning hue={lightningHue} xOffset={0} speed={1.2} intensity={0.5} size={1.8} />
                </div>

                {/* Planet/Sphere Effect */}
                <div className="z-10 absolute top-[60%] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] backdrop-blur-sm rounded-full bg-[radial-gradient(circle_at_25%_90%,_rgba(6,182,212,0.1)_15%,_transparent_70%)] border border-primary/5"></div>
            </motion.div>

            {/* Main Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-screen flex flex-col">

                {/* Navigation / Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="px-6 py-4 flex justify-between items-center z-50">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md shadow-neon">
                        <Bot className="w-5 h-5 text-primary" />
                        <span className="text-sm font-orbitron text-primary tracking-widest hidden sm:inline">FORESYNTH</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link href="https://docs.polymarket.com/developers/builders/builder-intro" target="_blank" className="hidden md:block px-4 py-2 text-sm text-foreground/60 hover:text-primary transition-colors font-orbitron">
                            DOCS
                        </Link>
                        <Link href="/watchlists" className="px-6 py-2 bg-primary/10 border border-primary/50 text-primary hover:bg-primary hover:text-black transition-all duration-300 rounded-sm font-orbitron tracking-wider text-sm shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            LAUNCH APP
                        </Link>
                    </div>
                </motion.div>

                {/* Feature Nodes */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full absolute inset-0 z-10 pointer-events-none">
                    <motion.div variants={itemVariants}><FeatureItem name="Polymarket" value="Data Source" position="left-[10%] sm:left-[15%] top-[25%]" /></motion.div>
                    <motion.div variants={itemVariants}><FeatureItem name="AI Agents" value="Analysis" position="left-[5%] sm:left-[20%] top-[60%]" /></motion.div>
                    <motion.div variants={itemVariants}><FeatureItem name="Insights" value="Predictive" position="right-[5%] sm:right-[20%] top-[65%]" /></motion.div>
                </motion.div>

                {/* Hero Content Center */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-30 flex flex-col items-center text-center justify-center flex-grow -mt-20">

                    <div className="mb-8">
                        <ElasticHueSlider value={lightningHue} onChange={setLightningHue} label="CUSTOMIZE ATMOSPHERE" />
                    </div>

                    <motion.div variants={itemVariants} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs text-foreground/60 font-mono">SYSTEM ONLINE • V1.0</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-6xl md:text-9xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-primary/50 to-transparent tracking-tighter drop-shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-4">
                        FORESYNTH
                    </motion.h1>

                    <motion.h2 variants={itemVariants} className="text-2xl md:text-4xl font-light font-rajdhani text-primary/80 tracking-[0.2em] mb-8 uppercase">
                        Predict. Trade. Profit.
                    </motion.h2>

                    <motion.p variants={itemVariants} className="text-foreground/60 max-w-xl text-lg mb-12 leading-relaxed">
                        The next-generation analytics platform for Polymarket.
                        Visualize hidden patterns and track smart money in real-time.
                    </motion.p>

                    <motion.div variants={itemVariants}>
                        <Link href="/watchlists" className="group relative px-10 py-5 bg-foreground text-background font-bold font-orbitron text-xl tracking-widest rounded-sm overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-3">
                            <span className="relative z-10">ENTER TERMINAL</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0 opacity-50" />
                        </Link>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
};
