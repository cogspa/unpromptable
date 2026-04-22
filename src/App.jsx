import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Environment, ContactShadows, useGLTF, Center } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, PencilLine, Sparkles, Eye, Lock, Globe, RotateCcw, Eraser, Download, Box, Loader2, CheckCircle2, ChevronRight, X } from "lucide-react";
import thromper2DImage from "./assets/thromper2D.png";
import thromper3DUrl from "./assets/Thromper3D.glb";
import piscador2DImage from "./assets/piscador2D.png";
import piscador3DUrl from "./assets/piscador3D.glb";
import cyberattion2DImage from "./assets/Cyberattion2D.png";
import cyberattion3DUrl from "./assets/cyberattion3d.glb";

const starterWorks = [
  {
    id: 1,
    title: "Thromper",
    artist: "Guest Artist",
    tags: ["surreal", "biomechanical", "creature"],
    visibility: "Public",
    image: thromper2DImage,
    shape: "spikes",
    modelUrl: thromper3DUrl,
    accent: "from-gold/20 to-sage/20",
  },
  {
    id: 2,
    title: "Piscador",
    artist: "Guest Artist",
    tags: ["industrial", "organic", "impossible object"],
    visibility: "Public",
    image: piscador2DImage,
    shape: "rings",
    modelUrl: piscador3DUrl,
    accent: "from-amber/20 to-gold/20",
  },
  {
    id: 3,
    title: "Cyberattion",
    artist: "Guest Artist",
    tags: ["abstract", "sculptural", "artifact"],
    visibility: "Private",
    image: cyberattion2DImage,
    shape: "stack",
    modelUrl: cyberattion3DUrl,
    accent: "from-sage/20 to-amber/20",
  },
];

function CustomModel({ url }) {
  const { scene } = useGLTF(url);
  const ref = useRef();
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Center ref={ref}>
      <primitive object={scene} scale={2} position={[0, -0.2, 0]} />
    </Center>
  );
}

