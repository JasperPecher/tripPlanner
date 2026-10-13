"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Users,
  ListTodo,
  History,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  CheckSquare,
  Square,
  Crown,
  Trophy,
  Dices,
} from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";
import { getRandomSlotHeading, SLOT_HEADINGS } from "@/lib/slotHeadings";

type Member = {
  id: string;
  name: string;
};

type TaskItem = {
  id: string;
  text: string;
  icon: string;
};

type HistoryEntry = {
  id: string;
  who: string;
  task: string;
  timestamp: string;
};

interface VegasSlotMachineProps {
  tripId: string;
  members: Member[];
  currentMember?: Member | null;
  initialTasks?: TaskItem[];
  initialHistory?: HistoryEntry[];
}

const AVATAR_COLORS = [
  "from-amber-400 to-yellow-600 text-stone-900",
  "from-rose-500 to-red-700 text-white",
  "from-cyan-400 to-blue-600 text-white",
  "from-emerald-400 to-green-600 text-white",
  "from-purple-500 to-indigo-700 text-white",
  "from-orange-400 to-amber-600 text-stone-900",
  "from-fuchsia-500 to-pink-600 text-white",
];

// Fixed height of each symbol inside the reel slot (in pixels)
const REEL_ITEM_HEIGHT = 144;

