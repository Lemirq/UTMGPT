import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Bot, Compass, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="fc min-h-dvh w-full bg-background rounded-2xl overflow-hidden">
      <main className="fc w-full">
        <section className="w-full py-12 md:py-24 lg:py-32 ">
          <div className="container  mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Navigate UTM with Your AI Companion
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    UTM-GPT is your one-stop solution for finding information
                    about the University of Toronto Mississauga.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/chat">
                    <Button size="lg">
                      Start Chatting
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <Compass
                size={200}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6  mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted-foreground/20 px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Smarter, Faster, Better
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our intelligent assistant is designed to provide you with the
                  most accurate and up-to-date information.
                </p>
              </div>
            </div>
            <div className="items-start fr mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Bot size={24} />
                  <h3 className="text-xl font-bold">AI-Powered Chat</h3>
                </div>
                <p className="text-muted-foreground">
                  Engage in natural conversations to get the answers you need.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <GraduationCap size={24} />
                  <h3 className="text-xl font-bold">Comprehensive Knowledge</h3>
                </div>
                <p className="text-muted-foreground">
                  Access a wide range of information from the official UTM
                  website and academic calendars. Over 30,000 pages of documents
                  are indexed!
                </p>
              </div>
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Compass size={24} />
                  <h3 className="text-xl font-bold">Easy Navigation</h3>
                </div>
                <p className="text-muted-foreground">
                  Quickly find information about programs, admissions, and
                  campus life.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container  mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                About The Project
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                This application is designed to provide quick and accurate
                answers to your questions about UTM. It uses a powerful AI model
                that has been trained on a wide range of documents from the UTM
                website. Whether you're a prospective student, a current
                student, or just curious, UTM-GPT is here to help you find the
                information you need.
              </p>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                This project was made by me,{" "}
                <a
                  href="https://vhaan.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Vihaan Sharma
                </a>
                , not affiliated with the University of Toronto.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} UTM-GPT. All rights reserved.
        </p>

        {/* github link */}
        <Link
          href="https://github.com/Lemirq/utmgpt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground"
        >
          GitHub
        </Link>
      </footer>
    </div>
  );
}
