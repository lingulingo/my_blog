"use client";

import { useEffect, useMemo, useState } from "react";

type WeatherState = {
  emoji: string;
  label: string;
  temperature: string;
  city: string;
};

const DEFAULT_LOCATION = {
  city: "上海",
  latitude: 31.2304,
  longitude: 121.4737,
};
const LOCATION_STORAGE_KEY = "blog-weather-location";
const LOCATION_OPTIONS = [
  { key: "auto", label: "当前位置" },
  { key: "shanghai", label: "上海", city: "上海", latitude: 31.2304, longitude: 121.4737 },
  { key: "beijing", label: "北京", city: "北京", latitude: 39.9042, longitude: 116.4074 },
  { key: "hangzhou", label: "杭州", city: "杭州", latitude: 30.2741, longitude: 120.1551 },
  { key: "guangzhou", label: "广州", city: "广州", latitude: 23.1291, longitude: 113.2644 },
  { key: "shenzhen", label: "深圳", city: "深圳", latitude: 22.5431, longitude: 114.0579 },
  { key: "chengdu", label: "成都", city: "成都", latitude: 30.5728, longitude: 104.0668 },
] as const;

type LocationOption = (typeof LOCATION_OPTIONS)[number];

const WEATHER_CODE_MAP: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "☀️", label: "晴朗" },
  1: { emoji: "🌤️", label: "晴间多云" },
  2: { emoji: "⛅", label: "多云" },
  3: { emoji: "☁️", label: "阴天" },
  45: { emoji: "🌫️", label: "薄雾" },
  48: { emoji: "🌫️", label: "浓雾" },
  51: { emoji: "🌦️", label: "毛毛雨" },
  53: { emoji: "🌦️", label: "小雨" },
  55: { emoji: "🌧️", label: "中雨" },
  56: { emoji: "🧊", label: "冻毛雨" },
  57: { emoji: "🧊", label: "冻雨" },
  61: { emoji: "🌦️", label: "阵雨" },
  63: { emoji: "🌧️", label: "降雨" },
  65: { emoji: "⛈️", label: "大雨" },
  66: { emoji: "🧊", label: "冰雨" },
  67: { emoji: "🧊", label: "强冰雨" },
  71: { emoji: "🌨️", label: "小雪" },
  73: { emoji: "❄️", label: "降雪" },
  75: { emoji: "❄️", label: "大雪" },
  77: { emoji: "☃️", label: "雪粒" },
  80: { emoji: "🌦️", label: "阵雨" },
  81: { emoji: "🌧️", label: "强阵雨" },
  82: { emoji: "⛈️", label: "暴雨" },
  85: { emoji: "🌨️", label: "阵雪" },
  86: { emoji: "❄️", label: "强阵雪" },
  95: { emoji: "⛈️", label: "雷暴" },
  96: { emoji: "⛈️", label: "冰雹雷暴" },
  99: { emoji: "⛈️", label: "强雷暴" },
};

function resolveWeatherPresentation(weatherCode?: number | null) {
  if (weatherCode == null) {
    return { emoji: "🌈", label: "天气加载中" };
  }
  return WEATHER_CODE_MAP[weatherCode] || { emoji: "🌈", label: "天气晴好" };
}

async function fetchWeather(latitude: number, longitude: number) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("天气获取失败");
  }
  return (await response.json()) as {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
    };
  };
}

