import { Stack } from "expo-router"
import { useFonts } from "expo-font"
import "../global.css"
import { useCallback, useEffect, useState } from "react"

import { AppProviders } from "@/src/providers/AppProviders"
import SplashScreen from "../src/components/SplashScreen"

const FONT_TIMEOUT_MS = 10_000

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)

  // Load fonts in parallel with the Lottie animation
  const [fontsLoaded, fontsError] = useFonts({
    Poppins: require("../assets/fonts/Poppins.ttf"),
  })

  // Safety timeout: after 10s show app even if fonts never loaded
  const [safetyTimeout, setSafetyTimeout] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSafetyTimeout(true), FONT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleAnimationFinish = useCallback(() => {
    setAnimationDone(true)
  }, [])

  // Dual readiness gate: show app when animation done AND fonts ready
  useEffect(() => {
    const fontsReady = fontsLoaded || fontsError || safetyTimeout
    const animDone = animationDone || safetyTimeout
    if (animDone && fontsReady && !appReady) {
      setAppReady(true)
    }
  }, [animationDone, fontsLoaded, fontsError, safetyTimeout, appReady])

  if (!appReady) {
    return <SplashScreen onAnimationFinish={handleAnimationFinish} />
  }

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  )
}
