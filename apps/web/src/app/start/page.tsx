import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IntroSlides } from "@/components/intro-slides";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Welcome" };

export default async function Start() {
  if (await getViewer()) redirect("/");
  return <IntroSlides />;
}