async function reverseGeocode(latitude: number, longitude: number) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=zh&format=json`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("地理信息获取失败");
  }
  return (await response.json()) as {
    results?: Array<{
      city?: string;
      name?: string;
      admin1?: string;
    }>;
  };
}

type WeatherClockProps = {
  compact?: boolean;
};

export function WeatherClock({ compact = false }: WeatherClockProps) {
  const [now, setNow] = useState(() => new Date());
  const [locationKey, setLocationKey] = useState<string>("auto");
  const [weather, setWeather] = useState<WeatherState>({
    emoji: "🌈",
    label: "天气加载中",
    temperature: "--°C",
    city: DEFAULT_LOCATION.city,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation && LOCATION_OPTIONS.some((option) => option.key === savedLocation)) {
      setLocationKey(savedLocation);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applyWeather = async (latitude: number, longitude: number, fallbackCity: string) => {
      const [weatherData, geocodeData] = await Promise.allSettled([
        fetchWeather(latitude, longitude),
        reverseGeocode(latitude, longitude),
      ]);

      if (cancelled) {
        return;
      }

      const current =
        weatherData.status === "fulfilled"
          ? weatherData.value.current
          : undefined;
      const presentation = resolveWeatherPresentation(current?.weather_code);
      const city =
        geocodeData.status === "fulfilled"
          ? geocodeData.value.results?.[0]?.city ||
            geocodeData.value.results?.[0]?.name ||
            geocodeData.value.results?.[0]?.admin1 ||
            fallbackCity
          : fallbackCity;

      setWeather({
        emoji: presentation.emoji,
        label: presentation.label,
        temperature:
          typeof current?.temperature_2m === "number"
            ? `${Math.round(current.temperature_2m)}°C`
            : "--°C",
        city,
      });
    };

    const load = async () => {
      const selectedOption = LOCATION_OPTIONS.find((option) => option.key === locationKey) as LocationOption | undefined;
      if (selectedOption && selectedOption.key !== "auto" && "latitude" in selectedOption) {
        await applyWeather(
          selectedOption.latitude,
          selectedOption.longitude,
          selectedOption.city,
        );
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("geolocation-unavailable"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 10 * 60 * 1000,
          });
        });

        await applyWeather(
          position.coords.latitude,
          position.coords.longitude,
          DEFAULT_LOCATION.city,
        );
      } catch {
        await applyWeather(
          DEFAULT_LOCATION.latitude,
          DEFAULT_LOCATION.longitude,
          DEFAULT_LOCATION.city,
        );
      }
    };

    void load();
    const refreshTimer = window.setInterval(() => {
      void load();
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [locationKey]);

  const timeText = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now),
    [now],
  );

  const dateText = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).format(now),
    [now],
  );

  if (compact) {
    return (
      <div
        className="hidden items-center gap-2 rounded-full px-3 py-1.5 lg:flex"
        style={{
          border: "1px solid var(--color-line)",
          background: "linear-gradient(135deg, rgba(212,177,106,0.12), rgba(255,255,255,0.04))",
        }}
      >
        <span className="tabular-nums text-xs font-semibold text-[var(--color-cream)]">{timeText}</span>
        <span className="text-xs text-[var(--color-muted)]">·</span>
        <span className="text-sm leading-none">{weather.emoji}</span>
        <span className="text-xs text-[var(--color-foreground)]">{weather.temperature}</span>
        <span className="max-w-[72px] truncate text-xs text-[var(--color-muted)]">{weather.city}</span>
        <select
          value={locationKey}
          onChange={(event) => {
            const nextValue = event.target.value;
            setLocationKey(nextValue);
            window.localStorage.setItem(LOCATION_STORAGE_KEY, nextValue);
          }}
          className="max-w-[88px] rounded-full px-2 py-0.5 text-[11px] outline-none"
          style={{
            border: "1px solid var(--color-line)",
            background: "rgba(255,255,255,0.06)",
            color: "var(--color-foreground)",
          }}
          aria-label="选择天气定位"
        >
          {LOCATION_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      className="hidden min-w-[188px] rounded-[1.25rem] px-4 py-3 lg:flex lg:flex-col lg:items-end"
      style={{
        border: "1px solid var(--color-line)",
        background: "linear-gradient(135deg, rgba(212,177,106,0.12), rgba(255,255,255,0.05))",
      }}
    >
      <p className="text-lg font-semibold tabular-nums text-[var(--color-cream)]">{timeText}</p>
      <p className="mt-1 text-[11px] tracking-[0.18em] text-[var(--color-muted)] uppercase">{dateText}</p>
      <div className="mt-3 flex items-center gap-2 rounded-full px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
        <span className="text-lg leading-none">{weather.emoji}</span>
        <div className="leading-tight">
          <p className="text-sm text-[var(--color-foreground)]">{weather.temperature} · {weather.label}</p>
          <p className="text-[11px] text-[var(--color-muted)]">{weather.city}</p>
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
        <span>📍</span>
        <select
          value={locationKey}
          onChange={(event) => {
            const nextValue = event.target.value;
            setLocationKey(nextValue);
            window.localStorage.setItem(LOCATION_STORAGE_KEY, nextValue);
          }}
          className="rounded-full px-3 py-1 outline-none"
          style={{
            border: "1px solid var(--color-line)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--color-foreground)",
          }}
        >
          {LOCATION_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
