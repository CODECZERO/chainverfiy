"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertCircle, RefreshCcw, Home } from "lucide-react"
import { Button } from "./ui/button"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-[#030408] flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 text-center shadow-3xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 mb-8">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Something went wrong</h1>
            <p className="text-slate-400 mb-8 text-sm md:text-base leading-relaxed">
              We've encountered a client-side exception. Our team has been notified, and we're working to fix it.
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={this.handleReset}
                className="h-12 rounded-xl bg-white text-black hover:bg-slate-200 font-bold transition-all"
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> Reload Page
              </Button>
              
              <Button 
                variant="ghost"
                className="h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05]"
                onClick={() => window.location.href = '/'}
              >
                <Home className="w-4 h-4 mr-2" /> Go to Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 pt-8 border-t border-white/[0.05] text-left">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Error Details</p>
                <pre className="text-[10px] font-mono text-red-400 bg-red-400/5 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {this.state.error?.message}
                </pre>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
