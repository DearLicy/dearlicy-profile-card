"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

const SLIDE_EASING = [0.22, 1, 0.36, 1] as const;

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("AnimatedTabs components must be used inside AnimatedTabs.");
  }
  return context;
}

function AnimatedTabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (next: string) => {
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    },
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider
      value={{ value: currentValue, setValue }}
    >
      <TabsPrimitive.Root
        data-slot="tabs"
        value={currentValue}
        onValueChange={setValue}
        className={cn("flex flex-col gap-4", className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}

function AnimatedTabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const context = useTabsContext();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const measure = React.useCallback(() => {
    const list = listRef.current;
    const trigger = list?.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-state="active"]',
    );
    if (!list || !trigger) return;
    const next = {
      left: trigger.offsetLeft,
      top: trigger.offsetTop,
      width: trigger.offsetWidth,
      height: trigger.offsetHeight,
      ready: true,
    };
    setIndicator((current) =>
      current.left === next.left &&
      current.top === next.top &&
      current.width === next.width &&
      current.height === next.height &&
      current.ready
        ? current
        : next,
    );
  }, []);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    const mutation = new MutationObserver(measure);
    mutation.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
      childList: true,
    });
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      mutation.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, context.value]);

  React.useEffect(() => {
    const list = listRef.current;
    const trigger = listRef.current?.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-state="active"]',
    );
    if (!list || !trigger) return;
    const left = trigger.offsetLeft;
    const right = left + trigger.offsetWidth;
    if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({
        left: Math.max(0, left - 12),
        behavior: "smooth",
      });
    }
  }, [context.value]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex h-10 w-fit items-center justify-start rounded-xl bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {indicator.ready ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-lg bg-background shadow-sm"
          initial={false}
          animate={{
            left: indicator.left,
            top: indicator.top,
            width: indicator.width,
            height: indicator.height,
          }}
          transition={{ duration: 0.46, ease: SLIDE_EASING }}
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
  );
}

function AnimatedTabsTrigger({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const context = useTabsContext();
  const active = context.value === value;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative z-10 inline-flex h-full flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap outline-none transition-opacity duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50",
        active ? "text-foreground" : "text-muted-foreground hover:opacity-65",
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

type AnimatedTabPanel = React.ReactElement<{
  value: string;
  className?: string;
  children?: React.ReactNode;
}>;

function AnimatedTabsViewPanel({
  children,
  className,
  direction,
  onMeasure,
}: {
  children: React.ReactNode;
  className?: string;
  direction: number;
  onMeasure: (height: number) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const styles = window.getComputedStyle(element);
    const marginTop = Number.parseFloat(styles.marginTop) || 0;
    const marginBottom = Number.parseFloat(styles.marginBottom) || 0;
    onMeasure(element.offsetHeight + marginTop + marginBottom);
  }, [onMeasure]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction * 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: direction * -10,
        transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
      }}
      transition={{ duration: 0.36, ease: SLIDE_EASING }}
      className={cn("tab-panel outline-none", className)}
    >
      {children}
    </motion.div>
  );
}

function AnimatedTabsViews({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = useTabsContext();
  const panels = React.Children.toArray(children).filter(
    (child): child is AnimatedTabPanel => React.isValidElement(child),
  );
  const active = panels.find((panel) => panel.props.value === context.value);
  const activeIndex = panels.findIndex(
    (panel) => panel.props.value === context.value,
  );
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousValue = React.useRef(context.value);
  const previousHeight = React.useRef<number | null>(null);
  const releaseTimer = React.useRef<number | null>(null);
  const [height, setHeight] = React.useState<number | null>(null);
  const [direction, setDirection] = React.useState(1);

  React.useLayoutEffect(() => {
    if (previousValue.current === context.value) return;
    const previousIndex = panels.findIndex(
      (panel) => panel.props.value === previousValue.current,
    );
    setDirection(activeIndex >= previousIndex ? 1 : -1);
    previousHeight.current = containerRef.current?.getBoundingClientRect().height ?? null;
    // Keep the outgoing panel's height until the incoming panel has mounted.
    setHeight(previousHeight.current);
    previousValue.current = context.value;
  }, [activeIndex, context.value, panels]);

  const measure = React.useCallback((nextHeight: number) => {
    if (nextHeight <= 0) return;
    setHeight(nextHeight);
    if (releaseTimer.current) window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => setHeight(null), 420);
  }, []);

  React.useEffect(() => {
    return () => {
      if (releaseTimer.current) window.clearTimeout(releaseTimer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "min-w-0 transition-[height] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        height !== null && "overflow-hidden",
        className,
      )}
      style={height !== null ? { height } : undefined}
    >
      <AnimatePresence initial={false} mode="wait">
        <AnimatedTabsViewPanel
          key={active.props.value}
          className={active.props.className}
          direction={direction}
          onMeasure={measure}
        >
          {active.props.children}
        </AnimatedTabsViewPanel>
      </AnimatePresence>
    </div>
  );
}

function AnimatedTabsContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  const context = useTabsContext();
  if (context.value !== props.value) return null;

  return (
    <TabsPrimitive.Content
      asChild
      forceMount
      data-slot="tabs-content"
      {...props}
    >
      <div
        className={cn("tab-panel outline-none", className)}
      >
        {children}
      </div>
    </TabsPrimitive.Content>
  );
}

export {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsContent,
  AnimatedTabsViews,
};
