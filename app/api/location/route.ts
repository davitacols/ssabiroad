import { getLocation } from '../../../lib/location-smart';
import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler, throwApiError } from '@/app/middleware-error-handler';
import { ErrorCodes, SpecificErrorMessages } from '@/app/error-constants';

export const GET = ErrorHandler.withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    throwApiError(ErrorCodes.BAD_REQUEST, SpecificErrorMessages.MISSING_SEARCH_QUERY);
  }

  const location = await getLocation(query);
  
  if (!location) {
    throwApiError(ErrorCodes.NOT_FOUND, SpecificErrorMessages.LOCATION_NOT_FOUND);
  }

  return NextResponse.json({ success: true, data: location });
});
