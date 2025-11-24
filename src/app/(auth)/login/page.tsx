
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, KeyRound } from "lucide-react"
import { signInWithEmailAndPassword, AuthError, signOut } from "firebase/auth"
import { doc, getDoc, updateDoc, serverTimestamp, FirestoreError } from "firebase/firestore"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useFirestore } from "@/firebase"

const formSchema = z.object({
  role: z.enum(["student", "campus_staff", "administrator", "technician"], {
    required_error: "You need to select a role.",
  }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const firestore = useFirestore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "student",
      email: "",
      password: "",
    },
  })

  const role = form.watch("role")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Fetch user profile and card data from Firestore in parallel
      const userProfileRef = doc(firestore, "userProfiles", user.uid);
      const cardDocRef = doc(firestore, "userProfiles", user.uid, "digitalIdCards", "main");
      
      const [userProfileSnap, cardDocSnap] = await Promise.all([
          getDoc(userProfileRef),
          getDoc(cardDocRef)
      ]);


      if (!userProfileSnap.exists()) {
        await signOut(auth); // Sign out if profile doesn't exist
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "User profile not found. Please contact support.",
        });
        return;
      }

      const userProfile = userProfileSnap.data();

      // 3. Verify role
      if (userProfile.userType !== values.role) {
        await signOut(auth); // Sign out if roles don't match
        form.setError("role", { 
          type: "manual", 
          message: "You are not authorized to log in with this role." 
        });
        toast({
          variant: "destructive",
          title: "Role Mismatch",
          description: "Please select the role you registered with.",
        });
        return;
      }

      // 4. Verify card status if the card exists
      if (cardDocSnap.exists()) {
        const cardData = cardDocSnap.data();
        if (cardData.cardStatus === 'suspended' || cardData.cardStatus === 'revoked') {
          await signOut(auth); // Sign out if card is not active
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: `Your account is currently ${cardData.cardStatus}. Please contact administration.`,
          });
          return;
        }
      }

      // 5. Update last login timestamp
      await updateDoc(userProfileRef, {
        lastLogin: serverTimestamp()
      });

      // 6. On success, redirect based on role
      toast({
        title: "Login Successful",
        description: "Redirecting...",
      });
      
      if (values.role === 'administrator') {
        router.push('/admin/dashboard');
      } else {
        router.push("/user-dashboard");
      }

    } catch (error) {
      if ((error as AuthError)?.code === 'auth/user-not-found' || (error as AuthError)?.code === 'auth/wrong-password' || (error as AuthError)?.code === 'auth/invalid-credential') {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password. Please try again."
        });
        form.setError("password", { type: "manual", message: " " });
        form.setError("email", { type: "manual", message: "Invalid credentials" });
      } else {
        console.error("Login Error:", error);
        toast({
          variant: "destructive",
          title: "An Unexpected Error Occurred",
          description: "Please try again later.",
        });
      }
    }
  }

  return (
    <div className="w-full max-w-sm bg-card p-8 rounded-lg shadow-lg">
        <div className="text-left mb-8">
          <h1 className="text-xl font-bold">Select your role</h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input 
                        placeholder={
                          role === "student" 
                          ? "studentnumber@tut4life.ac.za" 
                          : "name@outlook.com"
                        } 
                        {...field} 
                        className="pl-10" 
                      />
                    </FormControl>
                  </div>
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
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          <p>
            Don&apos;t have an account?{" "}
            <Button variant="link" asChild className="p-0">
              <Link href="/register">Register here</Link>
            </Button>
          </p>
        </div>
    </div>
  )
}

    