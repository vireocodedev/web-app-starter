import { Component, type ReactNode } from "react";

import { FatalErrorScreen } from "./FatalErrorScreen";

type Props = Readonly<{
  children: ReactNode;
  /** Report a sanitized event; never render technical details to the user. */
  onUnexpectedRenderFailure?: () => void;
}>;

type State = Readonly<{ hasFailed: boolean }>;

export class AppRenderErrorBoundary extends Component<Props, State> {
  state: State = { hasFailed: false };

  static getDerivedStateFromError(): State {
    return { hasFailed: true };
  }

  componentDidCatch() {
    this.props.onUnexpectedRenderFailure?.();
  }

  render() {
    if (!this.state.hasFailed) return this.props.children;

    return <FatalErrorScreen />;
  }
}
