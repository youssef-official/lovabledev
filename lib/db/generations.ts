import { supabase } from '../database';

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
        const { data: generation, error } = await supabase
            .from('generations')
            .insert({
                project_id: data.projectId,
                user_id: data.userId,
                prompt: data.prompt,
                model: data.model || null,
                status: 'pending',
                generation_start_time: new Date().toISOString(),
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating generation:', error);
            throw new Error(error.message);
        }
        return generation as Generation;
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
        const updateData: any = { status };

        if (data?.thinkingDuration !== undefined) {
            updateData.thinking_duration = data.thinkingDuration;
        }

        if (data?.totalTokens !== undefined) {
            updateData.total_tokens = data.totalTokens;
        }

        if (data?.errorMessage !== undefined) {
            updateData.error_message = data.errorMessage;
        }

        if (status === 'complete' || status === 'failed') {
            updateData.generation_end_time = new Date().toISOString();
        }

        const { data: generation, error } = await supabase
            .from('generations')
            .update(updateData)
            .eq('id', generationId)
            .select()
            .single();

        if (error) {
            console.error('Error updating generation status:', error);
            return null;
        }
        return generation as Generation;
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
        if (files.length === 0) return [];

        const filesData = files.map(file => ({
            generation_id: generationId,
            file_path: file.filePath,
            file_content: file.fileContent,
            file_type: file.fileType || null,
            created_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('generation_files')
            .insert(filesData)
            .select();

        if (error) {
            console.error('Error adding generated files:', error);
            throw new Error(error.message);
        }
        return data as GenerationFile[];
    }

    // Get generation by ID
    static async getGenerationById(generationId: number): Promise<Generation | null> {
        const { data, error } = await supabase
            .from('generations')
            .select('*')
            .eq('id', generationId)
            .single();

        if (error) return null;
        return data as Generation;
    }

    // Get project generations
    static async getProjectGenerations(
        projectId: number,
        limit: number = 50
    ): Promise<Generation[]> {
        const { data, error } = await supabase
            .from('generations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error getting project generations:', error);
            throw new Error(error.message);
        }
        return data as Generation[];
    }

    // Get generation files
    static async getGenerationFiles(generationId: number): Promise<GenerationFile[]> {
        const { data, error } = await supabase
            .from('generation_files')
            .select('*')
            .eq('generation_id', generationId)
            .order('file_path', { ascending: true });

        if (error) {
            console.error('Error getting generation files:', error);
            throw new Error(error.message);
        }
        return data as GenerationFile[];
    }

    // Get all project files (from latest successful generation)
    static async getLatestProjectFiles(projectId: number): Promise<GenerationFile[]> {
        // Find latest successful generation
        const { data: generation, error: genError } = await supabase
            .from('generations')
            .select('id')
            .eq('project_id', projectId)
            .eq('status', 'complete')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (genError || !generation) return [];

        // Get files for that generation
        const { data: files, error: filesError } = await supabase
            .from('generation_files')
            .select('*')
            .eq('generation_id', generation.id)
            .order('file_path', { ascending: true });

        if (filesError) {
            console.error('Error getting latest project files:', filesError);
            throw new Error(filesError.message);
        }
        return files as GenerationFile[];
    }

    // Get generation statistics
    static async getGenerationStats(userId: number): Promise<{
        total: number;
        successful: number;
        failed: number;
        avgThinkingTime: number;
    }> {
        // We'll run parallel queries for counts
        const [totalResult, successfulResult, failedResult, thinkingResult] = await Promise.all([
            supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'complete'),
            supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'failed'),
            // For avg thinking time, we'll fetch the last 100 successful generations and average them
            supabase.from('generations')
                .select('thinking_duration')
                .eq('user_id', userId)
                .not('thinking_duration', 'is', null)
                .order('created_at', { ascending: false })
                .limit(100)
        ]);

        const total = totalResult.count || 0;
        const successful = successfulResult.count || 0;
        const failed = failedResult.count || 0;

        let avgThinkingTime = 0;
        if (thinkingResult.data && thinkingResult.data.length > 0) {
            const sum = thinkingResult.data.reduce((acc, curr) => acc + (curr.thinking_duration || 0), 0);
            avgThinkingTime = sum / thinkingResult.data.length;
        }

        return {
            total,
            successful,
            failed,
            avgThinkingTime
        };
    }
}
