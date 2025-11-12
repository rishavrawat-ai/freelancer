"use client";
import { useMotionValue } from "motion/react";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "motion/react";
import { cn } from "@/lib/utils";

export const EvervaultCard = ({
  text,
  className,
  mousePosition,
  active = false,
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    let str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY
  }) {
    if (mousePosition) return;
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    const str = generateRandomString(1500);
    setRandomString(str);
  }

  useEffect(() => {
    if (!mousePosition) return;
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
    setRandomString(generateRandomString(1500));
  }, [mousePosition?.x, mousePosition?.y, mouseX, mouseY]);

  return (
    <div
      className={cn(
        "p-0.5 bg-gradient-to-br from-yellow-400/40 via-amber-500/30 to-orange-400/30 aspect-square flex items-center justify-center w-full h-full relative rounded-[32px]",
        className
      )}>
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full relative overflow-hidden bg-gradient-to-br from-[#1b1300] via-[#2a1900] to-[#3a2500] flex items-center justify-center h-full">
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
          active={active}
        />
        <div className="relative z-10 flex items-center justify-center">
          <div
            className="relative h-44 w-44 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
            <div
              className="absolute w-full h-full bg-gradient-to-br from-yellow-200/70 via-amber-400/60 to-orange-500/60 blur-sm rounded-full" />
            <span className="text-amber-950 font-semibold tracking-wide z-20">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function CardPattern({
  mouseX,
  mouseY,
  randomString,
  active = false,
}) {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div
        className={cn(
          "absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] bg-gradient-to-b from-yellow-200/20 to-transparent transition-opacity duration-500",
          active ? "opacity-60" : "opacity-20"
        )}></div>
      <motion.div
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 backdrop-blur-xl transition duration-500",
          active ? "opacity-100" : "opacity-0"
        )}
        style={style} />
      <motion.div
        className={cn(
          "absolute inset-0 rounded-2xl mix-blend-overlay transition duration-500",
          active ? "opacity-100" : "opacity-0"
        )}
        style={style}>
        <p
          className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-yellow-200/80 font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateRandomString = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const Icon = ({
  className,
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
