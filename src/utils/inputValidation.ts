// Input validation and sanitization utilities
import DOMPurify from 'dompurify';

export class InputValidator {
  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  }

  // Password strength validation
  static isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize HTML input to prevent XSS
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  // Sanitize text input (remove potential script injections)
  static sanitizeText(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Validate and sanitize user role
  static validateRole(role: string): string | null {
    const validRoles = ['user', 'admin', 'sales_admin', 'client', 'technician', 'superadmin'];
    const cleanRole = role.toLowerCase().trim();
    
    return validRoles.includes(cleanRole) ? cleanRole : null;
  }

  // Validate phone number (basic format)
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Validate URL format
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Rate limiting helper (basic client-side)
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userAttempts = attempts.get(identifier);

      if (!userAttempts || now > userAttempts.resetTime) {
        attempts.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (userAttempts.count >= maxAttempts) {
        return false;
      }

      userAttempts.count++;
      return true;
    };
  }

  // Validate SQL injection attempts (basic detection)
  static containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(;|\-\-|\*|\/\*|\*\/)/,
      /('|(\\x27)|(\\x2D\\x2D))/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }
}

// Form validation schema helpers
export const validationSchemas = {
  email: (email: string) => {
    if (!email) return 'Email is required';
    if (!InputValidator.isValidEmail(email)) return 'Invalid email format';
    return null;
  },

  password: (password: string) => {
    if (!password) return 'Password is required';
    const validation = InputValidator.isStrongPassword(password);
    return validation.isValid ? null : validation.errors[0];
  },

  required: (value: string, fieldName: string) => {
    if (!value?.trim()) return `${fieldName} is required`;
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string) => {
    if (value && value.length > max) return `${fieldName} must be ${max} characters or less`;
    return null;
  }
};