export function VegasSlotMachine({
  tripId,
  members,
  currentMember,
  initialTasks,
  initialHistory,
}: VegasSlotMachineProps) {
  const { t } = useLocale();

  // Sub-tabs below slot machine
  const [activeSubTab, setActiveSubTab] = useState<
    "players" | "tasks" | "history"
  >("players");

  // Participating players
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Duties / Tasks
  const [tasks, setTasks] = useState<TaskItem[]>(
    initialTasks && initialTasks.length > 0 ? initialTasks : [],
  );
  const [singleTaskMode, setSingleTaskMode] = useState<boolean>(false);
  const [singleTaskText, setSingleTaskText] = useState<string>(
    "Den Tag VOR dem Abend loben",
  );
  const [newTaskInput, setNewTaskInput] = useState<string>("");
  const [newTaskIcon, setNewTaskIcon] = useState<string>("🍳");

  // Animated Reel Strip States
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [whoReelStrip, setWhoReelStrip] = useState<Member[]>([]);
  const [taskReelStrip, setTaskReelStrip] = useState<TaskItem[]>([]);
  const [whoReelOffset, setWhoReelOffset] = useState<number>(0);
  const [taskReelOffset, setTaskReelOffset] = useState<number>(0);
  const [whoTransition, setWhoTransition] = useState<string>("none");
  const [taskTransition, setTaskTransition] = useState<string>("none");

  // Current selected indices when idle
  const [currentWhoIndex, setCurrentWhoIndex] = useState<number>(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);

  // Winner outcome & Ledger
  const [winner, setWinner] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory || []);

  // Confetti Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Randomized Slot Heading
  const [slotHeading, setSlotHeading] = useState<string>(
    SLOT_HEADINGS[0] || "GIG - Gambling ist Geil!",
  );

  useEffect(() => {
    setSlotHeading(getRandomSlotHeading());
  }, []);

  // Load from database on mount
  useEffect(() => {
    if (members.length > 0) {
      setSelectedMemberIds(members.map((m) => m.id));
    }

    // Fetch latest tasks and spin history directly from database
    fetch(`/api/trips/${tripId}/casino`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch casino data");
        return res.json();
      })
      .then((data) => {
        if (data.tasks && data.tasks.length > 0) {
          setTasks(data.tasks);
        }
        if (data.spins) {
          setHistory(data.spins);
        }
      })
      .catch((err) => {
        console.error("Error fetching casino data from DB:", err);
      });

    try {
      const savedSingleMode = localStorage.getItem(
        `vegas_single_mode_${tripId}`,
      );
      if (savedSingleMode !== null) {
        setSingleTaskMode(savedSingleMode === "true");
      }
    } catch {}
  }, [tripId, members]);

  // Save tasks to localStorage
  const saveTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(`vegas_tasks_${tripId}`, JSON.stringify(newTasks));
    } catch {}
  };

  // Active pool of participating players
  const activeParticipants = useMemo(() => {
    return members.filter((m) => selectedMemberIds.includes(m.id));
  }, [members, selectedMemberIds]);

  // Active duty pool
  const activeTasks = useMemo(() => {
    if (singleTaskMode) {
      return [{ id: "single", text: singleTaskText, icon: "🤑" }];
    }
    return tasks.length > 0 ? tasks : [];
  }, [singleTaskMode, singleTaskText, tasks]);

  // Set initial strips when idle
  useEffect(() => {
    if (!isSpinning) {
      if (activeParticipants.length > 0) {
        const item =
          activeParticipants[currentWhoIndex % activeParticipants.length];
        setWhoReelStrip([item]);
        setWhoReelOffset(0);
        setWhoTransition("none");
      }
      if (activeTasks.length > 0) {
        const item = activeTasks[currentTaskIndex % activeTasks.length];
        setTaskReelStrip([item]);
        setTaskReelOffset(0);
        setTaskTransition("none");
      }
    }
  }, [
    activeParticipants,
    activeTasks,
    currentWhoIndex,
    currentTaskIndex,
    isSpinning,
  ]);

  // Add custom duty to database
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const text = newTaskInput.trim();
    const icon = newTaskIcon || "🍳";

    const tempId = Date.now().toString();
    const tempItem: TaskItem = { id: tempId, text, icon };
    setTasks((prev) => [...prev, tempItem]);
    setNewTaskInput("");

    try {
      const res = await fetch(`/api/trips/${tripId}/casino/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, icon }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setTasks((prev) =>
            prev.map((t) => (t.id === tempId ? data.task : t)),
          );
        }
      }
    } catch (err) {
      console.error("Error saving task to DB:", err);
    }
  };

  // Delete duty from database
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/trips/${tripId}/casino/tasks/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting task from DB:", err);
    }
  };

  // Confetti & Golden Coin Burst
  const fireConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      isCoin: boolean;
      rotation: number;
      vRot: number;
      alpha: number;
    };

    const particles: Particle[] = [];
    const colors = [
      "#fbbf24", // gold
      "#f59e0b", // amber
      "#ef4444", // red
      "#ec4899", // pink
      "#38bdf8", // cyan
      "#10b981", // emerald
      "#ffffff", // white
    ];

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.45;

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 11;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        isCoin: Math.random() > 0.6,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      });
    }

    let frameCount = 0;
    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.rotation += p.vRot;
        p.alpha -= 0.009;

        if (p.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.isCoin) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "#f59e0b";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#fbbf24";
          ctx.stroke();

          ctx.fillStyle = "#78350f";
          ctx.font = `bold ${Math.floor(p.size * 1.2)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("$", 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      });

      if (frameCount < 160) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  }, []);

  // ANIMATED 2-REEL SPIN ROUTINE
  const handleSpin = () => {
    if (isSpinning) return;
    if (activeParticipants.length === 0) {
      alert(t.casino?.noParticipants || "Please select at least 1 player!");
      return;
    }
    if (activeTasks.length === 0) {
      alert(t.casino?.noTasks || "Please add at least 1 duty!");
      return;
    }

    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([25, 40]);
      } catch {}
    }

    setIsSpinning(true);
    setWinner(null);

    // Pick random target winner indices
    const targetWhoIdx = Math.floor(Math.random() * activeParticipants.length);
    const targetTaskIdx = Math.floor(Math.random() * activeTasks.length);

    const winningPlayer = activeParticipants[targetWhoIdx];
    const winningDuty = activeTasks[targetTaskIdx];

    // Build Reel 1 Strip (20 items cycle)
    const REEL_1_STEPS = 20;
    const strip1: Member[] = [];
    // Start with currently displayed item
    strip1.push(
      activeParticipants[currentWhoIndex % activeParticipants.length],
    );
    for (let i = 1; i < REEL_1_STEPS; i++) {
      strip1.push(
        activeParticipants[
          Math.floor(Math.random() * activeParticipants.length)
        ],
      );
    }
    // Final target item at the end of the strip
    strip1.push(winningPlayer);

    // Build Reel 2 Strip (28 items cycle - spins longer than Reel 1)
    const REEL_2_STEPS = 28;
    const strip2: TaskItem[] = [];
    strip2.push(activeTasks[currentTaskIndex % activeTasks.length]);
    for (let i = 1; i < REEL_2_STEPS; i++) {
      strip2.push(activeTasks[Math.floor(Math.random() * activeTasks.length)]);
    }
    strip2.push(winningDuty);

    // Mount strips with zero initial offset
    setWhoReelStrip(strip1);
    setTaskReelStrip(strip2);
    setWhoReelOffset(0);
    setTaskReelOffset(0);
    setWhoTransition("none");
    setTaskTransition("none");

    // Trigger smooth physical deceleration roll on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Reel 1: 2.1s duration with realistic overshoot bounce
        setWhoTransition("transform 2.1s cubic-bezier(0.12, 0.8, 0.32, 1.05)");
        setWhoReelOffset(REEL_1_STEPS * REEL_ITEM_HEIGHT);

        // Reel 2: 2.8s duration with realistic overshoot bounce
        setTaskTransition("transform 2.8s cubic-bezier(0.12, 0.8, 0.32, 1.05)");
        setTaskReelOffset(REEL_2_STEPS * REEL_ITEM_HEIGHT);
      });
    });

    // Reel 1 Stops at 2.1s
    setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
    }, 2100);

    // Reel 2 Stops & Finale at 2.8s
    setTimeout(() => {
      setCurrentWhoIndex(targetWhoIdx);
      setCurrentTaskIndex(targetTaskIdx);
      setIsSpinning(false);

      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        who: winningPlayer.name,
        task: winningDuty.text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setWinner(newEntry);
      setHistory((prev) => [newEntry, ...prev.slice(0, 49)]);

      // Save spin to database
      fetch(`/api/trips/${tripId}/casino`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: winningPlayer.id,
          taskId: winningDuty.id !== "single" ? winningDuty.id : undefined,
          taskText: winningDuty.text,
          taskIcon: winningDuty.icon,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to save spin to DB");
          return res.json();
        })
        .then((data) => {
          if (data.spin) {
            setHistory((prev) => [
              data.spin,
              ...prev.filter((s) => s.id !== newEntry.id),
            ]);
          }
        })
        .catch((err) => {
          console.error("Error saving spin to database:", err);
        });

      // Celebration Confetti & Coin Burst!
      fireConfetti();

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([40, 60, 100, 60, 150]);
        } catch {}
      }
    }, 2850);
  };

  // Toggle single member checkbox
  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id],
    );
  };

  // Select all / Deselect all
  const selectAllMembers = () => {
    setSelectedMemberIds(members.map((m) => m.id));
  };
  const deselectAllMembers = () => {
    setSelectedMemberIds([]);
  };

  // Clear history in database
  const handleClearHistory = async () => {
    setHistory([]);
    try {
      await fetch(`/api/trips/${tripId}/casino`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error clearing history in database:", err);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-2 sm:px-4 py-2 pb-16 touch-manipulation">
      {/* Fullscreen Overlay Canvas for Confetti & Coin Explosions */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Vegas Casino Master Cabinet */}
      <div className="relative rounded-3xl bg-linear-to-b from-stone-900 via-stone-950 to-neutral-950 p-3 sm:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] border-4 sm:border-8 border-amber-500/80">
        {/* Outer Marquee Bulb Frame */}
        <div className="absolute -top-3 left-6 right-6 flex justify-between px-2 sm:px-6 pointer-events-none">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-amber-900/60 ${
                i % 2 === 0
                  ? "bg-amber-300 vegas-chase-1"
                  : "bg-red-500 vegas-chase-2"
              }`}
            />
          ))}
        </div>

        {/* Vintage Vegas Signboard Header */}
        <div className="relative mb-3 sm:mb-5 pt-2 text-center">
          {/* Glowing Vegas Neon Sign */}
          <div className="inline-block relative px-5 sm:px-10 py-2 rounded-2xl bg-linear-to-r from-red-950 via-red-900 to-red-950 border-2 border-amber-400 shadow-[0_0_25px_rgba(239,68,68,0.5)]">
            <h1 className="text-md sm:text-2xl items-center bg-clip-text bg-linear-to-b from-yellow-200 via-amber-300 to-yellow-600 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-400">
                <Crown className="w-4 h-4 animate-bounce shrink-0" />
                <span>{slotHeading}</span>
              </div>
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-200/90 font-medium">
              {t.casino?.subtitle ||
                "Spin the reels & decide who takes on the duty!"}
            </p>
          </div>
        </div>

        {/* 2-REEL SLOT MACHINE CABINET */}
        <div className="relative w-full bg-linear-to-b from-stone-900 via-neutral-900 to-stone-950 rounded-2xl p-2.5 sm:p-4 border-4 border-amber-600/90 shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)] overflow-hidden">
          {/* Reel Headers */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 text-center">
            <div className="py-1 rounded-md bg-stone-950/80 border border-amber-500/40 text-xs sm:text-sm font-black tracking-widest text-amber-400 uppercase">
              {t.casino?.reels?.who || "WHO"}
            </div>
            <div className="py-1 rounded-md bg-stone-950/80 border border-amber-500/40 text-xs sm:text-sm font-black tracking-widest text-amber-400 uppercase">
              {t.casino?.reels?.task || "DUTY"}
            </div>
          </div>

          {/* 2 Reel Rolling Windows Container */}
          <div
            style={{ height: `${REEL_ITEM_HEIGHT}px` }}
            className="relative grid grid-cols-2 gap-2 sm:gap-4 bg-neutral-950 rounded-xl overflow-hidden border-2 border-stone-800"
          >
            {/* Cylinder 3D Depth Shadows (Top & Bottom linears) */}
            <div className="absolute inset-x-0 top-0 h-12 sm:h-16 bg-linear-to-b from-black via-black/80 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-x-0 bottom-0 h-12 sm:h-16 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none z-20" />

            {/* Horizontal Golden Payline Across Center */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 sm:h-1 bg-linear-to-r from-transparent via-amber-400 to-transparent pointer-events-none z-20 opacity-80 shadow-[0_0_8px_#f59e0b]" />

            {/* REEL 1: WHO (Animated Rolling Strip) */}
            <div className="relative h-full bg-stone-900 border-x border-stone-800 overflow-hidden">
              <div
                style={{
                  transform: `translateY(-${whoReelOffset}px)`,
                  transition: whoTransition,
                }}
                className="w-full will-change-transform"
              >
                {whoReelStrip.map((item, idx) => {
                  const avatarIdx =
                    Math.abs(item.name.charCodeAt(0)) % AVATAR_COLORS.length;
                  return (
                    <div
                      key={idx}
                      style={{ height: `${REEL_ITEM_HEIGHT}px` }}
                      className="w-full flex flex-col items-center justify-center p-2 text-center"
                    >
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-tr ${AVATAR_COLORS[avatarIdx]} flex items-center justify-center font-black text-lg sm:text-2xl shadow-lg border-2 border-white/40 ring-2 ring-amber-400/50`}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-extrabold text-sm sm:text-base text-white tracking-wide truncate max-w-32.5 sm:max-w-50 mt-1.5 drop-shadow-md">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REEL 2: DUTY (Animated Rolling Strip) */}
            <div className="relative h-full bg-stone-900 border-x border-stone-800 overflow-hidden">
              <div
                style={{
                  transform: `translateY(-${taskReelOffset}px)`,
                  transition: taskTransition,
                }}
                className="w-full will-change-transform"
              >
                {taskReelStrip.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${REEL_ITEM_HEIGHT}px` }}
                    className="w-full flex flex-col items-center justify-center p-2 text-center"
                  >
                    <span className="text-3xl sm:text-4xl filter drop-shadow">
                      {item.icon}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-amber-200 leading-snug line-clamp-2 max-w-32.5 sm:max-w-50 mt-1.5">
                      {item.text}
                    </span>
                    {singleTaskMode && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-red-500/30 text-red-300 rounded font-bold uppercase tracking-wider mt-0.5">
                        Target
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Glass Glare Reflection Line */}
            <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none rounded-xl" />
          </div>
        </div>

        {/* Tactile Vegas Controls Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-1 sm:px-2">
          {/* Quick Duty Mode Toggle */}
          <button
            onClick={() => {
              const next = !singleTaskMode;
              setSingleTaskMode(next);
              try {
                localStorage.setItem(
                  `vegas_single_mode_${tripId}`,
                  next ? "true" : "false",
                );
              } catch {}
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              singleTaskMode
                ? "bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                : "bg-stone-900/60 border-stone-700 text-stone-400 hover:text-stone-200"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            {singleTaskMode
              ? t.casino?.singleTaskMode || "1 Fixed Duty"
              : t.casino?.randomTaskMode || "Random Duties"}
          </button>

          {/* Big Tactile Arcade "SPIN" Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full sm:w-auto px-10 py-3.5 rounded-2xl font-black text-base sm:text-lg tracking-wider uppercase transition-all duration-200 shadow-2xl active:scale-95 flex items-center justify-center gap-2 ${
              isSpinning
                ? "bg-stone-700 text-stone-400 cursor-not-allowed border-2 border-stone-600"
                : "bg-linear-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-950 border-2 border-amber-300 hover:brightness-110 vegas-pulse cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.6)]"
            }`}
          >
            <Dices className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
            <span>
              {isSpinning
                ? t.casino?.spinning || "SPINNING..."
                : t.casino?.spinButton || "SPIN"}
            </span>
          </button>
        </div>

        {/* WINNER CELEBRATION CARD */}
        {winner && !isSpinning && (
          <div className="mt-4 p-4 rounded-2xl bg-linear-to-r from-red-950 via-amber-950/80 to-red-950 border-2 border-amber-400 text-center shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>{t.casino?.winnerTitle || "JACKPOT! THE CHOSEN ONE"}</span>
              <Trophy className="w-4 h-4 text-amber-300 animate-bounce" />
            </div>

            <div className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-wide">
              {winner.who}
            </div>

            <div className="mt-1 text-sm sm:text-base font-bold text-amber-200">
              ➔ {winner.task}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={handleSpin}
                className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.casino?.respin || "Spin Again"}
              </button>
              <button
                onClick={() => setWinner(null)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {t.casino?.acceptDuty || "Accepted! 🤝"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUB-TABS: Manage Players, Duties, & Ledger */}
      <div className="mt-6 bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200 dark:border-stone-800">
        <div className="flex border-b border-stone-200 dark:border-stone-800 mb-4 pb-2 gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveSubTab("players")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "players"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.casino?.participantsTab || "Players"}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {activeParticipants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("tasks")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "tasks"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>{t.casino?.tasksTab || "Duties"}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {activeTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "history"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.casino?.historyTab || "Ledger"}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {history.length}
            </span>
          </button>
        </div>

        {/* TAB 1: PLAYERS CONFIGURATION */}
        {activeSubTab === "players" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                {t.casino.participantsExplanation}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllMembers}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                >
                  {t.casino?.selectAll || "Select All"}
                </button>
                <button
                  onClick={deselectAllMembers}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                >
                  {t.casino?.deselectAll || "Deselect All"}
                </button>
              </div>
            </div>

            {/* Trip Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {members.map((member) => {
                const isChecked = selectedMemberIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      isChecked
                        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-400 text-stone-900 dark:text-white"
                        : "bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-orange-500 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400 shrink-0" />
                    )}
                    <span className="font-semibold text-sm truncate">
                      {member.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DUTIES CONFIGURATION */}
        {activeSubTab === "tasks" && (
          <div className="space-y-4">
            {/* Single Task Mode Box */}
            <div className="p-3 sm:p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-orange-500" />
                  {singleTaskMode
                    ? t.casino?.singleTaskMode || "Single Fixed Duty"
                    : t.casino?.randomTaskMode || "Random Duty Pool"}
                </span>
                <button
                  onClick={() => {
                    const next = !singleTaskMode;
                    setSingleTaskMode(next);
                    try {
                      localStorage.setItem(
                        `vegas_single_mode_${tripId}`,
                        next ? "true" : "false",
                      );
                    } catch {}
                  }}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 underline"
                >
                  {singleTaskMode
                    ? "Switch to Random Pool"
                    : "Switch to Single Duty"}
                </button>
              </div>

              {singleTaskMode && (
                <div className="space-y-2 mt-2">
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    All spins will target this specific duty:
                  </span>
                  <input
                    type="text"
                    value={singleTaskText}
                    onChange={(e) => setSingleTaskText(e.target.value)}
                    placeholder="z.B. Brötchen holen"
                    className="w-full text-sm font-semibold px-3 py-2 border border-orange-400 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-orange-500"
                  />
                </div>
              )}
            </div>

            {/* If in Random Pool Mode: Manage Tasks List */}
            {!singleTaskMode && (
              <>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Current Duties Pool ({tasks.length}):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="text-lg shrink-0">{task.icon}</span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-stone-400 hover:text-red-500 p-1 rounded transition shrink-0"
                        title={t.casino?.deleteTask || "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Duty Form */}
                <form
                  onSubmit={handleAddTask}
                  className="flex flex-col sm:flex-row gap-2 pt-2"
                >
                  <div className="flex gap-2 flex-1 min-w-0">
                    <select
                      value={newTaskIcon}
                      onChange={(e) => setNewTaskIcon(e.target.value)}
                      className="text-base px-2.5 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 shrink-0 cursor-pointer"
                    >
                      <option value="🤑">🤑</option>
                      <option value="🍳">🍳</option>
                      <option value="🧼">🧼</option>
                      <option value="🍻">🍻</option>
                      <option value="🛒">🛒</option>
                      <option value="🚗">🚗</option>
                      <option value="🗑️">🗑️</option>
                      <option value="🧹">🧹</option>
                      <option value="🍹">🍹</option>
                      <option value="🔥">🔥</option>
                      <option value="☕">☕</option>
                    </select>
                    <input
                      type="text"
                      placeholder={t.casino?.taskPlaceholder}
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      className="flex-1 min-w-0 text-sm px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newTaskInput.trim()}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>{t.casino?.addTask || "Add Duty"}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* TAB 3: CASINO LEDGER / HISTORY */}
        {activeSubTab === "history" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Official Vegas Ledger (Proof of past spins):
              </span>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  {t.casino?.clearHistory || "Clear Ledger"}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-stone-400 dark:text-stone-500 text-sm">
                {t.casino?.historyEmpty ||
                  "No spins recorded yet. Spin the reels!"}
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-extrabold text-orange-600 dark:text-orange-400">
                        {item.who}
                      </span>
                      <span className="text-stone-500">➔</span>
                      <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                        {item.task}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
