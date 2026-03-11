"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Overview } from "./screens/overview"
import { ClassEngagement } from "./screens/class-engagement"
import { StudentDetail } from "./screens/student-detail"
import { ModelMetrics } from "./screens/model-metrics"
import { XaiInsights } from "./screens/xai-insights"
import { AtRiskStudents } from "./screens/at-risk-students"
import { fetchRooms } from "@/lib/fetch-data"
import type { RoomInfo } from "@/lib/types"

export function Dashboard() {
  const [activeScreen, setActiveScreen] = useState("class-engagement")
  const [selectedRoom, setSelectedRoom] = useState("All Rooms")
  const [rooms, setRooms] = useState<string[]>(["All Rooms"])

  useEffect(() => {
    fetchRooms().then((data: RoomInfo[]) => {
      const roomIds = data.map((r) => r.room_id)
      setRooms(["All Rooms", ...roomIds])
    })
  }, [])

  const renderScreen = () => {
    switch (activeScreen) {
      case "overview":
        return <Overview />
      case "class-engagement":
        return <ClassEngagement />
      case "student-detail":
        return <StudentDetail />
      case "model-metrics":
        return <ModelMetrics />
      case "xai-insights":
        return <XaiInsights />
      case "at-risk":
        return <AtRiskStudents />
      default:
        return <ClassEngagement />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeItem={activeScreen} onItemChange={setActiveScreen} />
      <div className="flex-1 flex flex-col">
        <Header
          selectedRoom={selectedRoom}
          onRoomChange={setSelectedRoom}
          rooms={rooms}
        />
        <main className="flex-1 p-6 overflow-auto">
          {renderScreen()}
        </main>
      </div>
    </div>
  )
}
