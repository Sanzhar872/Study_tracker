import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import type { EntryWithContext, Subject } from "../types";
import {
  aggregateBySubject,
  aggregateTotal,
  bucketRange,
  formatHours,
  getBuckets,
  niceCeil,
  GRANULARITY_LABELS,
  type Granularity,
} from "../utils/chartBuckets";

const MAX_SUBJECTS = 5;
const TOTAL_COLOR = "#FF9500";
const VIEW_W = 800;
const VIEW_H = 280;
const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 30;
const PLOT_W = VIEW_W - PAD_L - PAD_R;
const PLOT_H = VIEW_H - PAD_T - PAD_B;
const BAR_RADIUS = 5;
const BAR_FILL_RATIO = 0.58;
const HOUR_TICKS = [1, 2, 3, 4, 5, 6, 7];

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
  const initialized = useRef(false);

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

  const maxValue = useMemo(() => {
    let max = 0;
    if (mode === "total") {
      for (const v of totalSeries) max = Math.max(max, v);
    } else {
      for (const id of selectedIds) {
        for (const v of subjectSeries[id] ?? []) max = Math.max(max, v);
      }
    }
    return Math.max(niceCeil(max), HOUR_TICKS[HOUR_TICKS.length - 1]);
  }, [mode, totalSeries, subjectSeries, selectedIds]);

  function toggleSubject(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SUBJECTS) return prev;
      return [...prev, id];
    });
  }

  function yForValue(v: number): number {
    return PAD_T + PLOT_H - (v / maxValue) * PLOT_H;
  }

  // Bar mode: bands span the full width, bars centered within each band.
  const bandW = PLOT_W / buckets.length;
  const barW = bandW * BAR_FILL_RATIO;
  const baseY = yForValue(0);

  function bandCenterX(i: number): number {
    return PAD_L + (i + 0.5) * bandW;
  }

  // Line mode: points anchored edge-to-edge across the plot width.
  function xForIndex(i: number): number {
    if (buckets.length === 1) return PAD_L + PLOT_W / 2;
    return PAD_L + (i / (buckets.length - 1)) * PLOT_W;
  }

  const labelX = mode === "total" ? bandCenterX : xForIndex;

  const labelStep = buckets.length > 10 ? 2 : 1;

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

          <div className="chart-svg-wrap">
            {blockedBySelection ? (
              <div className="chart-empty">Выбери хотя бы один предмет</div>
            ) : loading ? (
              <div className="chart-empty">Загрузка…</div>
            ) : grandTotal === 0 ? (
              <div className="chart-empty">Нет записей за этот период</div>
            ) : (
              <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="chart-svg" preserveAspectRatio="none">
                {HOUR_TICKS.map((hour) => {
                  const y = yForValue(hour);
                  return (
                    <g key={hour}>
                      <line
                        x1={PAD_L}
                        x2={VIEW_W - PAD_R}
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

                {buckets.map((b, i) =>
                  i % labelStep === 0 || i === buckets.length - 1 ? (
                    <text
                      key={b.key}
                      x={labelX(i)}
                      y={VIEW_H - PAD_B + 18}
                      className={`chart-axis-label ${hoverIndex === i ? "is-active" : ""}`}
                      textAnchor="middle"
                    >
                      {b.label}
                    </text>
                  ) : null
                )}

                {mode === "total" &&
                  buckets.map((b, i) => {
                    const value = totalSeries[i] ?? 0;
                    const barX = PAD_L + i * bandW + (bandW - barW) / 2;
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
                          height={PLOT_H}
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
                        .map((v, i) => `${i === 0 ? "M" : "L"} ${xForIndex(i)},${yForValue(v)}`)
                        .join(" ");
                      return (
                        <g key={s.id}>
                          <path d={d} className="chart-line" stroke={s.color} />
                          {values.map((v, i) => (
                            <circle
                              key={i}
                              cx={xForIndex(i)}
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
                        x1={xForIndex(hoverIndex)}
                        x2={xForIndex(hoverIndex)}
                        y1={PAD_T}
                        y2={VIEW_H - PAD_B}
                        className="chart-crosshair"
                      />
                    )}

                    {buckets.map((_, i) => (
                      <rect
                        key={i}
                        x={PAD_L + (i / buckets.length) * PLOT_W}
                        y={PAD_T}
                        width={PLOT_W / buckets.length}
                        height={PLOT_H}
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
                  left: `${((hoverIndex + 0.5) / buckets.length) * 100}%`,
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
