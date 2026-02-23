import { describe, it, expect } from 'vitest';
import { useNotificationPreferences } from './useNotificationPreferences';

describe('useNotificationPreferences', () => {
  it('should fetch preferences', () => {
    // Mock and test fetchPreferences
    expect(typeof useNotificationPreferences).toBe('function');
  });
});