import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Logo />
      </header>
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="py-12 md:py-24">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-primary tracking-tighter mb-4">
                Your Campus, Your Card, Your Control.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                Welcome to CampusCard, the secure and convenient way to access campus services with a digital ID. For students and staff.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/login">
                    Login to Your Account <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/register">Register Now</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={1200}
                  height={800}
                  className="rounded-xl shadow-2xl"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CampusCard. All rights reserved.</p>
      </footer>
    </div>
  );
}
