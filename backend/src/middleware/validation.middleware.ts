import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const reportSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  type: z.enum(['red-flag', 'intervention']),
  location: z.union([
    z.object({
      lat: z.number(),
      lng: z.number()
    }),
    z.null()
  ]).optional(),
  images: z.array(z.string()).optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'under-investigation', 'rejected', 'resolved'])
});

// Validation middleware factory
const validate = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Validation failed';
        return res.status(400).json({
          success: false,
          error: errorMessage
        });
      }
      
      res.status(400).json({
        success: false,
        error: 'Validation failed'
      });
    }
  };
};

// Export validation middlewares
export const validateSignup = validate(signupSchema);
export const validateLogin = validate(loginSchema);
export const validateReport = validate(reportSchema);
export const validateStatusUpdate = validate(statusUpdateSchema);