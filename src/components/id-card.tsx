
"use client"

import { useUser } from "@/contexts/user-context"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, Briefcase, QrCode, User as UserIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

interface IdCardProps {
  photoOverride?: string | null;
}

export function IdCard({ photoOverride }: IdCardProps) {
  const { user, loading } = useUser();

  // Display skeleton if loading and no override is provided.
  if (loading && !photoOverride && !user) {
    return <Skeleton className="w-full max-w-sm h-[420px] rounded-2xl" />
  }

  // If we have no user data at all (and no override), we can't render.
  if (!user) {
     return <Skeleton className="w-full max-w-sm h-[420px] rounded-2xl" />
  }

  const displayName = user.name || "First Last";
  const displayEmail = user.email || "user@example.com";
  const displayUserType = user.userType || "student";
  const displayPhoto = photoOverride !== undefined ? photoOverride : user.photo;
  
  return (
    <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
      <Card className="rounded-2xl shadow-2xl overflow-hidden relative">
        <div className={`h-24 ${displayUserType === 'student' ? 'bg-primary' : 'bg-accent'}`} />
        <CardContent className="p-6 pt-0 text-center">
            <div className="relative -mt-14 mb-4 flex justify-center">
              <div className="w-28 h-28 bg-muted rounded-md border-4 border-card shadow-lg flex items-center justify-center overflow-hidden">
                {displayPhoto ? (
                  <Image src={displayPhoto} alt={displayName} width={112} height={112} className="object-cover w-full h-full" />
                ) : (
                  <UserIcon className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold font-headline text-foreground">{displayName}</h2>
            
            <div className="mt-4 flex justify-center">
              <Badge variant={displayUserType === 'student' ? 'default' : 'secondary'} className="capitalize">
                {displayUserType === 'student' ? <GraduationCap className="mr-2 h-4 w-4" /> : <Briefcase className="mr-2 h-4 w-4" />}
                {displayUserType?.replace('_', ' ')}
              </Badge>
            </div>

            <div className="mt-6 border-t pt-6 flex justify-between items-start text-left">
                <div className="space-y-4">
                  {user.userType === 'student' && user.studentNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Student Number</p>
                      <p className="font-mono text-sm font-semibold">{user.studentNumber}</p>
                    </div>
                  )}
                  {user.userType === 'student' && user.courseCode && (
                    <div>
                      <p className="text-xs text-muted-foreground">Course</p>
                      <p className="font-mono text-sm font-semibold">{user.courseCode}</p>
                    </div>
                  )}
                  {user.campusName && (
                     <div>
                      <p className="text-xs text-muted-foreground">Campus</p>
                      <p className="font-mono text-sm font-semibold">{user.campusName}</p>
                    </div>
                  )}
                  {(user.userType === 'campus_staff' || user.userType === 'administrator' || user.userType === 'technician') && (
                     <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-mono text-sm font-semibold">{displayEmail}</p>
                    </div>
                  )}

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
