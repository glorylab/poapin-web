import { useEffect, useRef, useState } from "react";
import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";

interface POAPData {
  id: number;
  drop_id?: number;
  drop: {
    image_url: string;
    name: string;
    fancy_id?: string;
    private?: boolean;
    id?: number;
  };
  minted_on?: number;
  collector_address?: string;
}

interface Bubble {
  id: string;
  x: number;
  y: number;
  baseY: number; // Original Y position baseline
  xWithNoise: number;
  yWithNoise: number;
  baseSize: number;
  currentScale: number;
  poap: POAPData;
  element?: HTMLDivElement;
  // Animation properties
  speed: number;
  currentSpeed: number; // smoothed, frame-to-frame speed with easing
  hAccel?: number; // per-bubble acceleration smoothing
  scaleOffset: number;
  scaleAmplitude: number;
  scaleFrequency: number;
  // Natural movement properties
  verticalVelocity: number;
  verticalAcceleration: number;
  maxVerticalVelocity: number;
  verticalBounds: { min: number; max: number };
  // Respawn control
  state: 'active' | 'respawning';
  respawnAt?: number; // time (seconds) when bubble should reappear
  // Intro control (for initial batch only)
  introRemaining?: number; // seconds left of intro fade
  // Waiting phase control (initial batch idle mode)
  phase?: 'waiting' | 'normal';
  waitCenterX?: number;
  waitJitterAmp?: number; // px
  waitJitterSpeed?: number; // radians per second approx
  // Hover easing control
  hoverT?: number;       // 0..1 current hover progress
  hoverTarget?: number;  // 0 or 1 target hover state
}

// Simple noise function to replace Perlin noise
function simpleNoise(x: number, y: number): number {
  return (Math.sin(x * 0.01) + Math.cos(y * 0.01)) * 0.5;
}

interface BubblePOAPsProps {
  context?: AppLoadContext;
  initialPoaps?: POAPData[];
  onBubbleClick?: (poap: POAPData) => void;
}

async function fetchRecentPOAPsPage(context?: AppLoadContext, offset = 0, limit = 100): Promise<POAPData[]> {
  if (!context) return [];
  
  const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;
  
  const query = `
    query RecentPOAPs($limit: Int!, $offset: Int!) {
      poaps(order_by: {minted_on: desc_nulls_last}, limit: $limit, offset: $offset) {
        drop {
          image_url
          name
          fancy_id
          private
          id
        }
        minted_on
        collector_address
        id
        drop_id
      }
    }
  `;

  try {
    const response = await fetch(poapGraphQLBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { limit, offset } }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return [];
    }

    const result = await response.json() as { data?: { poaps?: POAPData[] }, errors?: any[] };
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return [];
    }
    return result.data?.poaps ?? [];
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

