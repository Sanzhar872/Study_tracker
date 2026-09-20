import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import type { EntryWithContext, Subject } from "../types";
import {
  aggregateBySubject,
  aggregateTotal,
  bucketRange,
  formatHours,
  getBuckets,
  getYScale,
  GRANULARITY_LABELS,
  type Granularity,
} from "../utils/chartBuckets";

const MAX_SUBJECTS = 5;
const TOTAL_COLOR = "#FF9500";
const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 800;
const COMPACT_BREAKPOINT = 480;
const HEIGHT = 280;
const HEIGHT_COMPACT = 220;
const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 30;
const BAR_RADIUS = 5;
const BAR_FILL_RATIO = 0.58;
const BAR_MAX_W = 56;

type ViewMode = "total" | "subjects";

interface Props {
  subjects: Subject[];
  refreshKey?: number;
}

// Rectangle path with rounded top corners only, flat bottom (flush with the baseline).
function topRoundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0 || w <= 0) return "";
  const radius = Math.min(r, w / 2, h);
  if (radius <= 0) return `M ${x},${y} h ${w} v ${h} h ${-w} Z`;
  return `M ${x},${y + radius}
    A ${radius},${radius} 0 0 1 ${x + radius},${y}
    L ${x + w - radius},${y}
    A ${radius},${radius} 0 0 1 ${x + w},${y + radius}
    L ${x + w},${y + h}
    L ${x},${y + h}
    Z`;
}

