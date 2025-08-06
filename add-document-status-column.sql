ALTER TABLE documents
ADD COLUMN status TEXT DEFAULT 'pending';

ALTER TABLE documents
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);