function SpinningForm({ variant = "spikes" }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
      ref.current.rotation.x += delta * 0.15;
    }
  });

  if (variant === "rings") {
    return (
      <group ref={ref}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / (i + 2), i * 0.7, 0]}>
            <torusGeometry args={[1.1 + i * 0.22, 0.08, 24, 120]} />
            <meshStandardMaterial metalness={0.95} roughness={0.2} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.45, 64, 64]} />
          <meshStandardMaterial metalness={0.7} roughness={0.15} />
        </mesh>
      </group>
    );
  }

  if (variant === "stack") {
    return (
      <group ref={ref}>
        {[-0.9, -0.25, 0.45].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0.4 * i, 0.2 * i, 0.1 * i]}>
            <octahedronGeometry args={[0.85 - i * 0.12, 0]} />
            <meshStandardMaterial metalness={0.8} roughness={0.28} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial metalness={0.9} roughness={0.18} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, 0]}>
            <coneGeometry args={[0.12, 0.52, 12]} />
            <meshStandardMaterial metalness={0.85} roughness={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

function Viewer3D({ shape, modelUrl }) {
  return (
    <div className="h-[260px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <Canvas camera={{ position: [0, 0, 4.8], fov: 45 }}>
        <color attach="background" args={["#08090d"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 4]} intensity={2} />
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
            {modelUrl ? <CustomModel url={modelUrl} /> : <SpinningForm variant={shape} />}
          </Float>
          <Environment preset="city" />
          <ContactShadows position={[0, -1.7, 0]} opacity={0.45} scale={8} blur={2.5} far={3.5} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={3.5} maxDistance={7} />
      </Canvas>
    </div>
  );
}

function GalleryCard({ work }) {
  return (
    <motion.div
      layout
      className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${work.accent}`} />
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-white">{work.title}</h3>
              <p className="text-sm text-white/60">By {work.artist}</p>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
              {work.visibility === "Public" ? (
                <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Public</span>
              ) : (
                <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Private</span>
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <img src={work.image} alt={work.title} className="h-[260px] w-full object-cover" />
          </div>
          <div className="flex flex-wrap gap-2">
            {work.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Generated 3D View</p>
              <p className="text-sm text-white/60">Auto-rotating WebGL preview</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
              <Eye className="h-3.5 w-3.5" /> Interactive
            </span>
          </div>
          <Viewer3D shape={work.shape} modelUrl={work.modelUrl} />
          <div className="flex flex-wrap gap-2 text-xs text-white/60">
            <button className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/10">View Detail</button>
            <button className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/10">Share</button>
            <button className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/10">Remix Later</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DrawingCanvas({ onExport }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Draw directly on Unpromptable</h3>
          <p className="text-sm text-white/60">Sketch an impossible form, then send it to the 3D pipeline.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70">
            Brush
            <input
              type="range"
              min="1"
              max="18"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </label>
          <button onClick={clearCanvas} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
            <Eraser className="h-4 w-4" /> Clear
          </button>
          <button
            onClick={() => onExport(canvasRef.current.toDataURL("image/png"))}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" /> Generate from Sketch
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          className="h-[420px] w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-white/45">Sketch natively, then proceed to the API configuration or manual upload step.</p>
    </div>
  );
}

function UploadPanel({ onUpload }) {
  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-6 backdrop-blur">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Creation Entry Point</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Upload a drawing to generate a 3D object</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Start with a sketch, scan, or abstract doodle. Once uploaded, you can use the Meshy API to automatically convert it, or upload your own pre-made 3D file.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 min-w-max">
          <Upload className="h-4 w-4" /> Upload Drawing
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>
    </div>
  );
}

function CreationFlowDialog({ image, onCancel, onComplete }) {
  const [step, setStep] = useState("ask"); // "ask", "uploading", "meshy", "done"
  const [log, setLog] = useState("");

  const handleModelUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onComplete(url);
  };

  const startMeshyAPI = async () => {
    setStep("meshy");
    const steps = [
      "Authenticating with Meshy API...",
      "Analyzing sketch contours...",
      "Generating 3D voxel representation...",
      "Extracting mesh and interpolating surfaces...",
      "Applying base textures and finalizing GLB..."
    ];
    for (const msg of steps) {
      setLog(msg);
      await new Promise(r => setTimeout(r, 1200));
    }
    setStep("done");
    setTimeout(() => {
      // Return null to signify Meshy finished but we don't have a real payload.
      // The App will fallback to a generated aesthetic primitive for demo purposes.
      onComplete(null);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0b10] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
          <h2 className="text-lg font-semibold text-white tracking-tight">Pipeline Configuration</h2>
          <button onClick={onCancel} className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid md:grid-cols-[1fr_1.5fr] min-h-[360px]">
          <div className="border-r border-white/10 bg-white/[0.02] p-6 flex flex-col justify-center">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] font-semibold text-white/45">Source Sketch</p>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner">
              <img src={image} alt="Sketch" className="aspect-square w-full object-cover opacity-90" />
            </div>
          </div>
          
          <div className="p-6 relative">
            <AnimatePresence mode="wait">
              {step === "ask" && (
                <motion.div
                  key="ask"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6 pt-2"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-medium tracking-tight text-white">Select a 3D Method</h3>
                    <p className="mt-2 text-sm text-white/60 leading-relaxed">You have provided a drawing. The system requires a 3D model to complete the dual-view gallery pairing. How do you want to proceed?</p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      onClick={startMeshyAPI}
                      className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 hover:border-white/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-white text-base">Generate via Meshy API</div>
                          <div className="text-sm text-white/50 mt-0.5">Automatic Image-to-3D pipeline</div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/70" />
                    </button>

                    <button
                      onClick={() => setStep("uploading")}
                      className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 hover:border-white/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Box className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-white text-base">I have my own 3D model</div>
                          <div className="text-sm text-white/50 mt-0.5">Upload a GLB/GLTF file manually</div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/70" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5 flex flex-col h-full justify-center pb-8"
                >
                  <button onClick={() => setStep("ask")} className="self-start mb-2 px-3 py-1 -ml-3 rounded-md text-sm text-white/50 hover:text-white hover:bg-white/5 transition flex items-center gap-2">← Change Method</button>
                  <div>
                    <h3 className="text-xl font-medium tracking-tight text-white">Upload Associated Model</h3>
                    <p className="mt-1.5 text-sm text-white/50 leading-relaxed">Select the .glb or .gltf file you created from this sketch using an external tool (Blender, Nomad, etc).</p>
                  </div>
                  <label className="flex cursor-pointer flex-col flex-1 min-h-[140px] items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.02] transition hover:bg-white/[0.05] hover:border-white/40">
                    <Upload className="mb-3 h-8 w-8 text-white/40" />
                    <span className="text-sm font-medium text-white/80">Browse for file</span>
                    <span className="mt-1 text-xs text-white/30">GLB, GLTF up to 50MB</span>
                    <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleModelUpload} />
                  </label>
                </motion.div>
              )}

              {step === "meshy" && (
                <motion.div
                  key="meshy"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="absolute inset-0 flex h-full flex-col items-center justify-center text-center space-y-8 py-8"
                >
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                  </div>
                  <div className="w-full max-w-[80%]">
                    <div className="text-lg font-medium text-white mb-2">Meshy API Processing</div>
                    <div className="h-6 overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={log}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="text-sm text-blue-300/80"
                        >
                          {log}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex h-full flex-col items-center justify-center text-center space-y-5 py-12"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="text-xl font-medium tracking-tight text-white">Generation Complete!</div>
                    <div className="text-sm text-emerald-300/70 mt-1">Finalizing gallery entry...</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ManifestoDialog({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[32px] border border-sage/20 bg-[#0a0b10] shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-sage/10 px-8 py-5 bg-sage/5 shrink-0">
          <h2 className="text-2xl font-semibold text-gold tracking-tighter uppercase font-gunter">Project Manifesto</h2>
          <button onClick={onClose} className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-8 md:p-12 space-y-6 text-offwhite/80 leading-relaxed text-sm md:text-base overflow-y-auto custom-scrollbar">
          <p>
            <strong className="text-white">Unpromptable</strong> is an experimental art & technology project that explores how drawing can become a direct interface for materializing ideas that cannot be fully expressed through words. It begins from a simple premise: not all imagination is promptable. Many concepts are too abstract, emotional, surreal, subconscious, or visually specific to be described through language alone. Some ideas emerge first as gestures, distortions, marks, and forms. Unpromptable creates a system for those ideas to exist by translating drawings into three-dimensional objects and presenting them through both an interactive web platform and a physical participatory art experience.
          </p>
          <p>
            Unpromptable functions as a drawing-to-3D platform and WebGL-based gallery. Users begin either by uploading a drawing or by sketching directly within the site. That image is then sent through an image-to-3D generation pipeline, where it is transformed into a 3D object. The final work is presented in a dual-view format: one panel shows the original drawing, and the other shows the resulting 3D model rotating in a live browser-based viewer. Rather than hiding the source, Unpromptable emphasizes the relationship between raw visual thought and dimensional artifact, allowing viewers to witness the translation of an internal image into form.
          </p>
          <p>
            Beyond the web application, the project extends into the physical world through advanced 3D printing and interactive projection environments. Selected forms generated from user drawings would be materialized as tangible sculptural objects using contemporary 3D printing methods. These printed works would then become part of a live installation enhanced by responsive light, projection, and environmental media created in TouchDesigner. Through projection mapping, motion, and reactive visual systems, the sculptural objects become animated presences rather than static outputs. This creates an immersive environment in which the drawn, the digital, and the physical continuously interact.
          </p>
          <p>
            Unpromptable is not only a web app but a participatory art experience. It invites audiences to engage with the movement from consciousness to subconscious imagery and from imagination into manifestation. A sketch that begins as a fleeting internal form can move through multiple stages: hand-drawn mark, algorithmic translation, digital 3D object, physical print, and interactive light-based installation. The work is therefore about more than technical conversion; it is about revealing the path through which inner images become shareable, tangible, embodied art.
          </p>
          <p>
            The project is also rooted in the belief that culture exists beyond language. Many tools today are shaped around verbal command and text input, yet culture is often formed through image, symbol, ritual, memory, gesture, and the intermixing of lived influences that cannot be reduced to words. Its foundation is deeply connected to Los Angeles, a city defined by layered identities, migration, hybrid visual languages, speculative aesthetics, and constant cultural remixing.
          </p>
          <p>
            Support for this project would help develop both its technical and artistic dimensions: refining the browser-based drawing environment, integrating the image-to-3D workflow, developing the WebGL gallery, fabricating physical works through 3D printing, and building the TouchDesigner-based projection environment. Unpromptable ultimately aims to create a new space where the indescribable can be drawn, generated, manifested, and experienced as living physical art.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}


export default function App() {
  const [works, setWorks] = useState(starterWorks);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  
  // Creation Flow State
  const [pendingImage, setPendingImage] = useState(null);

  const filteredWorks = useMemo(() => {
    if (selectedFilter === "All") return works;
    if (selectedFilter === "Public") return works.filter((w) => w.visibility === "Public");
    if (selectedFilter === "Private") return works.filter((w) => w.visibility === "Private");
    return works;
  }, [works, selectedFilter]);

  const initiateCreation = (image) => {
    setShowDrawer(false); // Close drawing tool if open
    setPendingImage(image);
  };

  const finalizeCreation = (modelUrl) => {
    const shapes = ["spikes", "rings", "stack"];
    const accents = [
      "from-gold/20 to-sage/20",
      "from-amber/20 to-gold/20",
      "from-sage/20 to-amber/20",
    ];

    setWorks((prev) => [
      {
        id: Date.now(),
        title: `Untitled Form ${prev.length + 1}`,
        artist: "You",
        tags: ["new", "unpromptable", modelUrl ? "custom-upload" : "meshy-api"],
        visibility: "Private",
        image: pendingImage,
        shape: shapes[prev.length % shapes.length], // Fallback if no custom URL
        modelUrl: modelUrl,
        accent: accents[prev.length % accents.length],
      },
      ...prev,
    ]);
    
    setPendingImage(null);
  };

  return (
    <div className="min-h-screen bg-nearblack text-offwhite font-sans overflow-x-hidden relative">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[1] pointer-events-none opacity-50"
        src="/fastsketch-bg.mp4"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-nearblack/30 via-nearblack/40 to-nearblack/60 z-[2] pointer-events-none" />
      <div className="relative z-[3] mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 rounded-[32px] border border-sage/20 bg-sage/5 p-6 shadow-2xl backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="mt-1 font-gunter text-5xl font-normal tracking-widest text-gold drop-shadow-xl uppercase sm:text-6xl lg:text-7xl leading-none">
              Unpromptable
            </h1>
            <p className="mt-2 text-xl tracking-widest text-sage sm:text-2xl uppercase">
              Draw what prompts cannot.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-offwhite/70 sm:text-lg">
              An experimental art & technology project exploring how drawing becomes a direct interface for materializing ideas that cannot be fully expressed through words. The indescribable can be drawn, generated, manifested, and experienced as living physical art.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Ideas beyond words",
                "For the truly unpromptable",
                "Where sketches become dimensions",
                "Drawing-to-3D pipeline",
              ].map((line) => (
                <span key={line} className="rounded-full border border-sage/20 bg-sage/10 px-3 py-1.5 text-xs text-sage/80 font-medium">
                  {line}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button
              onClick={() => setShowDrawer((s) => !s)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 z-10"
            >
              <PencilLine className="h-4 w-4" /> {showDrawer ? "Close Drawing Tool" : "Draw on Site"}
            </button>
            <button 
              onClick={() => setShowManifesto(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sage/40 bg-sage/10 px-5 py-3 text-sm text-sage hover:bg-sage/20 transition z-10"
            >
              <Eye className="h-4 w-4" /> Read Manifesto
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <UploadPanel onUpload={initiateCreation} />

          <div className="rounded-[28px] border border-sage/20 bg-sage/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.25em] text-sage/70 font-semibold">System Pipeline</p>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 p-4 flex gap-3"><PencilLine className="h-5 w-5 text-sage/80 shrink-0"/> Sketch or Upload: Begin with a fleeting internal form—a gesture, mark, or distortion.</div>
              <div className="rounded-2xl border border-white/10 p-4 flex gap-3"><Sparkles className="h-5 w-5 text-sage/80 shrink-0"/> Algorithmic Translation: Transform the drawing into a digital 3D object dynamically.</div>
              <div className="rounded-2xl border border-white/10 p-4 flex gap-3"><Box className="h-5 w-5 text-sage/80 shrink-0"/> Physical Manifestation: Future stages involve 3D printing & live interactive projection.</div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {showDrawer && (
            <motion.section
              initial={{ opacity: 0, y: -14, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -14, height: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-8 overflow-hidden"
            >
              <DrawingCanvas onExport={initiateCreation} />
            </motion.section>
          )}
        </AnimatePresence>

        <section className="mt-10">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Gallery</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sketch-to-Object Pairs</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Public", "Private"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    selectedFilter === filter
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <AnimatePresence>
              {filteredWorks.map((work) => (
                <GalleryCard key={work.id} work={work} />
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Meshy API Integration",
              text: "When no model exists, send rough sketches out to an external AI image-to-3D service for automated meshing.",
            },
            {
              icon: Box,
              title: "External Upload Support",
              text: "Users can build 3D geometry in Blender or Nomad, saving time and computing constraints, pairing it seamlessly here.",
            },
            {
              icon: RotateCcw,
              title: "Dynamic Presentation",
              text: "Instant cross-fades and smooth WebGL orbital viewing automatically handle whatever GLTF/GLB you drop in.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <item.icon className="h-5 w-5 text-white/80" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">{item.text}</p>
            </div>
          ))}
        </section>
      </div>
      
      <AnimatePresence>
        {pendingImage && (
          <CreationFlowDialog
            image={pendingImage}
            onCancel={() => setPendingImage(null)}
            onComplete={finalizeCreation}
          />
        )}
        {showManifesto && (
          <ManifestoDialog onClose={() => setShowManifesto(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

