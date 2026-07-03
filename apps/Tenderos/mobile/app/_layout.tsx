import { Stack } from "expo-router"
import { AuthProvider } from "../src/components/AuthProvider"
import { useFonts } from "expo-font"
import "../global.css"
import { useCallback, useEffect, useState } from "react"
import { Text } from "react-native"
import SplashScreen from "../src/components/SplashScreen"

const FONT_TIMEOUT_MS = 10_000

// Global font: every <Text> in the app defaults to Poppins.
// This is the standard RN pattern — fontFamily does NOT cascade from View parents.
Text.defaultProps = { ...Text.defaultProps, style: { fontFamily: "Poppins" } }

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
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
