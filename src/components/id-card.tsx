"use client"

import { useUser } from "@/contexts/user-context"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap, Briefcase, QrCode } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function IdCard() {
  const { user, loading } = useUser();

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  if (loading || !user) {
    return <Skeleton className="w-full max-w-sm h-[420px] rounded-2xl" />
  }

  const generatedId = `${user.userType === 'student' ? 'STU' : 'STA'}-${user.email.substring(0,3).toUpperCase()}${new Date().getFullYear()}`

  return (
    <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
      <Card className="rounded-2xl shadow-2xl overflow-hidden relative">
        <div className={`h-24 ${user.userType === 'student' ? 'bg-primary' : 'bg-accent'}`} />
        <CardContent className="p-6 pt-0 text-center">
            <div className="relative -mt-14 mb-4">
              <Avatar className="w-28 h-28 mx-auto border-4 border-card shadow-lg">
                <AvatarImage src={user.photo ?? undefined} alt={user.name} />
                <AvatarFallback className="text-4xl">
                  {user.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <h2 className="text-2xl font-bold font-headline text-foreground">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            
            <div className="mt-4 flex justify-center">
              <Badge variant={user.userType === 'student' ? 'default' : 'secondary'} className="capitalize">
                {user.userType === 'student' ? <GraduationCap className="mr-2 h-4 w-4" /> : <Briefcase className="mr-2 h-4 w-4" />}
                {user.userType?.replace('_', ' ')}
              </Badge>
            </div>

            <div className="mt-6 border-t pt-6 flex justify-between items-center text-left">
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">ID Number</p>
                    <p className="font-mono text-sm font-semibold">{generatedId}</p>
                    <p className="text-xs text-muted-foreground">Issued</p>
                    <p className="font-mono text-sm font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-md">
                    <QrCode className="h-16 w-16 text-black" />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