export default function HoursChart({ subjects, refreshKey }: Props) {
  const [mode, setMode] = useState<ViewMode>("total");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [entries, setEntries] = useState<EntryWithContext[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const wrapRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const hasSubjects = subjects.length > 0;

  // Рисуем в реальных пикселях, а не в растягиваемом viewBox: иначе текст и точки
  // сплющиваются на узких экранах и растягиваются на широких.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(Math.round(el.clientWidth), MIN_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasSubjects]);

  const height = width < COMPACT_BREAKPOINT ? HEIGHT_COMPACT : HEIGHT;
  const plotW = width - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;

  useEffect(() => {
    if (!initialized.current && subjects.length > 0) {
      setSelectedIds(subjects.slice(0, MAX_SUBJECTS).map((s) => s.id));
      initialized.current = true;
    }
  }, [subjects]);

  const buckets = useMemo(() => getBuckets(granularity), [granularity]);

  useEffect(() => {
    const { startISO, endISO } = bucketRange(buckets);
    setLoading(true);
    api.entries
      .listRange(startISO, endISO)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [buckets, refreshKey]);

  const totalSeries = useMemo(() => aggregateTotal(entries, buckets), [entries, buckets]);

  const subjectSeries = useMemo(
    () => aggregateBySubject(entries, buckets, selectedIds),
    [entries, buckets, selectedIds]
  );

  const visibleSubjects = subjects.filter((s) => selectedIds.includes(s.id));

  const grandTotal =
    mode === "total"
      ? totalSeries.reduce((a, b) => a + b, 0)
      : selectedIds.reduce((sum, id) => sum + (subjectSeries[id]?.reduce((a, b) => a + b, 0) ?? 0), 0);

  const yScale = useMemo(() => {
    let max = 0;
    if (mode === "total") {
      for (const v of totalSeries) max = Math.max(max, v);
    } else {
      for (const id of selectedIds) {
        for (const v of subjectSeries[id] ?? []) max = Math.max(max, v);
      }
    }
    return getYScale(max);
  }, [mode, totalSeries, subjectSeries, selectedIds]);

  function toggleSubject(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SUBJECTS) return prev;
      return [...prev, id];
    });
  }

  function yForValue(v: number): number {
    return PAD_T + plotH - (v / yScale.max) * plotH;
  }

  // Bars, line points, labels and hover zones all share the same bands.
  const bandW = plotW / buckets.length;
  const barW = Math.min(bandW * BAR_FILL_RATIO, BAR_MAX_W);
  const baseY = yForValue(0);

  function bandCenterX(i: number): number {
    return PAD_L + (i + 0.5) * bandW;
  }

  const blockedBySelection = mode === "subjects" && selectedIds.length === 0;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Время учёбы</h3>
        <div className="chart-toggle">
          <button
            className={`chart-toggle-btn ${mode === "total" ? "active" : ""}`}
            onClick={() => setMode("total")}
          >
            Всего
          </button>
          <button
            className={`chart-toggle-btn ${mode === "subjects" ? "active" : ""}`}
            onClick={() => setMode("subjects")}
          >
            По предметам
          </button>
        </div>
        <div className="chart-toggle">
          {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => (
            <button
              key={g}
              className={`chart-toggle-btn ${granularity === g ? "active" : ""}`}
              onClick={() => setGranularity(g)}
            >
              {GRANULARITY_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="empty-hint">Сначала добавь предметы на странице «Предметы и темы».</div>
      ) : (
        <>
          {mode === "subjects" && (
            <div className="chart-chips">
              {subjects.map((s) => {
                const active = selectedIds.includes(s.id);
                const disabled = !active && selectedIds.length >= MAX_SUBJECTS;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`chart-chip ${active ? "active" : ""}`}
                    style={{ "--chip-color": s.color } as React.CSSProperties}
                    disabled={disabled}
                    onClick={() => toggleSubject(s.id)}
                    title={disabled ? "Можно выбрать не больше 5 предметов" : s.name}
                  >
                    <span className="chart-chip-dot" />
                    {s.name}
                  </button>
                );
              })}
              <span className="chart-chip-count">
                {selectedIds.length} / {MAX_SUBJECTS}
              </span>
            </div>
          )}

          <div className="chart-svg-wrap" ref={wrapRef}>
            {blockedBySelection ? (
              <div className="chart-empty">Выбери хотя бы один предмет</div>
            ) : loading ? (
              <div className="chart-empty">Загрузка…</div>
            ) : grandTotal === 0 ? (
              <div className="chart-empty">Нет записей за этот период</div>
            ) : (
              <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="chart-svg">
                {yScale.ticks.map((hour) => {
                  const y = yForValue(hour);
                  return (
                    <g key={hour}>
                      <line
                        x1={PAD_L}
                        x2={width - PAD_R}
                        y1={y}
                        y2={y}
                        className="chart-gridline"
                      />
                      <text x={PAD_L - 8} y={y} className="chart-axis-label" textAnchor="end" dy="0.32em">
                        {hour}
                      </text>
                    </g>
                  );
                })}

                {buckets.map((b, i) => (
                  <text
                    key={b.key}
                    x={bandCenterX(i)}
                    y={height - PAD_B + 18}
                    className={`chart-axis-label ${hoverIndex === i ? "is-active" : ""}`}
                    textAnchor="middle"
                  >
                    {b.label}
                  </text>
                ))}

                {mode === "total" &&
                  buckets.map((b, i) => {
                    const value = totalSeries[i] ?? 0;
                    const barX = bandCenterX(i) - barW / 2;
                    const topY = yForValue(value);
                    const clipId = `bar-clip-${granularity}-${i}`;
                    const groupClass = [
                      "chart-bar-group",
                      hoverIndex === i ? "is-hovered" : hoverIndex !== null ? "is-dimmed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <g key={b.key} className={groupClass}>
                        {value > 0 && (
                          <>
                            <clipPath id={clipId}>
                              <path d={topRoundedRectPath(barX, topY, barW, baseY - topY, BAR_RADIUS)} />
                            </clipPath>
                            <g clipPath={`url(#${clipId})`}>
                              <rect x={barX} y={topY} width={barW} height={Math.max(baseY - topY, 0)} fill={TOTAL_COLOR} />
                            </g>
                          </>
                        )}
                        <rect
                          x={PAD_L + i * bandW}
                          y={PAD_T}
                          width={bandW}
                          height={plotH}
                          fill="transparent"
                          onMouseEnter={() => setHoverIndex(i)}
                          onMouseLeave={() => setHoverIndex(null)}
                        />
                      </g>
                    );
                  })}

                {mode === "subjects" && (
                  <>
                    {visibleSubjects.map((s) => {
                      const values = subjectSeries[s.id] ?? [];
                      const d = values
                        .map((v, i) => `${i === 0 ? "M" : "L"} ${bandCenterX(i)},${yForValue(v)}`)
                        .join(" ");
                      return (
                        <g key={s.id}>
                          <path d={d} className="chart-line" stroke={s.color} />
                          {values.map((v, i) => (
                            <circle
                              key={i}
                              cx={bandCenterX(i)}
                              cy={yForValue(v)}
                              r={hoverIndex === i ? 5 : 3}
                              fill={s.color}
                              className="chart-point"
                            />
                          ))}
                        </g>
                      );
                    })}

                    {hoverIndex !== null && (
                      <line
                        x1={bandCenterX(hoverIndex)}
                        x2={bandCenterX(hoverIndex)}
                        y1={PAD_T}
                        y2={height - PAD_B}
                        className="chart-crosshair"
                      />
                    )}

                    {buckets.map((_, i) => (
                      <rect
                        key={i}
                        x={PAD_L + i * bandW}
                        y={PAD_T}
                        width={bandW}
                        height={plotH}
                        fill="transparent"
                        onMouseEnter={() => setHoverIndex(i)}
                        onMouseLeave={() => setHoverIndex(null)}
                      />
                    ))}
                  </>
                )}
              </svg>
            )}

            {hoverIndex !== null && !blockedBySelection && grandTotal > 0 && (
              <div
                className="chart-tooltip"
                style={{
                  left: bandCenterX(hoverIndex),
                }}
              >
                <div className="chart-tooltip-title">{buckets[hoverIndex].fullLabel}</div>
                {mode === "total" ? (
                  <div className="chart-tooltip-total">
                    {formatHours(totalSeries[hoverIndex] ?? 0)} ч всего
                  </div>
                ) : (
                  visibleSubjects.map((s) => (
                    <div key={s.id} className="chart-tooltip-row">
                      <span className="chart-chip-dot" style={{ background: s.color }} />
                      <span className="chart-tooltip-name">{s.name}</span>
                      <span className="chart-tooltip-value">
                        {formatHours(subjectSeries[s.id]?.[hoverIndex] ?? 0)} ч
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
