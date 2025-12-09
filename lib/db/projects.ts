import { supabase } from '../database';

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
        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                user_id: data.userId,
                name: data.name,
                description: data.description || null,
                prompt: data.prompt,
                code: data.code,
                model: data.model,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_viewed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating project:', error);
            throw new Error(error.message);
        }
        return project as Project;
    }

    // Get project by ID
    static async getProjectById(projectId: number): Promise<Project | null> {
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            return null;
        }

        // Update last_viewed_at (fire and forget)
        supabase
            .from('projects')
            .update({ last_viewed_at: new Date().toISOString() })
            .eq('id', projectId)
            .then(({ error }) => {
                if (error) console.error('Error updating last_viewed_at:', error);
            });

        return project as Project;
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
        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;
        const sortBy = filters?.sortBy || 'updated_at';
        const sortOrder = filters?.sortOrder || 'DESC';

        let query = supabase
            .from('projects')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        query = query
            .order(sortBy, { ascending: sortOrder === 'ASC' })
            .range(offset, offset + limit - 1);

        const { data: projects, count, error } = await query;

        if (error) {
            console.error('Error getting user projects:', error);
            throw new Error(error.message);
        }

        return {
            projects: projects as Project[],
            total: count || 0
        };
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
        const updates: any = {};

        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined) updates.description = data.description;
        if (data.status !== undefined) updates.status = data.status;
        if (data.sandbox_id !== undefined) updates.sandbox_id = data.sandbox_id;
        if (data.sandbox_url !== undefined) updates.sandbox_url = data.sandbox_url;
        if (data.preview_image !== undefined) updates.preview_image = data.preview_image;

        if (Object.keys(updates).length === 0) {
            return await this.getProjectById(projectId);
        }

        updates.updated_at = new Date().toISOString();

        const { data: project, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) {
            console.error('Error updating project:', error);
            return null;
        }

        return project as Project;
    }

    // Delete project
    static async deleteProject(projectId: number): Promise<boolean> {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        return !error;
    }

    // Get project statistics for a user
    static async getProjectStats(userId: number): Promise<{
        total: number;
        active: number;
        archived: number;
    }> {
        // Parallel queries
        const [totalResult, activeResult, archivedResult] = await Promise.all([
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'archived')
        ]);

        return {
            total: totalResult.count || 0,
            active: activeResult.count || 0,
            archived: archivedResult.count || 0
        };
    }
}
