import React, { memo } from 'react';
import { UIStateMode } from '../../types/collegeConnect';
import { EmptyStateCard, ErrorStateCard, LoadingSkeletonList } from './RNPrimitives';

export interface ScreenStateViewProps {
  uiStateMode: UIStateMode;
  isEmpty?: boolean;
  skeletonCount?: number;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry: () => void;
  children: React.ReactNode;
}

export const ScreenStateView: React.FC<ScreenStateViewProps> = memo(
  ({
    uiStateMode,
    isEmpty = false,
    skeletonCount = 3,
    emptyTitle,
    emptyDescription,
    emptyActionLabel,
    onEmptyAction,
    onRetry,
    children,
  }) => {
    if (uiStateMode === 'loading') {
      return <LoadingSkeletonList count={skeletonCount} />;
    }

    if (uiStateMode === 'error') {
      return <ErrorStateCard onRetry={onRetry} />;
    }

    if (uiStateMode === 'empty' || isEmpty) {
      return (
        <EmptyStateCard
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      );
    }

    return <>{children}</>;
  }
);
