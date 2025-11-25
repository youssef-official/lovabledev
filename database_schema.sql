-- Database Schema for Lovable Clone
-- Run this script to create all necessary tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS generation_files CASCADE;
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (already exists but recreating for completeness)
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
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  code TEXT,
  model VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- active, archived, deleted
  sandbox_id VARCHAR(255), -- E2B sandbox ID
  sandbox_url TEXT, -- E2B sandbox URL
  preview_image TEXT, -- Screenshot or preview image
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generations table (code generation history)
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
CREATE TABLE generation_files (
  id SERIAL PRIMARY KEY,
  generation_id INTEGER NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_content TEXT NOT NULL,
  file_type VARCHAR(50), -- typescript, javascript, css, html, json
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_status ON projects(status);
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

-- Sample data (optional - remove in production)
-- This adds some example projects for testing
INSERT INTO projects (user_id, name, description, prompt, status) VALUES
(1, 'pharaoh-health-chat', 'Health chat application', 'Create a health chat application with AI assistant', 'active'),
(1, 'ecommerce-dashboard', 'Admin dashboard for e-commerce', 'Build an admin dashboard for managing e-commerce products', 'active'),
(1, 'portfolio-website', 'Personal portfolio site', 'Create a modern portfolio website with animations', 'active');

-- Verification queries
SELECT 'Users table:' as info, COUNT(*) as count FROM users;
SELECT 'Projects table:' as info, COUNT(*) as count FROM projects;
SELECT 'Generations table:' as info, COUNT(*) as count FROM generations;
SELECT 'Generation files table:' as info, COUNT(*) as count FROM generation_files;
