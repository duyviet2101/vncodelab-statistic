"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { TierBadge } from "@/components/dashboard/tier-badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  Target,
  Database,
  Brain,
  Layers,
  ArrowRight,
  Filter,
  Info,
  Shuffle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  fetchOverview,
  fetchRooms,
  fetchTransitionMatrix,
  fetchStudents,
} from "@/lib/fetch-data"
import type { OverviewData, RoomInfo, TransitionMatrix, StudentRecord } from "@/lib/types"

const TIER_COLORS = {
  high: "oklch(0.7 0.18 145)",
  mid: "oklch(0.8 0.16 85)",
  disengaged: "oklch(0.65 0.18 25)",
} as const

/* ── Skeleton placeholders ─────────────────────────────── */

function FunnelSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-32 flex-1 rounded-lg" />
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-32 flex-1 rounded-lg" />
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-32 flex-1 rounded-lg" />
      </div>
    </Card>
  )
}

function KpiSkeleton() {
  return (
    <Card className="p-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card className="col-span-2 p-5">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-24 w-full" />
    </Card>
  )
}

function ContextSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-6 w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </Card>
  )
}

function RoomsSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </Card>
  )
}

/* ── Main component ────────────────────────────────────── */

export function Overview() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [rooms, setRooms] = useState<RoomInfo[] | null>(null)
  const [transition, setTransition] = useState<TransitionMatrix | null>(null)
  const [students, setStudents] = useState<StudentRecord[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchOverview(),
      fetchRooms(),
      fetchTransitionMatrix(),
      fetchStudents(),
    ])
      .then(([ov, rm, tr, st]) => {
        setOverview(ov)
        setRooms(rm)
        setTransition(tr)
        setStudents(st)
      })
      .finally(() => setLoading(false))
  }, [])

  /* ── Derived data ── */

  const totalTierLabels = overview
    ? overview.tier_counts.high +
      overview.tier_counts.mid +
      (overview.tier_counts.disengaged ?? 0)
    : 0

  const tierPcts =
    overview && totalTierLabels > 0
      ? {
          high: (overview.tier_counts.high / totalTierLabels) * 100,
          mid: (overview.tier_counts.mid / totalTierLabels) * 100,
          disengaged:
            ((overview.tier_counts.disengaged ?? 0) / totalTierLabels) * 100,
        }
      : { high: 0, mid: 0, disengaged: 0 }

  const predictionCount = students
    ? students.filter((s) => s.has_prediction).length
    : 0

  const labelStability = transition ? transition.label_stability : 0

  const topRooms = rooms
    ? [...rooms].sort((a, b) => b.n_students - a.n_students).slice(0, 10)
    : []

  const roomSizeBins =
    rooms && rooms.length > 0
      ? (() => {
          const sizes = rooms.map((r) => r.n_students)
          const min = Math.min(...sizes)
          const max = Math.max(...sizes)
          const range = max - min
          const step = range === 0 ? 1 : Math.max(1, Math.ceil(range / 6))
          const bins: { range: string; count: number }[] = []
          for (let lo = min; lo <= max; lo += step) {
            const hi = Math.min(lo + step - 1, max)
            const count = sizes.filter((s) => s >= lo && s <= hi).length
            bins.push({ range: `${lo}–${hi}`, count })
          }
          return bins
        })()
      : []

  const disPctThreshold = overview
    ? Number(overview.config.DIS_PCT) * 100
    : 15
  const highPctThreshold = overview
    ? (1 - Number(overview.config.HIGH_PCT)) * 100
    : 30

  /* ── Render ── */

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground">
          Data pipeline summary, engagement tiers, and model performance
        </p>
      </div>

      {/* ────────── 1. DATA PIPELINE FUNNEL ────────── */}
      {loading ? (
        <FunnelSkeleton />
      ) : (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Data Pipeline
          </h3>
          <div className="flex items-stretch gap-2">
            {/* Step 1 — Raw */}
            <div className="flex-1 p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
              <Database className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Raw Data
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {overview?.total_students_raw.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">students</p>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>{overview?.total_rooms_raw} rooms</p>
                <p>{overview?.total_events_raw.toLocaleString()} events</p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center justify-center gap-1 shrink-0 px-1">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <p className="text-[9px] text-muted-foreground leading-tight text-center w-16">
                ≥{overview?.config.MIN_SESSIONS} sessions, ≥
                {overview?.config.MIN_ROOM_SIZE} stu/room
              </p>
            </div>

            {/* Step 2 — Cohort */}
            <div className="flex-1 p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
              <Filter className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Filtered Cohort
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {overview?.cohort_students.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">students</p>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>{overview?.cohort_rooms} rooms</p>
                <p>
                  {overview?.cohort_courses.toLocaleString()} course enrollments
                </p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="flex flex-col items-center justify-center gap-1 shrink-0 px-1">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <p className="text-[9px] text-muted-foreground leading-tight text-center w-16">
                tier diversity filter
              </p>
            </div>

            {/* Step 3 — Predictions */}
            <div className="flex-1 p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
              <Brain className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Model Predictions
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {predictionCount}
              </p>
              <p className="text-xs text-muted-foreground">
                students with predictions
              </p>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>{overview?.best_model} model</p>
                <p>AUC {overview?.best_auc.toFixed(3)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ────────── 2. KEY INSIGHT CARDS ────────── */}
      <div className="grid grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Mid Tier Dominance"
              value={`${tierPcts.mid.toFixed(1)}%`}
              subtitle="Model's main job: distinguishing the extremes"
              icon={Layers}
            />
            <KpiCard
              title="Label Stability"
              value={`${(labelStability * 100).toFixed(1)}%`}
              subtitle="Keep same tier between early → full period"
              icon={Shuffle}
            />
            <KpiCard
              title="Predictions Made"
              value={predictionCount}
              subtitle={`Of ${overview?.cohort_students ?? 0} cohort students`}
              icon={Target}
            />
            <KpiCard
              title="Model AUC"
              value={(overview?.best_auc ?? 0).toFixed(2)}
              subtitle={`${overview?.best_model} — moderate discriminative power`}
              icon={Brain}
            />
          </>
        )}
      </div>

      {/* ────────── 3. TIER DISTRIBUTION + CONTEXT ────────── */}
      <div className="grid grid-cols-3 gap-6">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card className="col-span-2 p-5">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Engagement Tier Distribution
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {totalTierLabels.toLocaleString()} course-level tier labels —
              students can appear in multiple courses
            </p>

            {/* Horizontal stacked bar */}
            <div className="w-full h-11 rounded-lg overflow-hidden flex text-[11px] font-bold">
              <div
                className="h-full flex items-center justify-center"
                style={{
                  width: `${tierPcts.high}%`,
                  minWidth: tierPcts.high > 0 ? "4.5rem" : 0,
                  backgroundColor: TIER_COLORS.high,
                  color: "oklch(0.15 0.02 145)",
                }}
              >
                {tierPcts.high.toFixed(1)}%
              </div>
              <div
                className="h-full flex items-center justify-center"
                style={{
                  width: `${tierPcts.mid}%`,
                  backgroundColor: TIER_COLORS.mid,
                  color: "oklch(0.15 0.02 85)",
                }}
              >
                Mid {tierPcts.mid.toFixed(1)}%
              </div>
              <div
                className="h-full flex items-center justify-center"
                style={{
                  width: `${tierPcts.disengaged}%`,
                  minWidth: tierPcts.disengaged > 0 ? "4.5rem" : 0,
                  backgroundColor: TIER_COLORS.disengaged,
                  color: "oklch(0.15 0.02 25)",
                }}
              >
                {tierPcts.disengaged.toFixed(1)}%
              </div>
            </div>

            {/* Legend with counts */}
            <div className="flex items-center gap-6 mt-4">
              {[
                {
                  key: "high" as const,
                  label: "High",
                  count: overview?.tier_counts.high ?? 0,
                },
                {
                  key: "mid" as const,
                  label: "Mid",
                  count: overview?.tier_counts.mid ?? 0,
                },
                {
                  key: "disengaged" as const,
                  label: "Disengaged",
                  count: overview?.tier_counts.disengaged ?? 0,
                },
              ].map(({ key, label, count }) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: TIER_COLORS[key] }}
                  />
                  <span className="text-sm text-foreground">
                    {label}{" "}
                    <span className="text-muted-foreground">
                      ({count.toLocaleString()})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tier Definitions */}
        {loading ? (
          <ContextSkeleton />
        ) : (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Tier Definitions
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <TierBadge tier="High" size="sm" />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Top {highPctThreshold.toFixed(0)}% most active in their room
                  (attend_frac, code submissions, quiz, etc.)
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <TierBadge tier="Mid" size="sm" />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Everyone between the {highPctThreshold.toFixed(0)}th and{" "}
                  {disPctThreshold.toFixed(0)}th percentile
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <TierBadge tier="Disengaged" size="sm" />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Bottom {disPctThreshold.toFixed(0)}% least active in their
                  room
                </p>
              </div>

              <div className="p-3 rounded-lg border border-dashed border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Note:</span>{" "}
                  Tiers are assigned per-room per-course. A student may receive
                  different labels in different courses, so total labels (
                  {totalTierLabels.toLocaleString()}) exceeds cohort size (
                  {overview?.cohort_students}).
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ────────── 4. ROOM OVERVIEW ────────── */}
      {loading ? (
        <RoomsSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Top 10 rooms grid */}
          <Card className="col-span-2 p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Room Performance{" "}
              <span className="text-sm font-normal text-muted-foreground">
                — Top 10 by student count
              </span>
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {topRooms.map((room) => {
                const high = room.tier_counts?.high ?? 0
                const mid = room.tier_counts?.mid ?? 0
                const disengaged = room.tier_counts?.disengaged ?? 0
                const total = high + mid + disengaged
                const highRatio = total > 0 ? high / total : 0

                return (
                  <div
                    key={room.room_id}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {room.room_id}
                      </p>
                      {highRatio >= 0.2 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-tier-high shrink-0" />
                      ) : disengaged > 0 ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-tier-disengaged shrink-0" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-tier-mid shrink-0" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {room.n_students}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {room.n_sessions_avg.toFixed(1)} avg sessions
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {high > 0 && <TierBadge tier="High" size="sm" />}
                      {mid > 0 && <TierBadge tier="Mid" size="sm" />}
                      {disengaged > 0 && (
                        <TierBadge tier="Disengaged" size="sm" />
                      )}
                    </div>
                    <div className="mt-2 w-full h-1.5 rounded-full bg-secondary overflow-hidden flex">
                      {high > 0 && (
                        <div
                          className="h-full"
                          style={{
                            width: `${(high / total) * 100}%`,
                            backgroundColor: TIER_COLORS.high,
                          }}
                        />
                      )}
                      {mid > 0 && (
                        <div
                          className="h-full"
                          style={{
                            width: `${(mid / total) * 100}%`,
                            backgroundColor: TIER_COLORS.mid,
                          }}
                        />
                      )}
                      {disengaged > 0 && (
                        <div
                          className="h-full"
                          style={{
                            width: `${(disengaged / total) * 100}%`,
                            backgroundColor: TIER_COLORS.disengaged,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Room Size Distribution Histogram */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Room Size Distribution
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {rooms?.length ?? 0} cohort rooms
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomSizeBins} margin={{ bottom: 16 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.28 0.04 250)"
                  />
                  <XAxis
                    dataKey="range"
                    stroke="oklch(0.65 0.02 250)"
                    fontSize={10}
                    label={{
                      value: "students per room",
                      position: "insideBottom",
                      offset: -8,
                      fontSize: 10,
                      fill: "oklch(0.55 0.02 250)",
                    }}
                  />
                  <YAxis
                    stroke="oklch(0.65 0.02 250)"
                    fontSize={10}
                    allowDecimals={false}
                    label={{
                      value: "rooms",
                      angle: -90,
                      position: "insideLeft",
                      offset: 8,
                      fontSize: 10,
                      fill: "oklch(0.55 0.02 250)",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.035 250)",
                      border: "1px solid oklch(0.28 0.04 250)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} rooms`, "Count"]}
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    fill="oklch(0.6 0.15 250)"
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
