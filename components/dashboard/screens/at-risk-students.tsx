"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { TierBadge } from "@/components/dashboard/tier-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertTriangle,
  ChevronDown,
  Filter,
  Download,
  Info,
  Users,
} from "lucide-react"
import { fetchStudents, fetchThresholdAnalysis, fetchRooms } from "@/lib/fetch-data"
import type { StudentRecord, ThresholdPoint, RoomInfo } from "@/lib/types"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from "recharts"

function capitalize(s: string): "High" | "Mid" | "Disengaged" {
  if (s === "disengaged") return "Disengaged"
  if (s === "high") return "High"
  return "Mid"
}

function riskColor(p: number): string {
  const minP = 0.44
  const maxP = 0.56
  const t = Math.min(1, Math.max(0, (p - minP) / (maxP - minP)))
  const r = Math.round(220 + t * 35)
  const g = Math.round(180 - t * 130)
  const b = Math.round(180 - t * 130)
  return `rgb(${r}, ${g}, ${b})`
}

export function AtRiskStudents() {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [thresholdData, setThresholdData] = useState<ThresholdPoint[]>([])
  const [rooms, setRooms] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [threshold, setThreshold] = useState([0.5])
  const [selectedRoom, setSelectedRoom] = useState("All Rooms")

  useEffect(() => {
    Promise.all([fetchStudents(), fetchThresholdAnalysis(), fetchRooms()])
      .then(([studentsData, threshData, roomsData]) => {
        setStudents(studentsData)
        setThresholdData(threshData)
        setRooms(["All Rooms", ...roomsData.map((r: RoomInfo) => r.room_id)])
      })
      .finally(() => setLoading(false))
  }, [])

  const totalStudents = students.length
  const studentsWithPredictions = useMemo(
    () => students.filter((s) => s.has_prediction),
    [students],
  )
  const studentsWithoutPredictions = totalStudents - studentsWithPredictions.length
  const coveragePct =
    totalStudents > 0
      ? ((studentsWithPredictions.length / totalStudents) * 100).toFixed(1)
      : "0"

  const currentMetrics = useMemo(() => {
    if (thresholdData.length === 0) return null
    const exact = thresholdData.find(
      (t) => Math.abs(t.threshold - threshold[0]) < 0.01,
    )
    if (exact) return exact
    const sorted = [...thresholdData].sort(
      (a, b) =>
        Math.abs(a.threshold - threshold[0]) -
        Math.abs(b.threshold - threshold[0]),
    )
    return sorted[0] ?? null
  }, [thresholdData, threshold])

  const filteredStudents = useMemo(
    () =>
      students
        .filter((s) => {
          if (!s.has_prediction) return false
          if (s.p_disengaged === null) return false
          const meetsThreshold = s.p_disengaged >= threshold[0]
          const meetsRoom =
            selectedRoom === "All Rooms" || s.room_id === selectedRoom
          return meetsThreshold && meetsRoom
        })
        .sort((a, b) => (b.p_disengaged ?? 0) - (a.p_disengaged ?? 0)),
    [students, threshold, selectedRoom],
  )

  const chartData = useMemo(
    () =>
      thresholdData
        .filter((t) => t.threshold >= 0.3 && t.threshold <= 0.7)
        .map((t) => ({
          threshold: `${(t.threshold * 100).toFixed(0)}%`,
          thresholdRaw: t.threshold,
          Recall: t.recall,
          Precision: t.precision,
          F1: t.f1,
        })),
    [thresholdData],
  )

  const handleExport = () => {
    const headers = [
      "Student ID",
      "Name",
      "Room",
      "Predicted Tier",
      "True Tier",
      "P(Disengaged)",
      "P(High)",
      "Sessions (Early)",
      "Attend Frac (Early)",
    ]
    const rows = filteredStudents.map((s) => [
      s.student_id,
      s.student_name,
      s.room_id,
      s.predicted_tier,
      s.label_full || "N/A",
      s.p_disengaged !== null ? (s.p_disengaged * 100).toFixed(1) + "%" : "N/A",
      s.p_high !== null ? (s.p_high * 100).toFixed(1) + "%" : "N/A",
      s.n_sessions_early,
      (s.attend_frac_early * 100).toFixed(1) + "%",
    ])
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "at-risk-students.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            At-Risk Students
          </h2>
          <p className="text-muted-foreground">
            Early warning system for students predicted as disengaged
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export List
        </Button>
      </div>

      {/* Context Banner */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              About this Early Warning System
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              This system monitors{" "}
              <span className="font-semibold">
                {studentsWithPredictions.length}
              </span>{" "}
              students who have model predictions out of{" "}
              <span className="font-semibold">{totalStudents}</span> total. The
              model is a binary classifier (Disengaged vs High) with moderate
              accuracy (AUC: 0.71). Most probability scores cluster around 50%,
              so even small differences in P(Disengaged) are meaningful.
            </p>
          </div>
        </div>
      </Card>

      {/* Prediction Coverage + Filters row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Coverage Card */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">
              Prediction Coverage
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {studentsWithPredictions.length}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {totalStudents}
                </span>
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {coveragePct}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium">{studentsWithoutPredictions}</span>{" "}
              students are in rooms without enough tier diversity for the model
              to generate predictions.
            </p>
          </div>
        </Card>

        {/* Filters Card */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Filters</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  P(Disengaged) Threshold
                </label>
                <span className="text-sm font-mono font-medium text-primary">
                  {">="} {(threshold[0] * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={threshold}
                onValueChange={setThreshold}
                min={0.3}
                max={0.6}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30%</span>
                <span>60%</span>
              </div>
              {currentMetrics && (
                <div className="flex gap-4 pt-1">
                  <span className="text-xs text-muted-foreground">
                    Recall:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {(currentMetrics.recall * 100).toFixed(0)}%
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Precision:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {(currentMetrics.precision * 100).toFixed(0)}%
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    F1:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {currentMetrics.f1.toFixed(2)}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedRoom}
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {rooms.map((room) => (
                  <DropdownMenuItem
                    key={room}
                    onClick={() => setSelectedRoom(room)}
                  >
                    {room}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="w-4 h-4 text-tier-disengaged" />
        <span>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredStudents.length}
          </span>{" "}
          students with P(Disengaged) {">="} {(threshold[0] * 100).toFixed(0)}%
        </span>
      </div>

      {/* Student Table */}
      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-8" />
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Room
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Predicted
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  True Tier
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  P(Disengaged)
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  P(High)
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Sessions
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Attend %
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.student_id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <AlertTriangle className="w-4 h-4 text-tier-disengaged" />
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {student.student_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {student.room_id}
                    </td>
                    <td className="py-3 px-4">
                      <TierBadge tier={capitalize(student.predicted_tier)} />
                    </td>
                    <td className="py-3 px-4">
                      {student.label_full ? (
                        <TierBadge
                          tier={capitalize(student.label_full)}
                          size="sm"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {student.p_disengaged !== null ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-sm font-mono font-medium"
                          style={{
                            backgroundColor: riskColor(student.p_disengaged),
                            color: student.p_disengaged > 0.52 ? "#fff" : "#1a1a1a",
                          }}
                        >
                          {(student.p_disengaged * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-mono text-muted-foreground">
                      {student.p_high !== null
                        ? (student.p_high * 100).toFixed(1) + "%"
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {student.n_sessions_early}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {(student.attend_frac_early * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-tier-high-bg/20 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-tier-high" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No at-risk students at this threshold
                      </p>
                      <p className="text-xs text-muted-foreground">
                        No students have P(Disengaged) above{" "}
                        {(threshold[0] * 100).toFixed(0)}%. Try lowering the
                        threshold — most scores cluster around 50%.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Threshold Analysis Chart */}
      {chartData.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">
            Threshold Analysis
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Recall, precision, and F1 across thresholds. The vertical line marks
            your current selection. Note: above ~55% no students are flagged.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="threshold"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Threshold",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 12,
                }}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${(value * 100).toFixed(1)}%`,
                  name,
                ]}
              />
              <Legend />
              <ReferenceLine
                x={`${(threshold[0] * 100).toFixed(0)}%`}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: "Current",
                  position: "top",
                  fontSize: 11,
                  fill: "hsl(var(--primary))",
                }}
              />
              <Line
                type="monotone"
                dataKey="Recall"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Precision"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="F1"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
