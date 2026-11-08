"use client";import {ThemeProvider,useTheme} from "next-themes";
export function AdminTheme({children}:{children:React.ReactNode}){return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>{children}</ThemeProvider>}
export function AdminThemeSwitch(){const {theme,setTheme}=useTheme();return <button className="button outline" onClick={()=>setTheme(theme==="light"?"dark":"light")}>Görünüşü dəyiş</button>}
