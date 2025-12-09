import { pool } from '../database';

export interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    prompt: string;
    code: string;
    model: string;
    status: string;
    sandbox_id: string | null;
    sandbox_url: string | null;
    preview_image: string | null;
    created_at: Date;
    updated_at: Date;
    last_viewed_at: Date;
}

export class ProjectDatabase {
    // Create a new project
    static async createProject(data: {
        userId: number;
        name: string;
        description?: string;
        prompt: string;
        code: string;
        model: string;
    }): Promise<Project> {
        const client = await pool.connect();
        try {
            const query = `
        INSERT INTO projects (user_id, name, description, prompt, code, model, status, created_at, updated_at, last_viewed_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

            const result = await client.query(query, [
                data.userId,
                data.name,
                data.description === undefined ? null : data.description,
                data.prompt,
                data.code,
                data.model
            ]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get project by ID
    static async getProjectById(projectId: number): Promise<Project | null> {
        const client = await pool.connect();
        try {
            const query = 'SELECT * FROM projects WHERE id = $1';
            const result = await client.query(query, [projectId]);

            if (result.rows.length === 0) {
                return null;
            }

            // Update last_viewed_at
            await client.query(
                'UPDATE projects SET last_viewed_at = CURRENT_TIMESTAMP WHERE id = $1',
                [projectId]
            );

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get all projects for a user
    static async getUserProjects(
        userId: number,
        filters?: {
            status?: string;
            search?: string;
            limit?: number;
            offset?: number;
            sortBy?: 'created_at' | 'updated_at' | 'last_viewed_at' | 'name';
            sortOrder?: 'ASC' | 'DESC';
        }
    ): Promise<{ projects: Project[]; total: number }> {
        const client = await pool.connect();
        try {
            const limit = filters?.limit || 50;
            const offset = filters?.offset || 0;
            const sortBy = filters?.sortBy || 'updated_at';
            const sortOrder = filters?.sortOrder || 'DESC';

            let whereConditions = ['user_id = $1'];
            const queryParams: any[] = [userId];
            let paramIndex = 2;

            if (filters?.status) {
                whereConditions.push(`status = $${paramIndex}`);
                queryParams.push(filters.status);
                paramIndex++;
            }

            if (filters?.search) {
                whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
                queryParams.push(`%${filters.search}%`);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM projects WHERE ${whereClause}`;
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Get projects
            const projectsQuery = `
        SELECT * FROM projects 
        WHERE ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            queryParams.push(limit, offset);

            const projectsResult = await client.query(projectsQuery, queryParams);

            return {
                projects: projectsResult.rows,
                total
            };
        } finally {
            client.release();
        }
    }

    // Update project
    static async updateProject(
        projectId: number,
        data: {
            name?: string;
            description?: string;
            status?: string;
            sandbox_id?: string;
            sandbox_url?: string;
            preview_image?: string;
        }
    ): Promise<Project | null> {
        const client = await pool.connect();
        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                values.push(data.name);
                paramIndex++;
            }

            if (data.description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                values.push(data.description);
                paramIndex++;
            }

            if (data.status !== undefined) {
                updates.push(`status = $${paramIndex}`);
                values.push(data.status);
                paramIndex++;
            }

            if (data.sandbox_id !== undefined) {
                updates.push(`sandbox_id = $${paramIndex}`);
                values.push(data.sandbox_id);
                paramIndex++;
            }

            if (data.sandbox_url !== undefined) {
                updates.push(`sandbox_url = $${paramIndex}`);
                values.push(data.sandbox_url);
                paramIndex++;
            }

            if (data.preview_image !== undefined) {
                updates.push(`preview_image = $${paramIndex}`);
                values.push(data.preview_image);
                paramIndex++;
            }

            if (updates.length === 0) {
                return await this.getProjectById(projectId);
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(projectId);

            const query = `
        UPDATE projects 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *;
      `;

            const result = await client.query(query, values);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    // Delete project
    static async deleteProject(projectId: number): Promise<boolean> {
        const client = await pool.connect();
        try {
            const query = 'DELETE FROM projects WHERE id = $1';
            const result = await client.query(query, [projectId]);
            return result.rowCount !== null && result.rowCount > 0;
        } finally {
            client.release();
        }
    }

    // Get project statistics for a user
    static async getProjectStats(userId: number): Promise<{
        total: number;
        active: number;
        archived: number;
    }> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
        FROM projects
        WHERE user_id = $1
      `;
            const result = await client.query(query, [userId]);
            const row = result.rows[0];

            return {
                total: parseInt(row.total),
                active: parseInt(row.active),
                archived: parseInt(row.archived)
            };
        } finally {
            client.release();
        }
    }
}