export default function BubblePOAPs({ context, initialPoaps, onBubbleClick }: BubblePOAPsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationRef = useRef<number>();
  const [poaps, setPOAPs] = useState<POAPData[]>([]);
  
  // Basic mobile detection (client-side only)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  // Detect prefers-reduced-motion for accessibility
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Limit how many are shown/rendered to reduce work on mobile
  const BUBBLE_COUNT = Math.min(isMobile ? 10 : 25, poaps.length);
  // Configurable horizontal speed bounds (px per frame)
  const SPEED_MIN = 0.28;
  const SPEED_MAX = 1.6;

  const getRandomSpeed = () => SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);

  // Three-phase motion configuration
  const ENTER_ZONE_FRACTION = 0.28; // rightmost 28% is the enter zone
  const EXIT_ZONE_FRACTION = 0.18;  // leftmost 18% is the exit zone
  const ENTER_SPEED_MULTIPLIER_MAX = 1.8; // up to 1.8x base speed at the very edge
  const EXIT_SPEED_MULTIPLIER_MIN = 0.3;  // down to 0.5x base speed before leaving
  const H_ACCEL = 0.06; // horizontal acceleration smoothing (0..1), higher = snappier
  // Population caps
  const MAX_BUBBLES = isMobile ? 24 : 60; // fewer on mobile
  const INITIAL_BATCH_COUNT = isMobile ? 6 : 12; // create fewer initially on mobile
  // Special intro for first batch
  const INITIAL_FROM_RIGHT_FRACTION_MIN = 0.10; // 10% inside from right
  const INITIAL_FROM_RIGHT_FRACTION_MAX = 0.58; // up to 58% inside from right
  const INITIAL_FADE_DURATION = 0.8; // seconds
  const INITIAL_WAIT_MAX = 3.5; // seconds, force release after this
  
  // Seed with server-rendered POAPs to show immediately
  useEffect(() => {
    if (initialPoaps && initialPoaps.length) {
      setPOAPs((prev) => (prev.length ? prev : initialPoaps));
    }
  }, [initialPoaps]);

  // Fetch more POAPs on client in pages until we have at least 50 unique drop_ids
  useEffect(() => {
    if (!context) return;
    let cancelled = false;
    (async () => {
      const TARGET_UNIQUE_DROPS = (typeof window !== 'undefined' && window.innerWidth < 640) ? 25 : 50;
      let offset = 0;
      const limit = 100;
      // Build a deduped list by drop_id
      const accByDrop = new Map<string, POAPData>();
      // Seed with current known items to avoid refetching same drops
      setPOAPs((prev) => {
        for (const p of prev) {
          const key = String(p.drop_id ?? p.id);
          if (!accByDrop.has(key)) accByDrop.set(key, p);
        }
        return prev;
      });

      while (!cancelled && accByDrop.size < TARGET_UNIQUE_DROPS) {
        const page: POAPData[] = await fetchRecentPOAPsPage(context, offset, limit);
        if (!page.length) break;
        let added = 0;
        for (const p of page) {
          const key = String(p.drop_id ?? p.id);
          if (!accByDrop.has(key)) {
            accByDrop.set(key, p);
            added++;
          }
        }
        // Merge into state (prepend newest page items first)
        if (added > 0) {
          const additions = page.filter((p) => accByDrop.get(String(p.drop_id ?? p.id)) === p);
          if (additions.length) {
            setPOAPs((prev) => {
              const seen = new Set(prev.map((p) => String(p.drop_id ?? p.id)));
              const newOnes = additions.filter((p) => !seen.has(String(p.drop_id ?? p.id)));
              if (!newOnes.length) return prev;
              return [...newOnes, ...prev];
            });
          }
        }
        offset += limit;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [context]);

  // Initialize bubbles (first render) and incrementally append on new POAPs without clearing
  useEffect(() => {
    if (!poaps.length || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Helper to test overlap between a candidate and existing bubbles
    const overlapsExisting = (cx: number, cy: number, csize: number) => {
      const cr = csize / 2;
      for (const b of bubblesRef.current) {
        const br = b.baseSize / 2;
        const dx = cx - b.x;
        const dy = cy - b.y;
        const distSq = dx * dx + dy * dy;
        const minDist = cr + br + 6; // small margin (6px)
        if (distSq < minDist * minDist) return true;
      }
      return false;
    };

    // If no bubbles yet, create an initial batch up to cap
    if (bubblesRef.current.length === 0) {
      const toCreate = Math.min(INITIAL_BATCH_COUNT, poaps.length, BUBBLE_COUNT);
      const newBubbles: Bubble[] = [];
      for (let i = 0; i < toCreate; i++) {
        const poap = poaps[i % poaps.length];
        const baseSize = (isMobile ? 80 : 50) + Math.random() * (isMobile ? 40 : 40); // mobile: 80-120px, desktop: 50-90px
        // Place randomly between 10% and 18% inside from the right edge for instant visibility
        const frac = INITIAL_FROM_RIGHT_FRACTION_MIN + Math.random() * (INITIAL_FROM_RIGHT_FRACTION_MAX - INITIAL_FROM_RIGHT_FRACTION_MIN);
        const x = Math.max(0, containerRect.width * (1 - frac) - baseSize);
        let y = Math.random() * (containerRect.height - baseSize - 100) + 50;
        let attempts = 0;
        while (overlapsExisting(x, y, baseSize) && attempts < 25) {
          y = Math.random() * (containerRect.height - baseSize - 100) + 50;
          attempts++;
        }
        const speed = getRandomSpeed();
        const scaleAmplitude = 0.15 + Math.random() * 0.2;
        const scaleFrequency = 0.008 + Math.random() * 0.015;
        const maxVerticalVelocity = 0.8 + Math.random() * 1.2;
        const initialVerticalVelocity = (Math.random() - 0.5) * maxVerticalVelocity * 0.5;
        const verticalAcceleration = 0.01 + Math.random() * 0.03;
        const verticalRange = 80 + Math.random() * 60;
        const verticalBounds = { min: y - verticalRange / 2, max: y + verticalRange / 2 };
        const bubbleElement = document.createElement('div');
        bubbleElement.className = `
          absolute pointer-events-auto select-none rounded-full 
          bg-white/8 backdrop-blur-sm border border-white/60 border-2
          shadow-xl transition-all duration-200 ease-out cursor-pointer
        `;
        bubbleElement.style.width = `${baseSize}px`;
        bubbleElement.style.height = `${baseSize}px`;
        bubbleElement.style.transform = `translate(${x}px, ${y}px) scale(1)`;
        bubbleElement.style.zIndex = '1';
        bubbleElement.style.pointerEvents = 'auto';
        // Start transparent, will fade in quickly
        bubbleElement.style.opacity = '0';
        bubbleElement.style.filter = 'brightness(1.1)';
        bubbleElement.setAttribute('role', 'link');
        bubbleElement.setAttribute('tabindex', '0');
        bubbleElement.setAttribute('aria-label', `View ${poap.drop.name}`);
        const img = document.createElement('img');
        const sizedUrl = poap.drop.image_url.includes('?')
          ? `${poap.drop.image_url}&size=medium`
          : `${poap.drop.image_url}?size=medium`;
        img.src = sizedUrl;
        img.alt = poap.drop.name;
        img.className = 'w-full h-full object-cover rounded-full';
        img.loading = i < 6 ? 'eager' : 'lazy'; // First 6 bubbles load eagerly for better LCP
        bubbleElement.appendChild(img);
        container.appendChild(bubbleElement);
        const bubble: Bubble = {
          id: `bubble-${poap.id}-${i}`,
          x,
          y,
          baseY: y,
          xWithNoise: x,
          yWithNoise: y,
          baseSize,
          currentScale: 1,
          poap,
          element: bubbleElement,
          speed,
          currentSpeed: speed,
          hAccel: 1, // no easing at intro
          scaleOffset: Math.random() * Math.PI * 2,
          scaleAmplitude,
          scaleFrequency,
          verticalVelocity: initialVerticalVelocity,
          verticalAcceleration,
          maxVerticalVelocity,
          verticalBounds,
          state: 'active',
          introRemaining: INITIAL_FADE_DURATION,
          phase: 'waiting',
          waitCenterX: x,
          waitJitterAmp: 12 + Math.random() * 18, // 12-30px jitter
          waitJitterSpeed: 0.8 + Math.random() * 1.2, // ~0.8-2.0 rad/sec
          hoverT: 0,
          hoverTarget: 0,
        };
        // Click handler for navigation
        const onClick = (e: MouseEvent | KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (onBubbleClick) {
            onBubbleClick(poap);
          } else {
            window.location.href = `/poap/${poap.id}`;
          }
        };
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick(e);
          }
        };
        bubbleElement.addEventListener('click', onClick as EventListener);
        bubbleElement.addEventListener('keydown', onKeyDown as EventListener);
        
        // Hover easing listeners (on wrapper and inner img)
        const onEnter = () => { bubble.hoverTarget = 1; };
        const onLeave = () => { bubble.hoverTarget = 0; };
        bubbleElement.addEventListener('mouseenter', onEnter);
        bubbleElement.addEventListener('mouseleave', onLeave);
        const innerImg = bubbleElement.querySelector('img');
        if (innerImg) {
          innerImg.addEventListener('mouseenter', onEnter);
          innerImg.addEventListener('mouseleave', onLeave);
        }
        newBubbles.push(bubble);
      }
      bubblesRef.current = newBubbles;
      return;
    }

    // Incremental: append bubbles for newly added POAP ids up to MAX_BUBBLES
    const existingIds = new Set(bubblesRef.current.map(b => String(b.poap.drop_id ?? b.poap.id)));
    // De-duplicate incoming list by drop_id to avoid multiple bubbles for same drop
    const seenIncoming = new Set<string>();
    const newPoaps = poaps.filter(p => {
      const key = String(p.drop_id ?? p.id);
      if (existingIds.has(key)) return false;
      if (seenIncoming.has(key)) return false;
      seenIncoming.add(key);
      return true;
    });
    const capTotal = Math.min(MAX_BUBBLES, BUBBLE_COUNT);
    const capacity = Math.max(0, capTotal - bubblesRef.current.length);
    const toAppend = newPoaps.slice(0, capacity);
    if (!toAppend.length) return;

    toAppend.forEach((poap, idx) => {
      const baseSize = (isMobile ? 80 : 50) + Math.random() * (isMobile ? 40 : 40);
      // Spawn just off-screen to the right so they enter quickly
      const x = containerRect.width + baseSize + Math.random() * 120;
      let y = Math.random() * (containerRect.height - baseSize - 100) + 50;
      let attempts = 0;
      while (overlapsExisting(x, y, baseSize) && attempts < 25) {
        y = Math.random() * (containerRect.height - baseSize - 100) + 50;
        attempts++;
      }
      const speed = getRandomSpeed();
      const scaleAmplitude = 0.15 + Math.random() * 0.2;
      const scaleFrequency = 0.008 + Math.random() * 0.015;
      const maxVerticalVelocity = 0.8 + Math.random() * 1.2;
      const initialVerticalVelocity = (Math.random() - 0.5) * maxVerticalVelocity * 0.5;
      const verticalAcceleration = 0.01 + Math.random() * 0.03;
      const verticalRange = 80 + Math.random() * 60;
      const verticalBounds = { min: y - verticalRange / 2, max: y + verticalRange / 2 };
      const bubbleElement = document.createElement('div');
      bubbleElement.className = `
        absolute pointer-events-auto select-none rounded-full 
        bg-white/8 backdrop-blur-sm border border-white/60 border-2
        shadow-xl transition-all duration-200 ease-out cursor-pointer
      `;
      bubbleElement.style.width = `${baseSize}px`;
      bubbleElement.style.height = `${baseSize}px`;
      bubbleElement.style.transform = `translate(${x}px, ${y}px) scale(1)`;
      bubbleElement.style.opacity = '0'; // start hidden off-screen right
      bubbleElement.style.filter = 'brightness(1.1)';
      bubbleElement.style.zIndex = '1';
      bubbleElement.style.pointerEvents = 'auto';
      bubbleElement.setAttribute('role', 'link');
      bubbleElement.setAttribute('tabindex', '0');
      bubbleElement.setAttribute('aria-label', `View ${poap.drop.name}`);
      const img = document.createElement('img');
      const sizedUrl2 = poap.drop.image_url.includes('?')
        ? `${poap.drop.image_url}&size=medium`
        : `${poap.drop.image_url}?size=medium`;
      img.src = sizedUrl2;
      img.alt = poap.drop.name;
      img.className = 'w-full h-full object-cover rounded-full';
      img.loading = 'lazy';
      bubbleElement.appendChild(img);
      container.appendChild(bubbleElement);
      const bubble: Bubble = {
        id: `bubble-${poap.id}-${Date.now()}-${idx}`,
        x,
        y,
        baseY: y,
        xWithNoise: x,
        yWithNoise: y,
        baseSize,
        currentScale: 1,
        poap,
        element: bubbleElement,
        speed,
        currentSpeed: speed,
        scaleOffset: Math.random() * Math.PI * 2,
        scaleAmplitude,
        scaleFrequency,
        verticalVelocity: initialVerticalVelocity,
        verticalAcceleration,
        maxVerticalVelocity,
        verticalBounds,
        state: 'active',
        phase: 'normal', // appended bubbles are normal movers
        hoverT: 0,
        hoverTarget: 0,
      };
      // Click handler for navigation
      const onClick2 = (e: MouseEvent | KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onBubbleClick) {
          onBubbleClick(poap);
        } else {
          window.location.href = `/poap/${poap.id}`;
        }
      };
      const onKeyDown2 = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick2(e);
        }
      };
      bubbleElement.addEventListener('click', onClick2 as EventListener);
      bubbleElement.addEventListener('keydown', onKeyDown2 as EventListener);
      
      // Hover easing listeners (on wrapper and inner img)
      const onEnter2 = () => { bubble.hoverTarget = 1; };
      const onLeave2 = () => { bubble.hoverTarget = 0; };
      bubbleElement.addEventListener('mouseenter', onEnter2);
      bubbleElement.addEventListener('mouseleave', onLeave2);
      const innerImg2 = bubbleElement.querySelector('img');
      if (innerImg2) {
        innerImg2.addEventListener('mouseenter', onEnter2);
        innerImg2.addEventListener('mouseleave', onLeave2);
      }
      bubblesRef.current = [...bubblesRef.current, bubble];
    });
  }, [poaps]);

  // Animation loop
  useEffect(() => {
    if (!containerRef.current || !bubblesRef.current.length) return;
    
    // If reduced motion is preferred, show static layout without animation
    if (prefersReducedMotion) {
      bubblesRef.current.forEach(bubble => {
        if (bubble.element) {
          bubble.element.style.opacity = '1';
          bubble.element.style.transform = `translate(${bubble.x}px, ${bubble.y}px) scale(1)`;
        }
      });
      return;
    }

    let time = 0;
    
    function animate() {
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      time += 0.016; // Approximate 60fps time increment

      // Determine if we should release waiting initial batch:
      // when >=1 normal bubble is visible OR after a small timeout
      const normalVisibleCount = bubblesRef.current.reduce((acc, b) => {
        const isNormal = b.phase !== 'waiting';
        const visible = b.x + b.baseSize > 0 && b.x < containerRect.width;
        return acc + (isNormal && visible ? 1 : 0);
      }, 0);
      const releaseWaiting = normalVisibleCount >= 1 || time >= INITIAL_WAIT_MAX;
      
      bubblesRef.current = bubblesRef.current.map((bubble, index) => {
        if (!bubble.element) return bubble;

        // Smooth hover easing (0..1) and slow-down factor
        const prevHoverT = bubble.hoverT ?? 0;
        const targetHover = bubble.hoverTarget ?? 0;
        const easedHoverT = prevHoverT + (targetHover - prevHoverT) * 0.15;
        const hoverT = Math.max(0, Math.min(1, easedHoverT));
        const slowFactor = 1 - 1.0 * hoverT; // 0 = full stop, 1 = normal speed

        if (bubble.state === 'respawning') {
          if (bubble.respawnAt && time >= bubble.respawnAt) {
            // Time to place bubble at the right, just outside the viewport
            const resetX = containerRect.width + bubble.baseSize + Math.random() * 100;
            const resetY = Math.random() * (containerRect.height - bubble.baseSize - 100) + 50;
            const resetBaseY = resetY;

            // Reset physics properties
            const maxVerticalVelocity = 0.8 + Math.random() * 1.2;
            const initialVerticalVelocity = (Math.random() - 0.5) * maxVerticalVelocity * 0.5;
            const verticalAcceleration = 0.01 + Math.random() * 0.03;
            const verticalRange = 80 + Math.random() * 60;
            const verticalBounds = {
              min: resetY - verticalRange / 2,
              max: resetY + verticalRange / 2,
            };

            // Randomize other animation properties on respawn for variety
            bubble.speed = getRandomSpeed();
            bubble.scaleAmplitude = 0.15 + Math.random() * 0.2;
            bubble.scaleFrequency = 0.008 + Math.random() * 0.015;
            bubble.scaleOffset = Math.random() * Math.PI * 2;

            // Place bubble off-screen right, keep opacity 0 to avoid popping
            bubble.element.style.transform = `translate(${resetX}px, ${resetY}px) scale(1)`;
            bubble.element.style.opacity = '0';

            return {
              ...bubble,
              x: resetX,
              y: resetY,
              baseY: resetBaseY,
              xWithNoise: resetX,
              yWithNoise: resetY,
              currentScale: 1,
              currentSpeed: bubble.speed,
              verticalVelocity: initialVerticalVelocity,
              verticalAcceleration,
              maxVerticalVelocity,
              verticalBounds,
              state: 'active',
              respawnAt: undefined,
              hoverT,
              hoverTarget: targetHover,
            };
          }
          // Still waiting to respawn; keep invisible
          bubble.element.style.opacity = '0';
          return { ...bubble, hoverT, hoverTarget: targetHover };
        }

        // Pre-compute screen dimensions and opacity zone widths once per bubble
        const screenWidth = containerRect.width;
        const enterZoneW = screenWidth * ENTER_ZONE_FRACTION;
        const exitZoneW = screenWidth * EXIT_ZONE_FRACTION;

        // If in initial waiting phase, do vertical bob and small horizontal jitter only
        if (bubble.phase === 'waiting') {
          // Fade handled below via introRemaining
          const jitterX = (bubble.waitCenterX ?? bubble.x) + Math.sin(time * (bubble.waitJitterSpeed ?? 1)) * (bubble.waitJitterAmp ?? 16);

          // Natural vertical bob stays active using existing physics update below; but do not advance X left
          // Update vertical physics (lighter version), slowed by hover
          let newVerticalVelocity = bubble.verticalVelocity * slowFactor;
          let newY = bubble.y;
          const centerY = (bubble.verticalBounds.min + bubble.verticalBounds.max) / 2;
          const distanceFromCenter = bubble.y - centerY;
          const boundaryForce = -distanceFromCenter * 0.001;
          newVerticalVelocity += boundaryForce * slowFactor;
          newVerticalVelocity += (Math.random() - 0.5) * bubble.verticalAcceleration * 0.3 * slowFactor;
          newVerticalVelocity = Math.max(-bubble.maxVerticalVelocity, Math.min(bubble.maxVerticalVelocity, newVerticalVelocity));
          newY += newVerticalVelocity;
          if (newY <= bubble.verticalBounds.min) {
            newY = bubble.verticalBounds.min;
            newVerticalVelocity = Math.abs(newVerticalVelocity) * 0.7;
          } else if (newY >= bubble.verticalBounds.max) {
            newY = bubble.verticalBounds.max;
            newVerticalVelocity = -Math.abs(newVerticalVelocity) * 0.7;
          }

          // Scale animation + hover upscale to 110%
          const scaleFloat = Math.sin(time * bubble.scaleFrequency + bubble.scaleOffset) * bubble.scaleAmplitude;
          const baseScale = 1 + scaleFloat;
          const newScale = baseScale * (1 + 0.10 * hoverT);
          bubble.element.style.transform = `translate(${jitterX}px, ${newY}px) scale(${newScale})`;

          // Opacity handling per spec: enter(0->1), middle(1..0.8 with slight variation), exit(->0)
          const isOffscreenRight = jitterX > screenWidth - bubble.baseSize * 0.5;
          let phaseOpacity = 1;
          if (isOffscreenRight) {
            phaseOpacity = 0;
          } else if (jitterX >= screenWidth - enterZoneW) {
            // Enter zone: map 0->1 as it moves leftwards into screen
            const t = 1 - ((jitterX - (screenWidth - enterZoneW)) / enterZoneW);
            phaseOpacity = Math.max(0, Math.min(1, t));
          } else if (jitterX <= exitZoneW) {
            // Exit zone: fade to 0 near left edge
            const t = Math.max(0, Math.min(1, jitterX / exitZoneW));
            // Middle base (1..0.8), modulate slightly by scale/velocity
            const velocityFactor = Math.abs(newVerticalVelocity) / bubble.maxVerticalVelocity;
            const mid = 0.9 + (newScale - 1) * 0.1 + velocityFactor * 0.05; // ~0.8..1
            const midClamped = Math.max(0.8, Math.min(1, mid));
            phaseOpacity = midClamped * t;
          } else {
            // Middle zone
            const velocityFactor = Math.abs(newVerticalVelocity) / bubble.maxVerticalVelocity;
            const mid = 0.9 + (newScale - 1) * 0.1 + velocityFactor * 0.05; // ~0.8..1
            phaseOpacity = Math.max(0.8, Math.min(1, mid));
          }
          // Respect intro fade by taking the max of intro progress and phaseOpacity
          let introOpacity: number | undefined;
          if (bubble.introRemaining && bubble.introRemaining > 0) {
            const elapsed = Math.min(INITIAL_FADE_DURATION, INITIAL_FADE_DURATION - bubble.introRemaining + 0.016);
            introOpacity = Math.min(1, Math.max(0, elapsed / INITIAL_FADE_DURATION));
          }
          const finalOpacity = introOpacity !== undefined ? Math.max(introOpacity, phaseOpacity) : phaseOpacity;
          bubble.element.style.opacity = finalOpacity.toString();

          // Decrease intro, possibly release to normal
          let nextIntroRemaining = bubble.introRemaining;
          if (nextIntroRemaining && nextIntroRemaining > 0) {
            nextIntroRemaining = Math.max(0, nextIntroRemaining - 0.016);
          }
          const nextPhase = releaseWaiting ? 'normal' : 'waiting';

          return {
            ...bubble,
            x: jitterX,
            y: newY,
            verticalVelocity: newVerticalVelocity,
            currentScale: newScale,
            introRemaining: nextIntroRemaining,
            hAccel: nextPhase === 'normal' ? H_ACCEL : bubble.hAccel,
            phase: nextPhase,
            hoverT,
            hoverTarget: targetHover,
          };
        }

        // Compute target speed multiplier based on horizontal position (three-phase motion)
        const width = containerRect.width;
        const enterZoneWidth = width * ENTER_ZONE_FRACTION;
        const exitZoneWidth = width * EXIT_ZONE_FRACTION;

        let speedMultiplier = 1;
        if (bubble.x >= width - enterZoneWidth) {
          // Entering: faster then ease to normal
          const start = width - enterZoneWidth;
          const t = Math.min(1, Math.max(0, (bubble.x - start) / enterZoneWidth)); // 0 at start boundary -> 1 at right edge
          // Lerp from max multiplier at the very edge to 1 at the inner boundary
          speedMultiplier = ENTER_SPEED_MULTIPLIER_MAX - (ENTER_SPEED_MULTIPLIER_MAX - 1) * t;
        } else if (bubble.x <= exitZoneWidth) {
          // Exiting: slow down with easing
          const t = Math.min(1, Math.max(0, (exitZoneWidth - bubble.x) / exitZoneWidth)); // 0 at boundary -> 1 at left edge
          // Lerp from 1 at boundary to min multiplier at edge
          speedMultiplier = 1 - (1 - EXIT_SPEED_MULTIPLIER_MIN) * t;
        } else {
          speedMultiplier = 1;
        }

        // During intro, use hAccel=1 (no smoothing); afterwards use global H_ACCEL
        const targetSpeed = bubble.speed * speedMultiplier * slowFactor;
        const hAccel = bubble.hAccel ?? H_ACCEL;
        const newCurrentSpeed = bubble.currentSpeed + (targetSpeed - bubble.currentSpeed) * hAccel;
        const newX = bubble.x - newCurrentSpeed;
        
        // Natural physics-based vertical movement
        let newVerticalVelocity = bubble.verticalVelocity * slowFactor;
        let newY = bubble.y;
        
        // Apply random acceleration changes for natural movement
        if (Math.random() < 0.02) { // 2% chance per frame to change direction
          newVerticalVelocity += (Math.random() - 0.5) * bubble.verticalAcceleration * 4;
        } else {
          // Gradual acceleration towards bounds
          const centerY = (bubble.verticalBounds.min + bubble.verticalBounds.max) / 2;
          const distanceFromCenter = bubble.y - centerY;
          const boundaryForce = -distanceFromCenter * 0.001; // Pull towards center
          newVerticalVelocity += boundaryForce;
        }
        
        // Add small random acceleration for organic feel
        newVerticalVelocity += (Math.random() - 0.5) * bubble.verticalAcceleration * 0.5 * slowFactor;
        
        // Clamp velocity to maximum
        newVerticalVelocity = Math.max(-bubble.maxVerticalVelocity, 
                                      Math.min(bubble.maxVerticalVelocity, newVerticalVelocity));
        
        // Update Y position
        newY += newVerticalVelocity;
        
        // Bounce off bounds with damping
        if (newY <= bubble.verticalBounds.min) {
          newY = bubble.verticalBounds.min;
          newVerticalVelocity = Math.abs(newVerticalVelocity) * 0.7; // Bounce with damping
        } else if (newY >= bubble.verticalBounds.max) {
          newY = bubble.verticalBounds.max;
          newVerticalVelocity = -Math.abs(newVerticalVelocity) * 0.7; // Bounce with damping
        }
        
        // Individual scale animation
        const scaleFloat = Math.sin(time * bubble.scaleFrequency + bubble.scaleOffset) * bubble.scaleAmplitude;
        const baseScale = 1 + scaleFloat;
        const newScale = baseScale * (1 + 0.10 * hoverT);
        
        // When bubble goes off-screen left, fade it out and schedule a delayed respawn
        if (newX < -bubble.baseSize * 2) {
          const delay = 0.6 + Math.random() * 1.2; // 0.6s - 1.8s delay
          bubble.element.style.opacity = '0';
          return {
            ...bubble,
            x: newX, // keep moving left while invisible (won't be seen)
            state: 'respawning',
            respawnAt: time + delay,
          };
        }
        
        // Update position and scale with smooth animations
        bubble.element.style.transform = `translate(${newX}px, ${newY}px) scale(${newScale})`;

        // Opacity handling per spec: enter(0->1), middle(1..0.8 with slight variation), exit(->0)
        const isOffscreenRight = newX > screenWidth - bubble.baseSize * 0.5;
        let phaseOpacity = 1;
        if (isOffscreenRight) {
          phaseOpacity = 0;
        } else if (newX >= screenWidth - enterZoneW) {
          // Enter zone: map 0->1 as it moves leftwards into screen
          const t = 1 - ((newX - (screenWidth - enterZoneW)) / enterZoneW);
          phaseOpacity = Math.max(0, Math.min(1, t));
        } else if (newX <= exitZoneW) {
          // Exit zone: fade to 0 near left edge
          const t = Math.max(0, Math.min(1, newX / exitZoneW));
          // Middle base (1..0.8), modulate slightly by scale/velocity
          const velocityFactor = Math.abs(newVerticalVelocity) / bubble.maxVerticalVelocity;
          const mid = 0.9 + (newScale - 1) * 0.1 + velocityFactor * 0.05; // ~0.8..1
          const midClamped = Math.max(0.8, Math.min(1, mid));
          phaseOpacity = midClamped * t;
        } else {
          // Middle zone
          const velocityFactor = Math.abs(newVerticalVelocity) / bubble.maxVerticalVelocity;
          const mid = 0.9 + (newScale - 1) * 0.1 + velocityFactor * 0.05; // ~0.8..1
          phaseOpacity = Math.max(0.8, Math.min(1, mid));
        }
        // Respect intro fade by taking the max of intro progress and phaseOpacity
        let introOpacity: number | undefined;
        if (bubble.introRemaining && bubble.introRemaining > 0) {
          const elapsed = Math.min(INITIAL_FADE_DURATION, INITIAL_FADE_DURATION - bubble.introRemaining + 0.016);
          introOpacity = Math.min(1, Math.max(0, elapsed / INITIAL_FADE_DURATION));
        }
        const finalOpacity = introOpacity !== undefined ? Math.max(introOpacity, phaseOpacity) : phaseOpacity;
        bubble.element.style.opacity = finalOpacity.toString();

        // Decrease intro timer; when finished, restore normal acceleration
        let nextIntroRemaining = bubble.introRemaining;
        let nextHAccel = bubble.hAccel;
        if (nextIntroRemaining && nextIntroRemaining > 0) {
          nextIntroRemaining = Math.max(0, nextIntroRemaining - 0.016);
          if (nextIntroRemaining === 0) {
            nextHAccel = H_ACCEL;
          }
        }
        
        return {
          ...bubble,
          x: newX,
          y: newY,
          xWithNoise: newX,
          yWithNoise: newY,
          currentScale: newScale,
          currentSpeed: newCurrentSpeed,
          verticalVelocity: newVerticalVelocity,
          introRemaining: nextIntroRemaining,
          hAccel: nextHAccel,
          hoverT,
          hoverTarget: targetHover,
        };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [poaps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bubblesRef.current.forEach(bubble => {
        if (bubble.element) {
          bubble.element.remove();
        }
      });
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}