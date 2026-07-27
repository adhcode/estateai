-- Add rules field to estates table
ALTER TABLE estates ADD COLUMN rules JSONB;

-- Add default rules for existing estates
UPDATE estates SET rules = '{
  "rules": [
    {
      "id": "pets-policy",
      "category": "pets",
      "title": "Pet Policy",
      "rule": "Pets are not allowed in the estate",
      "keywords": ["pet", "pets", "dog", "cat", "animal", "animals"],
      "answer": "Pets are not allowed in the estate. This policy helps maintain cleanliness and ensures the comfort of all residents. Service animals may be considered on a case-by-case basis with proper documentation."
    }
  ]
}'::jsonb WHERE rules IS NULL;
