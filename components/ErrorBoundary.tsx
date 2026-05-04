'use client';

import React from 'react';

type Props = { children: React.ReactNode; label?: string };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('Dashboard component error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl card-shadow p-5 text-sm">
          <div className="font-semibold text-bb-magenta mb-1">
            {this.props.label || 'Something'} couldn't load
          </div>
          <div className="text-bb-ink/60 text-xs">
            Try refreshing the page. If it keeps happening, ping JC. ({this.state.message?.slice(0, 80) || 'unknown error'})
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}
