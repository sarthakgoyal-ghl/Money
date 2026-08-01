import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { ease, stagger } from "../../motion/tokens";

export interface AgentTask {
  id: string;
  label: string;
}

interface AgentProgressProps {
  tasks: AgentTask[];
  /** Number of tasks finished. `tasks.length` means all done. */
  completed: number;
  /** Suppresses the live region when a parent already owns the announcement. */
  silent?: boolean;
  tone?: "dark" | "light";
}

/**
 * Progressive AI work.
 *
 * Shows what the agent has finished and what it is on — no hidden reasoning, no
 * "AI is typing…" bubble, no character-by-character text. Completed tasks
 * resolve into a check and drop back in emphasis so the active one leads.
 */
export function AgentProgress({
  tasks,
  completed,
  silent = false,
  tone = "dark",
}: AgentProgressProps) {
  const reduced = useReducedMotion();
  const activeIndex = Math.min(completed, tasks.length - 1);
  const allDone = completed >= tasks.length;
  const activeTask = allDone ? null : tasks[activeIndex];

  return (
    <div
      role={silent ? undefined : "status"}
      aria-live={silent ? undefined : "polite"}
      aria-atomic="false"
    >
      {/* Only the current task is rendered at full emphasis; finished ones
          collapse into a compact trail beneath it. */}
      <div className="min-h-[22px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={activeTask?.id ?? "done"}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [...ease] }}
            className={[
              "text-[15px] font-medium leading-snug",
              tone === "dark" ? "text-white" : "text-ink-900",
            ].join(" ")}
          >
            {activeTask ? activeTask.label : "Found your best option"}
          </motion.p>
        </AnimatePresence>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {tasks.slice(0, completed).map((task, index) => (
          <motion.li
            key={task.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.24,
              delay: reduced ? 0 : index * stagger.brief,
              ease: [...ease],
            }}
            className={[
              "inline-flex items-center gap-1.5 text-[12px]",
              tone === "dark" ? "text-white/62" : "text-ink-500",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "flex h-3.5 w-3.5 items-center justify-center rounded-full",
                tone === "dark"
                  ? "bg-route-cyan/22 text-route-cyan"
                  : "bg-ok-50 text-ok",
              ].join(" ")}
            >
              <Check size={9} strokeWidth={3} />
            </span>
            {task.label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
