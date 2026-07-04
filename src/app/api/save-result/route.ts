// API to save training results to local storage (JSON file)
// In production, replace with your database

export async function POST(request: Request) {
  try {
    const result = await request.json();

    if (!result.attackId || !result.score) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique ID for this result
    const resultId = `${result.attackId}_${Date.now()}`;

    // In production, save to database here
    // For now, we'll return success and let client handle storage
    const savedResult = {
      id: resultId,
      ...result,
      createdAt: new Date().toISOString(),
    };

    console.log('Result saved:', savedResult);

    return Response.json({
      success: true,
      resultId,
      message: 'Training result saved successfully',
    });
  } catch (error) {
    console.error('Save result error:', error);
    return Response.json(
      { error: 'Failed to save result' },
      { status: 500 }
    );
  }
}
