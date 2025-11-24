import { pool } from '../database';

export interface Generation {
    id: number;
    project_id: number;
    user_id: number;
    prompt: string;
    model: string | null;
    status: string;
    thinking_duration: number | null;
    generation_start_time: Date | null;
    generation_end_time: Date | null;
    total_tokens: number | null;
    error_message: string | null;
    created_at: Date;
}

export interface GenerationFile {
    id: number;
    generation_id: number;
    file_path: string;
    file_content: string;
    file_type: string | null;
    created_at: Date;
}

export class GenerationDatabase {
    // Create a new generation
    static async createGeneration(data: {
        projectId: number;
        userId: number;
        prompt: string;
        model?: string;
    }): Promise<Generation> {
        const client = await pool.connect();
        try {
            const query = `
        INSERT INTO generations (project_id, user_id, prompt, model, status, generation_start_time, created_at)
        VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

            const result = await client.query(query, [
                data.projectId,
                data.userId,
                data.prompt,
                data.model || null
            ]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Update generation status
    static async updateGenerationStatus(
        generationId: number,
        status: string,
        data?: {
            thinkingDuration?: number;
            totalTokens?: number;
            errorMessage?: string;
        }
    ): Promise<Generation | null> {
        const client = await pool.connect();
        try {
            const updates: string[] = [`status = $2`];
            const values: any[] = [generationId, status];
            let paramIndex = 3;

            if (data?.thinkingDuration !== undefined) {
                updates.push(`thinking_duration = $${paramIndex}`);
                values.push(data.thinkingDuration);
                paramIndex++;
            }

            if (data?.totalTokens !== undefined) {
                updates.push(`total_tokens = $${paramIndex}`);
                values.push(data.totalTokens);
                paramIndex++;
            }

            if (data?.errorMessage !== undefined) {
                updates.push(`error_message = $${paramIndex}`);
                values.push(data.errorMessage);
                paramIndex++;
            }

            if (status === 'complete' || status === 'failed') {
                updates.push(`generation_end_time = CURRENT_TIMESTAMP`);
            }

            const query = `
        UPDATE generations 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *;
      `;

            const result = await client.query(query, values);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    // Add generated files
    static async addGeneratedFiles(
        generationId: number,
        files: Array<{
            filePath: string;
            fileContent: string;
            fileType?: string;
        }>
    ): Promise<GenerationFile[]> {
        const client = await pool.connect();
        try {
            const insertedFiles: GenerationFile[] = [];

            for (const file of files) {
                const query = `
          INSERT INTO generation_files (generation_id, file_path, file_content, file_type, created_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          RETURNING *;
        `;

                const result = await client.query(query, [
                    generationId,
                    file.filePath,
                    file.fileContent,
                    file.fileType || null
                ]);

                insertedFiles.push(result.rows[0]);
            }

            return insertedFiles;
        } finally {
            client.release();
        }
    }

    // Get generation by ID
    static async getGenerationById(generationId: number): Promise<Generation | null> {
        const client = await pool.connect();
        try {
            const query = 'SELECT * FROM generations WHERE id = $1';
            const result = await client.query(query, [generationId]);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    // Get project generations
    static async getProjectGenerations(
        projectId: number,
        limit: number = 50
    ): Promise<Generation[]> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT * FROM generations 
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
            const result = await client.query(query, [projectId, limit]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get generation files
    static async getGenerationFiles(generationId: number): Promise<GenerationFile[]> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT * FROM generation_files 
        WHERE generation_id = $1
        ORDER BY file_path ASC
      `;
            const result = await client.query(query, [generationId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get all project files (from latest successful generation)
    static async getLatestProjectFiles(projectId: number): Promise<GenerationFile[]> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT gf.* 
        FROM generation_files gf
        INNER JOIN generations g ON gf.generation_id = g.id
        WHERE g.project_id = $1 AND g.status = 'complete'
        ORDER BY g.created_at DESC, gf.file_path ASC
        LIMIT 1000
      `;
            const result = await client.query(query, [projectId]);

            // Group by generation and return only the latest
            const latestGeneration = result.rows[0]?.generation_id;
            if (!latestGeneration) return [];

            return result.rows.filter(row => row.generation_id === latestGeneration);
        } finally {
            client.release();
        }
    }

    // Get generation statistics
    static async getGenerationStats(userId: number): Promise<{
        total: number;
        successful: number;
        failed: number;
        avgThinkingTime: number;
    }> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'complete' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          AVG(thinking_duration) as avg_thinking
        FROM generations
        WHERE user_id = $1
      `;
            const result = await client.query(query, [userId]);
            const row = result.rows[0];

            return {
                total: parseInt(row.total || 0),
                successful: parseInt(row.successful || 0),
                failed: parseInt(row.failed || 0),
                avgThinkingTime: parseFloat(row.avg_thinking || 0)
            };
        } finally {
            client.release();
        }
    }
}
