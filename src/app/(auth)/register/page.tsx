"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { createUserWithEmailAndPassword, AuthError } from "firebase/auth"
import { doc, writeBatch, serverTimestamp, FirestoreError } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Logo } from "@/components/logo"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useAuth, errorEmitter, FirestorePermissionError } from "@/firebase"

const formSchema = z.object({
  userType: z.enum(["student", "campus_staff", "administrator", "technician"], { required_error: "You need to select a user type." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  studentNumber: z.string().optional(),
  workId: z.string().optional(),
  adminId: z.string().optional(),
  technicianId: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  courseCode: z.string().optional(),
  campusName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => {
  if (data.userType === 'student') {
    return !!data.studentNumber;
  }
  return true;
}, {
  message: 'Student number is required.',
  path: ['studentNumber'],
}).refine(data => {
    if (data.userType === 'student' && data.studentNumber) {
        return /^\d{9}$/.test(data.studentNumber);
    }
    return true;
}, {
    message: 'Student number must be exactly 9 digits.',
    path: ['studentNumber'],
}).refine(data => {
  if (data.userType === 'student') {
    return !!data.courseCode;
  }
  return true;
}, {
  message: 'Course code is required.',
  path: ['courseCode'],
}).refine(data => {
    if (data.userType === 'student' || data.userType === 'campus_staff' || data.userType === 'administrator' || data.userType === 'technician') {
        return !!data.campusName;
    }
    return true;
}, {
    message: 'Campus name is required.',
    path: ['campusName'],
}).refine(data => {
  if (data.userType === 'campus_staff') {
    return !!data.workId;
  }
  return true;
}, {
    message: 'Work ID is required.',
    path: ['workId'],
}).refine(data => {
  if (data.userType === 'campus_staff') {
    return !!data.department;
  }
  return true;
}, {
    message: 'Department is required.',
    path: ['department'],
}).refine(data => {
  if (data.userType === 'administrator') {
    return !!data.adminId;
  }
  return true;
}, {
  message: 'Admin ID is required.',
  path: ['adminId'],
}).refine(data => {
  if (data.userType === 'technician') {
    return !!data.technicianId;
  }
  return true;
}, {
  message: 'Technician ID is required.',
  path: ['technicianId'],
});


export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const firestore = useFirestore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: "student",
    },
  })

  const userType = form.watch("userType");
  const studentNumber = form.watch("studentNumber");

  React.useEffect(() => {
    if (userType === 'student' && studentNumber) {
      form.setValue('email', `${studentNumber}@tut4life.ac.za`, { shouldValidate: true });
    } else {
      // Clear email if not a student or if student number is cleared
      if (form.getValues('email').endsWith('@tut4life.ac.za')) {
        form.setValue('email', '');
      }
    }
  }, [userType, studentNumber, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Prepare data and references for batch write
      const [firstName, ...lastNameParts] = values.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const userProfileData = {
        id: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: values.email,
        registrationDate: serverTimestamp(),
        lastLogin: serverTimestamp(),
        profilePicture: "", // Initially empty
        userType: values.userType,
        studentNumber: values.studentNumber || null,
        courseCode: values.courseCode || null,
        workId: values.workId || null,
        department: values.department || null,
        adminId: values.adminId || null,
        technicianId: values.technicianId || null,
        campusName: values.campusName || null,
      };

      const userProfileRef = doc(firestore, "userProfiles", user.uid);
      const newEmailLockRef = doc(firestore, "emails", values.email);
      const emailLockData = { userId: user.uid };
      
      // 3. Use a batch write for atomicity
      const batch = writeBatch(firestore);
      batch.set(newEmailLockRef, emailLockData);
      batch.set(userProfileRef, userProfileData);

      // 4. Commit the batch.
      await batch.commit().catch(error => {
        // This will create a contextual error for the LLM agent to fix security rules.
        const permissionError = new FirestorePermissionError({
          path: userProfileRef.path, // or newEmailLockRef.path, depends on which one fails
          operation: 'create',
          requestResourceData: { userProfile: userProfileData, emailLock: emailLockData },
        });
        errorEmitter.emit('permission-error', permissionError);
        // We still throw to stop execution and show a toast
        throw error;
      });
      
      toast({
        title: "Registration Successful",
        description: "You can now log in with your credentials.",
      });
      router.push("/login");

    } catch (error) {
      // Handle specific auth errors first
      if ((error as AuthError)?.code === 'auth/email-already-in-use') {
        form.setError("email", { 
            type: "manual", 
            message: "This email is already registered. Please log in." 
        });
      } else {
        // Fallback for other errors (including the one from the batch commit)
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "An unexpected error occurred. It's possible the email is already in use or there was a network issue.",
        });
        console.error("Registration failed:", error);
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join Unicard to get your digital ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I am a...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="student" />
                          </FormControl>
                          <FormLabel className="font-normal">Student</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="campus_staff" />
                          </FormControl>
                          <FormLabel className="font-normal">Campus Staff</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="administrator" />
                          </FormControl>
                          <FormLabel className="font-normal">Administrator</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="technician" />
                          </FormControl>
                          <FormLabel className="font-normal">Technician</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {userType === "student" && (
                <>
                  <FormField
                    control={form.control}
                    name="studentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 212345678" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courseCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. COS101" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {userType === "campus_staff" && (
                <>
                   <FormField
                    control={form.control}
                    name="workId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 98765" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Information Technology" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {userType === "administrator" && (
                <FormField
                  control={form.control}
                  name="adminId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ADM123" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {userType === "technician" && (
                <FormField
                  control={form.control}
                  name="technicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technician ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. TECH456" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={
                          userType === 'student' 
                          ? 'studentnumber@tut4life.ac.za' 
                          : 'name@outlook.com'
                        } 
                        {...field} 
                        readOnly={userType === 'student'} 
                        className={userType === 'student' ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(userType === "student" || userType === "campus_staff" || userType === "administrator" || userType === "technician") && (
                <FormField
                  control={form.control}
                  name="campusName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Campus" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0">
              <Link href="/login">Sign In</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
