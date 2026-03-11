import type {
  OverviewData,
  RoomInfo,
  StudentRecord,
  SessionActivityByTier,
  ModelMetric,
  ConfusionMatrices,
  RocData,
  ShapFeature,
  ShapLocalExplanation,
  FeatureDescriptions,
  ThresholdPoint,
  TransitionMatrix,
  StudentSessionsDetail,
} from "./types"

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000

async function fetchJson<T>(path: string): Promise<T> {
  const now = Date.now()
  const cached = cache.get(path)
  if (cached && now - cached.ts < CACHE_TTL) {
    return cached.data as T
  }
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  const data = await res.json()
  cache.set(path, { data, ts: now })
  return data as T
}

export const fetchOverview = () =>
  fetchJson<OverviewData>("/data/overview.json")

export const fetchRooms = () =>
  fetchJson<RoomInfo[]>("/data/rooms_list.json")

export const fetchStudents = () =>
  fetchJson<StudentRecord[]>("/data/students_table.json")

export const fetchSessionActivity = () =>
  fetchJson<SessionActivityByTier>("/data/session_activity_by_tier.json")

export const fetchModelComparison = () =>
  fetchJson<ModelMetric[]>("/data/model_comparison.json")

export const fetchConfusionMatrices = () =>
  fetchJson<ConfusionMatrices>("/data/confusion_matrices.json")

export const fetchRocData = () =>
  fetchJson<RocData>("/data/roc_data.json")

export const fetchShapGlobal = () =>
  fetchJson<ShapFeature[]>("/data/shap_global.json")

export const fetchShapLocal = () =>
  fetchJson<ShapLocalExplanation[]>("/data/shap_local_explanations.json")

export const fetchFeatureDescriptions = () =>
  fetchJson<FeatureDescriptions>("/data/feature_descriptions.json")

export const fetchThresholdAnalysis = () =>
  fetchJson<ThresholdPoint[]>("/data/threshold_analysis.json")

export const fetchTransitionMatrix = () =>
  fetchJson<TransitionMatrix>("/data/transition_matrix.json")

export const fetchStudentSessions = () =>
  fetchJson<StudentSessionsDetail>("/data/student_sessions_detail.json")
