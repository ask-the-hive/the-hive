import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { PrivyClient } from '@privy-io/server-auth';
import { toUserFacingErrorText } from '@/lib/user-facing-error';

// Initialize Privy client for token verification
let privyClient: PrivyClient | null = null;
function getPrivyClient() {
  if (!privyClient && process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_APP_SECRET) {
    privyClient = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      process.env.PRIVY_APP_SECRET,
    );
  }
  return privyClient;
}

// Extract user information from authorization header
async function extractUserContext(req: NextRequest): Promise<{
  userId?: string;
  walletAddress?: string;
}> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return {};
    }

    const token = authHeader.split(' ')[1];
    const privy = getPrivyClient();

    if (!privy) {
      return {};
    }

    const verifiedClaims = await privy.verifyAuthToken(token);
    return {
      userId: verifiedClaims.userId,
    };
  } catch (error) {
    console.error('Error extracting user context:', error);
    // Silent fail - user context is optional
    return {};
  }
}

// Extract request context for Sentry
async function extractRequestContext(req: NextRequest, params?: any) {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());

  // Extract body for POST/PUT/PATCH requests
  let body: any = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      // Clone the request to read the body without consuming it
      const clonedReq = req.clone();
      const contentType = req.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        body = await clonedReq.json();
      } else if (contentType?.includes('text/')) {
        body = await clonedReq.text();
      }
    } catch (error) {
      console.error('Error parsing body:', error);
      // Body might not be readable or might be consumed already
      body = '[Unable to parse body]';
    }
  }

  return {
    method: req.method,
    url: url.pathname,
    searchParams,
    body,
    params,
    headers: {
      'user-agent': req.headers.get('user-agent'),
      'content-type': req.headers.get('content-type'),
    },
  };
}

/**
 * Higher-order function that wraps Next.js API route handlers with error handling and Sentry logging
 *
 * @example
 * export const GET = withErrorHandling(async (req: NextRequest) => {
 *   const data = await fetchData();
 *   return NextResponse.json(data);
 * });
 */
export function withErrorHandling<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<Response | NextResponse>,
) {
  return async (req: NextRequest, ...args: T): Promise<Response | NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      // Extract context for Sentry
      const [userContext, requestContext] = await Promise.all([
        extractUserContext(req),
        extractRequestContext(req, args[0]), // args[0] typically contains route params
      ]);

      // Capture error with Sentry
      Sentry.withScope((scope) => {
        // Set user context
        if (userContext.userId) {
          scope.setUser({
            id: userContext.userId,
            ...(userContext.walletAddress && { username: userContext.walletAddress }),
          });
        }

        // Set request context
        scope.setContext('request', requestContext);

        // Set tags for filtering in Sentry
        scope.setTag('route', requestContext.url);
        scope.setTag('method', requestContext.method);

        // Extract chain type from params or query if available
        const params = args[0] as any;
        const chainFromParams = params?.params?.chain;
        const chainFromQuery = requestContext.searchParams.chain;
        if (chainFromParams || chainFromQuery) {
          scope.setTag('chain', chainFromParams || chainFromQuery);
        }

        // Capture the exception
        Sentry.captureException(error);
      });

      // Log to console for development
      console.error(`API Error [${requestContext.method} ${requestContext.url}]:`, error);

      // Determine status code from error or default to 500
      const statusCode = (error as any)?.status || (error as any)?.statusCode || 500;

      // Never return raw/technical errors to the client.
      // Always include a clear next step in the error text.
      const errorMessage =
        statusCode >= 400 && statusCode < 500
          ? toUserFacingErrorText(error)
          : toUserFacingErrorText('Internal server error');

      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
  };
}

/**
 * Manual error capture utility for use within try-catch blocks
 * Use this when you want to capture an error but handle it differently than the default
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureApiError(error, { context: 'custom-operation', userId: 'user-123' });
 *   return NextResponse.json({ error: 'Custom error message' }, { status: 400 });
 * }
 */
export function captureApiError(
  error: unknown,
  context?: {
    userId?: string;
    route?: string;
    method?: string;
    additionalContext?: Record<string, any>;
    tags?: Record<string, string>;
  },
) {
  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.route) {
      scope.setTag('route', context.route);
    }

    if (context?.method) {
      scope.setTag('method', context.method);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.additionalContext) {
      scope.setContext('custom', context.additionalContext);
    }

    Sentry.captureException(error);
  });
}
