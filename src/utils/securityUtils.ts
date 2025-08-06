// Security utilities for runtime protection
import { supabase } from '@/integrations/supabase/client';

export class SecurityUtils {
  // Rate limiting storage
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  // Security event logging
  static async logSecurityEvent(eventType: string, details: Record<string, any> = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.warn(`SECURITY_EVENT: ${eventType}`, {
        userId: user?.id || 'anonymous',
        timestamp: new Date().toISOString(),
        ...details
      });

      // In production, this would also send to a monitoring service
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Enhanced rate limiting with different limits per action
  static createRateLimiter(config: {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs?: number;
  }) {
    return (identifier: string): { allowed: boolean; retryAfter?: number } => {
      const now = Date.now();
      const key = identifier;
      const existing = this.rateLimitStore.get(key);

      // Clean expired entries
      if (existing && now > existing.resetTime) {
        this.rateLimitStore.delete(key);
      }

      const current = this.rateLimitStore.get(key);

      if (!current) {
        this.rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
        return { allowed: true };
      }

      if (current.count >= config.maxAttempts) {
        const retryAfter = Math.ceil((current.resetTime - now) / 1000);
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
          identifier, 
          attempts: current.count,
          retryAfter 
        });
        return { allowed: false, retryAfter };
      }

      current.count++;
      return { allowed: true };
    };
  }

  // Input sanitization for user data
  static sanitizeUserInput(input: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
    removeScripts?: boolean;
  } = {}): string {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input.trim();

    // Remove scripts by default
    if (options.removeScripts !== false) {
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    // Remove HTML unless explicitly allowed
    if (!options.allowHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Enforce maximum length
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  // Validate session integrity
  static async validateSession(): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        this.logSecurityEvent('SESSION_VALIDATION_ERROR', { error: error.message });
        return { valid: false, error: error.message };
      }

      if (!user) {
        return { valid: false, error: 'No active session' };
      }

      // Additional session checks could go here
      // (e.g., check if user still exists in profiles table, role hasn't changed, etc.)

      return { valid: true, user };
    } catch (error) {
      this.logSecurityEvent('SESSION_VALIDATION_EXCEPTION', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { valid: false, error: 'Session validation failed' };
    }
  }

  // Secure password validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeated characters');
    }

    if (/^[a-zA-Z]+$/.test(password)) {
      score -= 1;
      feedback.push('Mix letters with numbers and symbols');
    }

    return {
      isValid: score >= 4,
      score: Math.max(0, Math.min(5, score)),
      feedback
    };
  }

  // Check for suspicious activity patterns
  static detectSuspiciousActivity(actions: string[]): boolean {
    // Look for rapid repeated actions
    if (actions.length > 10) {
      const recentActions = actions.slice(-10);
      const uniqueActions = new Set(recentActions);
      
      // If user performed the same action many times rapidly
      if (uniqueActions.size === 1) {
        this.logSecurityEvent('SUSPICIOUS_REPEATED_ACTIONS', { 
          action: recentActions[0],
          count: recentActions.length 
        });
        return true;
      }
    }

    return false;
  }

  // Secure data comparison (timing attack resistant)
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Environment security checks
  static performSecurityChecks(): { secure: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if we're in development mode
    if (import.meta.env.DEV) {
      issues.push('Running in development mode');
    }

    // Check for required environment variables
    if (!import.meta.env.VITE_SUPABASE_URL) {
      issues.push('Missing VITE_SUPABASE_URL environment variable');
    }

    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      issues.push('Missing VITE_SUPABASE_ANON_KEY environment variable');
    }

    // Check HTTPS in production
    if (!import.meta.env.DEV && location.protocol !== 'https:') {
      issues.push('Application should use HTTPS in production');
    }

    return {
      secure: issues.length === 0,
      issues
    };
  }
}

// Rate limiters for different operations
export const rateLimiters = {
  login: SecurityUtils.createRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), // 5 attempts per 15 minutes
  signUp: SecurityUtils.createRateLimiter({ maxAttempts: 3, windowMs: 60 * 60 * 1000 }), // 3 attempts per hour
  passwordReset: SecurityUtils.createRateLimiter({ maxAttempts: 3, windowMs: 60 * 60 * 1000 }), // 3 attempts per hour
  roleChange: SecurityUtils.createRateLimiter({ maxAttempts: 2, windowMs: 60 * 60 * 1000 }), // 2 attempts per hour
};