"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

/** 首页主视觉轮播名句，约 2.8 秒切换 */
const HERO_ROTATION_MS = 2800;

const HERO_LINES = [
  "三更灯火五更鸡，正是男儿读书时。",
  "黑发不知勤学早，白首方悔读书迟。",
  "书山有路勤为径，学海无涯苦作舟。",
  "少壮不努力，老大徒伤悲。",
  "业精于勤，荒于嬉；行成于思，毁于随。",
  "不积跬步，无以至千里；不积小流，无以成江海。",
  "锲而舍之，朽木不折；锲而不舍，金石可镂。",
  "路漫漫其修远兮，吾将上下而求索。",
  "千淘万漉虽辛苦，吹尽狂沙始到金。",
  "宝剑锋从磨砺出，梅花香自苦寒来。",
  "长风破浪会有时，直挂云帆济沧海。",
  "欲穷千里目，更上一层楼。",
  "读书破万卷，下笔如有神。",
  "纸上得来终觉浅，绝知此事要躬行。",
  "问渠那得清如许？为有源头活水来。",
  "旧书不厌百回读，熟读深思子自知。",
  "博观而约取，厚积而薄发。",
  "古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。",
  "立身以立学为先，立学以读书为本。",
  "发奋识遍天下字，立志读尽人间书。",
  "学如逆水行舟，不进则退。",
  "吾生也有涯，而知也无涯。",
  "天行健，君子以自强不息。",
  "穷且益坚，不坠青云之志。",
  "不经一番寒彻骨，怎得梅花扑鼻香。",
  "少年易老学难成，一寸光阴不可轻。",
  "莫等闲、白了少年头，空悲切。",
  "只要功夫深，铁杵磨成针。",
  "冰冻三尺，非一日之寒。",
  "合抱之木，生于毫末；九层之台，起于累土。",
] as const;

export function AnimatedHero() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % HERO_LINES.length);
    }, HERO_ROTATION_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="hero-surface relative overflow-hidden rounded-[2rem] px-6 py-16 shadow-2xl shadow-black/10 sm:px-10 lg:px-14" style={{ border: "1px solid var(--color-line)" }}>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_45%,transparent_100%)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-3xl"
      >
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[var(--color-gold)]">Linghan Valley Journal</p>

        <div
          className="relative min-h-[9.5rem] sm:min-h-[11rem] md:min-h-[10.5rem]"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait">
            <motion.h1
              key={lineIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl text-4xl font-semibold leading-snug text-[var(--color-cream)] sm:text-5xl sm:leading-tight lg:text-6xl"
            >
              {HERO_LINES[lineIndex]}
            </motion.h1>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard/editor/new"
            className="rounded-full bg-[var(--color-gold)] px-6 py-3 text-center font-medium text-[var(--color-ink)] transition hover:translate-y-[-1px]"
          >
            开始写第一篇
          </Link>
          <Link
            href="/posts"
            className="rounded-full border border-white/15 px-6 py-3 text-center text-[var(--color-cream)] transition hover:border-white/30 hover:bg-white/5"
          >
            浏览内容广场
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
