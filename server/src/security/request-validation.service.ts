import { Injectable, Logger } from '@nestjs/common';

export interface ValidationRules {
  maxRequestSize: number; // bytes
  maxHeaderSize: number; // bytes
  allowedHttpMethods: string[];
  blockedIps: Set<string>;
  allowedContentTypes: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class RequestValidationService {
  private readonly logger = new Logger(RequestValidationService.name);
  private rules: ValidationRules;

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): ValidationRules {
    return {
      maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '10485760'), // 10MB
      maxHeaderSize: parseInt(process.env.MAX_HEADER_SIZE || '8192'), // 8KB
      allowedHttpMethods: [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'HEAD',
        'OPTIONS',
      ],
      blockedIps: new Set(process.env.BLOCKED_IPS?.split(',') || []),
      allowedContentTypes: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
      ],
    };
  }

  /**
   * Validate incoming request
   */
  validateRequest(
    method: string,
    contentType: string,
    contentLength: number,
    ip: string,
    headerSize: number,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if IP is blocked
    if (this.rules.blockedIps.has(ip)) {
      errors.push(`Request from blocked IP: ${ip}`);
    }

    // Validate HTTP method
    if (!this.rules.allowedHttpMethods.includes(method.toUpperCase())) {
      errors.push(`HTTP method not allowed: ${method}`);
    }

    // Validate content length
    if (contentLength > this.rules.maxRequestSize) {
      errors.push(
        `Request body exceeds maximum size: ${contentLength} > ${this.rules.maxRequestSize}`,
      );
    }

    // Validate header size
    if (headerSize > this.rules.maxHeaderSize) {
      errors.push(
        `Request headers exceed maximum size: ${headerSize} > ${this.rules.maxHeaderSize}`,
      );
    }

    // Validate content type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      if (contentType) {
        const baseContentType = contentType.split(';')[0].trim();
        if (!this.rules.allowedContentTypes.includes(baseContentType)) {
          warnings.push(`Unexpected content type: ${baseContentType}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate input data
   */
  validateInput(data: any, rules: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // Required field check
      if (
        rule.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push(`Required field missing: ${field}`);
        continue;
      }

      if (value === undefined || value === null) {
        continue; // Skip optional fields that are not provided
      }

      // Type check
      if (rule.type && typeof value !== rule.type) {
        errors.push(
          `Field ${field} must be of type ${rule.type}, got ${typeof value}`,
        );
      }

      // String length check
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(
          `Field ${field} must be at least ${rule.minLength} characters`,
        );
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(
          `Field ${field} must not exceed ${rule.maxLength} characters`,
        );
      }

      // Pattern check (regex)
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`Field ${field} does not match required pattern`);
      }

      // Enum check
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`Field ${field} must be one of: ${rule.enum.join(', ')}`);
      }

      // Custom validation
      if (rule.validate && !rule.validate(value)) {
        errors.push(`Field ${field} failed custom validation`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize input string
   */
  sanitizeString(input: string, allowHtml: boolean = false): string {
    if (typeof input !== 'string') {
      return '';
    }

    if (!allowHtml) {
      // Remove HTML tags
      return input.replace(/<[^>]*>/g, '');
    }

    // Still remove script tags even if HTML allowed
    return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  }

  /**
   * Check for SQL injection patterns
   */
  checkSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi,
      /(-{2}|\/\*|\*\/|xp_|sp_)/gi,
      /(;|\||&&)/g,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Get validation rules
   */
  getRules(): ValidationRules {
    return { ...this.rules, blockedIps: new Set(this.rules.blockedIps) };
  }

  /**
   * Add IP to blocklist
   */
  blockIp(ip: string): void {
    this.rules.blockedIps.add(ip);
    this.logger.warn(`IP blocked: ${ip}`);
  }

  /**
   * Remove IP from blocklist
   */
  unblockIp(ip: string): void {
    this.rules.blockedIps.delete(ip);
    this.logger.log(`IP unblocked: ${ip}`);
  }

  /**
   * Get validation summary
   */
  getSummary() {
    return {
      maxRequestSize: `${(this.rules.maxRequestSize / 1024 / 1024).toFixed(2)}MB`,
      maxHeaderSize: `${(this.rules.maxHeaderSize / 1024).toFixed(2)}KB`,
      allowedHttpMethods: this.rules.allowedHttpMethods,
      allowedContentTypes: this.rules.allowedContentTypes,
      blockedIpsCount: this.rules.blockedIps.size,
    };
  }
}
