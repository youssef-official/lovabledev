-- Database Schema for Lovable Clone
-- Run this script to create all necessary tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS generation_files CASCADE;
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
-- Stores user authentication and profile information
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  login_count INTEGER DEFAULT 1
);

-- Projects table
-- Stores project metadata and current state
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  code TEXT, -- Current main code or entry point
  model VARCHAR(100), -- Model used for the project
  status VARCHAR(50) DEFAULT 'active', -- active, archived, deleted
  sandbox_id VARCHAR(255), -- E2B sandbox ID
  sandbox_url TEXT, -- E2B sandbox URL
  preview_image TEXT, -- Screenshot or preview image url
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generations table
-- Stores history of AI code generations for each project
CREATE TABLE generations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  model VARCHAR(100), -- 'minimax-m2', 'openrouter-gpt4', etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, thinking, generating, complete, failed
  thinking_duration INTEGER, -- milliseconds spent thinking
  generation_start_time TIMESTAMP,
  generation_end_time TIMESTAMP,
  total_tokens INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated files table
-- Stores individual files created during a generation
CREATE TABLE generation_files (
  id SERIAL PRIMARY KEY,
  generation_id INTEGER NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_content TEXT NOT NULL,
  file_type VARCHAR(50), -- typescript, javascript, css, html, json
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX idx_generations_project_id ON generations(project_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generation_files_generation_id ON generation_files(generation_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing and development

-- 1. Insert a sample user
INSERT INTO users (google_id, email, name, image) VALUES
('google_123456789', 'test@example.com', 'Test User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

-- 2. Insert sample projects
INSERT INTO projects (user_id, name, description, prompt, code, model, status) VALUES
(1, 'Health Chat App', 'A healthcare chat application with AI assistant', 'Create a health chat application with AI assistant that can help diagnose simple symptoms.', '', 'minimax', 'active'),
(1, 'E-commerce Admin', 'Admin dashboard for managing products', 'Build an admin dashboard for managing e-commerce products with charts and tables.', '', 'minimax', 'active'),
(1, 'Personal Portfolio', 'Modern portfolio website with animations', 'Create a modern portfolio website with scroll animations and a dark theme.', '', 'minimax', 'active'),
(1, 'Task Manager', 'Kanban style task management app', 'I need a kanban board to manage my daily tasks.', '', 'openrouter', 'archived');

-- 3. Insert sample generations
INSERT INTO generations (project_id, user_id, prompt, model, status, thinking_duration, generation_start_time, generation_end_time) VALUES
(1, 1, 'Initial creation', 'minimax', 'complete', 1500, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes'),
(1, 1, 'Add dark mode', 'minimax', 'complete', 1200, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '29 minutes');

-- 4. Insert sample files
INSERT INTO generation_files (generation_id, file_path, file_content, file_type) VALUES
(1, 'src/App.tsx', 'export default function App() { return <div>Hello World</div> }', 'typescript'),
(1, 'src/index.css', 'body { background: white; }', 'css'),
(2, 'src/App.tsx', 'export default function App() { return <div className="dark">Dark Mode</div> }', 'typescript');

-- Verification queries
SELECT 'Users table:' as info, COUNT(*) as count FROM users;
SELECT 'Projects table:' as info, COUNT(*) as count FROM projects;
SELECT 'Generations table:' as info, COUNT(*) as count FROM generations;
SELECT 'Generation files table:' as info, COUNT(*) as count FROM generation_files;
