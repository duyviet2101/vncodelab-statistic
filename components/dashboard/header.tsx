"use client"

import { useState, useMemo } from "react"
import { Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  selectedRoom: string
  onRoomChange: (room: string) => void
  rooms: string[]
}

export function Header({ selectedRoom, onRoomChange, rooms }: HeaderProps) {
  const [roomSearch, setRoomSearch] = useState("")

  const filteredRooms = useMemo(
    () =>
      rooms.filter((r) =>
        r.toLowerCase().includes(roomSearch.toLowerCase())
      ),
    [rooms, roomSearch]
  )

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <DropdownMenu onOpenChange={(open) => { if (!open) setRoomSearch("") }}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[160px] justify-between">
              {selectedRoom}
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5">
              <Input
                placeholder="Search rooms..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredRooms.map((room) => (
                <DropdownMenuItem key={room} onClick={() => onRoomChange(room)}>
                  {room}
                </DropdownMenuItem>
              ))}
              {filteredRooms.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  No rooms found
                </p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-sm text-muted-foreground font-medium">
          Spring 2026
        </span>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Student ID / Name..."
            className="w-64 pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">Nguyen Thi A</p>
          <p className="text-xs text-muted-foreground">Instructor</p>
        </div>
        <Avatar className="w-9 h-9">
          <AvatarImage src="/placeholder-avatar.jpg" alt="Instructor" />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            NA
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
