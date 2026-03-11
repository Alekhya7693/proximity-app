export const formatters = {
  formatDistance(meters: number): string {
    if (meters < 100) {
      return 'Nearby';
    }
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    const km = meters / 1000;
    if (km < 10) {
      return `${km.toFixed(1)}km away`;
    }
    return `${Math.round(km)}km away`;
  },

  formatCompatibility(score: number): string {
    // Support both 0-1 and 0-100 scales
    const pct = score > 1 ? Math.round(score) : Math.round(score * 100);
    return `${pct}%`;
  },

  getCompatibilityLevel(score: number): 'high' | 'medium' | 'low' {
    // Support both 0-1 and 0-100 scales
    const normalized = score > 1 ? score / 100 : score;
    if (normalized >= 0.7) return 'high';
    if (normalized >= 0.4) return 'medium';
    return 'low';
  },

  formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - then.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    return then.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  },

  formatMessageTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  },

  formatChatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  },

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength).trim()}...`;
  },

  formatOnlineStatus(lastSeen: Date | string | null): string {
    if (!lastSeen) return 'Offline';
    const now = new Date();
    const seen = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    const diffMinutes = Math.floor(
      (now.getTime() - seen.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 5) return 'Online';
    if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
    return 'Offline';
  },
};
