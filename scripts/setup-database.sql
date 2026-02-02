-- Create satisfaction_feedback table
CREATE TABLE IF NOT EXISTS satisfaction_feedback (
  id SERIAL PRIMARY KEY,
  satisfaction_level VARCHAR(50) NOT NULL,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_satisfaction_date ON satisfaction_feedback(created_date);
CREATE INDEX IF NOT EXISTS idx_satisfaction_level ON satisfaction_feedback(satisfaction_level);

-- Insert some sample data for testing
INSERT INTO satisfaction_feedback (satisfaction_level, created_date, created_time, created_at)
VALUES 
  ('Muito Satisfeito', CURRENT_DATE - INTERVAL '2 days', '10:30:00', NOW() - INTERVAL '2 days'),
  ('Satisfeito', CURRENT_DATE - INTERVAL '2 days', '11:45:00', NOW() - INTERVAL '2 days'),
  ('Insatisfeito', CURRENT_DATE - INTERVAL '1 day', '14:20:00', NOW() - INTERVAL '1 day'),
  ('Muito Satisfeito', CURRENT_DATE, '09:15:00', NOW()),
  ('Satisfeito', CURRENT_DATE, '16:30:00', NOW());
