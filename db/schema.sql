CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL DEFAULT '',
  phone VARCHAR(32) NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  logo_data TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  state VARCHAR(120) NOT NULL DEFAULT '',
  country VARCHAR(120) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  preview JSONB NOT NULL DEFAULT '{}'::jsonb,
  locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  public_card_form_id VARCHAR(16),
  public_card_form_token_hash CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS locations JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS public_card_form_id VARCHAR(16);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS public_card_form_token_hash CHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS companies_public_card_form_id_unique
  ON companies (public_card_form_id)
  WHERE public_card_form_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS companies_public_card_form_token_hash_unique
  ON companies (public_card_form_token_hash)
  WHERE public_card_form_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(100) NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  state VARCHAR(120) NOT NULL DEFAULT '',
  country VARCHAR(120) NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS branches_company_name_unique
  ON branches (company_id, lower(name));
CREATE INDEX IF NOT EXISTS branches_company_status_idx
  ON branches (company_id, status);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code VARCHAR(100),
  full_name VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL DEFAULT '',
  department VARCHAR(120) NOT NULL DEFAULT '',
  country_code VARCHAR(8) NOT NULL DEFAULT '+91',
  mobile VARCHAR(20) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  profile_photo TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  linkedin_name VARCHAR(100) NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS employees_company_code_unique
  ON employees (company_id, lower(employee_code))
  WHERE employee_code IS NOT NULL AND employee_code <> '';

CREATE UNIQUE INDEX IF NOT EXISTS employees_company_email_unique
  ON employees (company_id, lower(email))
  WHERE email <> '';

CREATE INDEX IF NOT EXISTS employees_company_name_idx
  ON employees (company_id, lower(full_name));

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(24) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id, employee_id)
    REFERENCES employees (company_id, id)
    ON DELETE CASCADE,
  CHECK (
    (role = 'SUPER_ADMIN' AND company_id IS NULL AND employee_id IS NULL) OR
    (role = 'COMPANY_ADMIN' AND company_id IS NOT NULL AND employee_id IS NULL) OR
    (role = 'EMPLOYEE' AND company_id IS NOT NULL AND employee_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_company_role_idx ON users (company_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS users_employee_unique
  ON users (employee_id)
  WHERE employee_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  country_code VARCHAR(8) NOT NULL DEFAULT '+91',
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(254) NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  linkedin_name VARCHAR(100) NOT NULL DEFAULT '',
  logo_data TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  preview JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id, employee_id)
    REFERENCES employees (company_id, id)
    ON DELETE CASCADE
);

ALTER TABLE cards ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS logo_data TEXT NOT NULL DEFAULT '';

UPDATE cards c
SET logo_data = co.logo_data
FROM companies co
WHERE co.id = c.company_id AND c.logo_data = '';

CREATE INDEX IF NOT EXISTS cards_company_created_idx
  ON cards (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cards_employee_idx
  ON cards (company_id, employee_id);
CREATE INDEX IF NOT EXISTS cards_company_status_idx
  ON cards (company_id, is_active);

CREATE TABLE IF NOT EXISTS migration_runs (
  id VARCHAR(100) PRIMARY KEY,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
