type TrainingQueueRecord = Record<string, unknown>;

type TrainingQueueDelegate = {
  create(args: { data: TrainingQueueRecord; select?: Record<string, boolean> }): Promise<unknown>;
};

const OPTIONAL_TRAINING_QUEUE_COLUMNS = [
  'imageHash',
  'recognitionId',
  'businessName',
  'source',
  'labelQuality',
  'confidence',
  'metadata',
] as const;

function getMissingTrainingQueueColumn(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code;
  const rawColumn = (error as { meta?: { column?: unknown } } | null)?.meta?.column;

  if (code !== 'P2022' || typeof rawColumn !== 'string') {
    return null;
  }

  const normalizedColumn = rawColumn.toLowerCase();
  return (
    OPTIONAL_TRAINING_QUEUE_COLUMNS.find(column => normalizedColumn.includes(column.toLowerCase())) || null
  );
}

export async function createTrainingQueueRecord<T>(
  trainingQueue: TrainingQueueDelegate,
  data: TrainingQueueRecord,
  context: string,
): Promise<T> {
  const createData: TrainingQueueRecord = { ...data };
  const removedColumns: string[] = [];

  while (true) {
    try {
      const record = await trainingQueue.create({
        data: createData,
        // Select only legacy-safe columns so pre-migration databases do not fail on RETURNING.
        select: { id: true },
      });

      if (removedColumns.length > 0) {
        console.warn('TrainingQueue insert succeeded with legacy schema fallback:', {
          context,
          removedColumns,
        });
      }

      return record as T;
    } catch (error) {
      const missingColumn = getMissingTrainingQueueColumn(error);

      if (!missingColumn || !(missingColumn in createData)) {
        throw error;
      }

      delete createData[missingColumn];
      removedColumns.push(missingColumn);

      console.warn('TrainingQueue column missing in live database, retrying without column:', {
        context,
        missingColumn,
      });
    }
  }
}
