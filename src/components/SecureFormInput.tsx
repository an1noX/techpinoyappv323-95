import { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SecurityUtils } from '@/utils/securityUtils';
import { AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseSecureFormInputProps {
  label?: string;
  sanitize?: boolean;
  maxLength?: number;
  allowHtml?: boolean;
  securityLevel?: 'low' | 'medium' | 'high';
  onSecurityViolation?: (violation: string) => void;
}

interface SecureInputProps extends BaseSecureFormInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  variant?: 'input';
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface SecureTextareaProps extends BaseSecureFormInputProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  variant: 'textarea';
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

type SecureFormInputProps = SecureInputProps | SecureTextareaProps;

export const SecureFormInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  SecureFormInputProps
>(({
  className,
  label,
  sanitize = true,
  maxLength = 1000,
  allowHtml = false,
  variant = 'input',
  securityLevel = 'medium',
  onSecurityViolation,
  onChange,
  value,
  ...props
}, ref) => {
  const [sanitizedValue, setSanitizedValue] = useState(value || '');
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);

  // Security configuration based on level
  const securityConfig = {
    low: { removeScripts: true, allowHtml: false, maxLength: 500 },
    medium: { removeScripts: true, allowHtml: false, maxLength: 1000 },
    high: { removeScripts: true, allowHtml: false, maxLength: 200 }
  };

  const config = securityConfig[securityLevel];

  // Real-time security validation
  const validateInput = (inputValue: string): { isValid: boolean; warning?: string } => {
    if (!inputValue) return { isValid: true };

    // Check for potential security threats
    const threats = [
      { pattern: /<script/gi, message: 'Script tags detected' },
      { pattern: /javascript:/gi, message: 'JavaScript protocol detected' },
      { pattern: /on\w+\s*=/gi, message: 'Event handlers detected' },
      { pattern: /data:text\/html/gi, message: 'HTML data URI detected' },
      { pattern: /vbscript:/gi, message: 'VBScript protocol detected' }
    ];

    for (const threat of threats) {
      if (threat.pattern.test(inputValue)) {
        return { isValid: false, warning: threat.message };
      }
    }

    // Check for suspicious patterns
    if (inputValue.length > config.maxLength) {
      return { isValid: false, warning: `Input exceeds maximum length of ${config.maxLength}` };
    }

    // Check for repeated characters (potential DOS)
    if (/(.)\1{10,}/.test(inputValue)) {
      return { isValid: false, warning: 'Suspicious repeated characters detected' };
    }

    return { isValid: true };
  };

  // Handle input changes with security processing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    processInput(rawValue, e, onChange as (e: React.ChangeEvent<HTMLInputElement>) => void);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    processInput(rawValue, e, onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void);
  };

  const processInput = (rawValue: string, e: any, onChangeCallback?: any) => {
    // Security validation
    const validation = validateInput(rawValue);
    
    if (!validation.isValid) {
      setSecurityWarning(validation.warning || 'Security threat detected');
      setIsSecure(false);
      
      if (onSecurityViolation) {
        onSecurityViolation(validation.warning || 'Unknown security violation');
      }
      
      SecurityUtils.logSecurityEvent('INPUT_SECURITY_VIOLATION', {
        field: (props as any).name || 'unknown',
        violation: validation.warning,
        inputLength: rawValue.length
      });
      
      return; // Don't update value if security threat detected
    }

    // Clear warnings if input is valid
    if (securityWarning) {
      setSecurityWarning(null);
      setIsSecure(true);
    }

    // Sanitize input if enabled
    let processedValue = rawValue;
    if (sanitize) {
      processedValue = SecurityUtils.sanitizeUserInput(rawValue, {
        maxLength: config.maxLength,
        allowHtml: config.allowHtml,
        removeScripts: config.removeScripts
      });
    }

    setSanitizedValue(processedValue);

    // Call original onChange with processed value
    if (onChangeCallback) {
      onChangeCallback(e);
    }
  };

  // Update sanitized value when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      const validation = validateInput(String(value));
      if (validation.isValid) {
        setSanitizedValue(String(value));
        setSecurityWarning(null);
        setIsSecure(true);
      }
    }
  }, [value]);

  const inputClassName = cn(
    className,
    !isSecure && "border-destructive focus-visible:ring-destructive",
    isSecure && securityLevel === 'high' && "border-green-500 focus-visible:ring-green-500"
  );

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <div className="flex items-center gap-1">
            {securityLevel === 'high' && (
              <Shield className="h-3 w-3 text-green-500" />
            )}
            {!isSecure && (
              <AlertTriangle className="h-3 w-3 text-destructive" />
            )}
          </div>
        </div>
      )}
      
      {variant === 'textarea' ? (
        <Textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          {...(props as any)}
          className={inputClassName}
          value={sanitizedValue}
          onChange={handleTextareaChange}
          maxLength={config.maxLength}
        />
      ) : (
        <Input
          ref={ref as React.Ref<HTMLInputElement>}
          {...(props as any)}
          className={inputClassName}
          value={sanitizedValue}
          onChange={handleInputChange}
          maxLength={config.maxLength}
        />
      )}
      
      {securityWarning && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-3 w-3" />
          {securityWarning}
        </div>
      )}
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Security: {securityLevel}</span>
        <span>{String(sanitizedValue).length}/{config.maxLength}</span>
      </div>
    </div>
  );
});

SecureFormInput.displayName = 'SecureFormInput';