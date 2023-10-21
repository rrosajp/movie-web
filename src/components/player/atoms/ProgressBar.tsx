import {
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useProgressBar } from "@/hooks/useProgressBar";
import { nearestImageAt } from "@/stores/player/slices/thumbnails";
import { usePlayerStore } from "@/stores/player/store";

function ThumbnailDisplay(props: { at: number }) {
  const thumbnailImages = usePlayerStore((s) => s.thumbnails.images);
  const currentThumbnail = useMemo(() => {
    return nearestImageAt(thumbnailImages, props.at)?.image;
  }, [thumbnailImages, props.at]);

  if (!currentThumbnail) return null;
  return <img src={currentThumbnail.data} className="h-12" />;
}

function useMouseHoverPosition(barRef: RefObject<HTMLDivElement>) {
  const [mousePos, setMousePos] = useState(-1);

  const mouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = barRef.current.getBoundingClientRect();
      const pos = (e.pageX - rect.left) / barRef.current.offsetWidth;
      setMousePos(pos * 100);
    },
    [setMousePos, barRef]
  );

  const mouseLeave = useCallback(() => {
    setMousePos(-1);
  }, [setMousePos]);

  return { mousePos, mouseMove, mouseLeave };
}

export function ProgressBar() {
  const { duration, time, buffered } = usePlayerStore((s) => s.progress);
  const display = usePlayerStore((s) => s.display);
  const setDraggingTime = usePlayerStore((s) => s.setDraggingTime);
  const setSeeking = usePlayerStore((s) => s.setSeeking);
  const { isSeeking } = usePlayerStore((s) => s.interface);

  const commitTime = useCallback(
    (percentage) => {
      display?.setTime(percentage * duration);
    },
    [duration, display]
  );

  const ref = useRef<HTMLDivElement>(null);
  const { mouseMove, mouseLeave, mousePos } = useMouseHoverPosition(ref);

  const { dragging, dragPercentage, dragMouseDown } = useProgressBar(
    ref,
    commitTime
  );
  useEffect(() => {
    setSeeking(dragging);
  }, [setSeeking, dragging]);

  useEffect(() => {
    setDraggingTime((dragPercentage / 100) * duration);
  }, [setDraggingTime, duration, dragPercentage]);

  const mousePosition = Math.floor(dragPercentage * duration);

  return (
    <div className="w-full relative">
      <div className="top-0 absolute inset-x-0">
        {mousePos > -1 ? (
          <div
            className="absolute bottom-0"
            style={{
              left: `${mousePos}%`,
            }}
          >
            <ThumbnailDisplay at={mousePosition} />
          </div>
        ) : null}
      </div>

      <div className="w-full" ref={ref}>
        <div
          className="group w-full h-8 flex items-center cursor-pointer"
          onMouseDown={dragMouseDown}
          onTouchStart={dragMouseDown}
          onMouseLeave={mouseLeave}
          onMouseMove={mouseMove}
        >
          <div
            className={[
              "relative w-full h-1 bg-video-progress-background bg-opacity-25 rounded-full transition-[height] duration-100 group-hover:h-1.5",
              dragging ? "!h-1.5" : "",
            ].join(" ")}
          >
            {/* Pre-loaded content bar */}
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-video-progress-preloaded bg-opacity-50 flex justify-end items-center"
              style={{
                width: `${(buffered / duration) * 100}%`,
              }}
            />

            {/* Actual progress bar */}
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-video-progress-watched flex justify-end items-center"
              style={{
                width: `${
                  Math.max(
                    0,
                    Math.min(
                      1,
                      dragging ? dragPercentage / 100 : time / duration
                    )
                  ) * 100
                }%`,
              }}
            >
              <div
                className={[
                  "w-[1rem] min-w-[1rem] h-[1rem] rounded-full transform translate-x-1/2 scale-0 group-hover:scale-100 bg-white transition-[transform] duration-100",
                  isSeeking ? "scale-100" : "",
                ].join(" ")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
