-- =========================================================================================
-- PRESALES OPERATING SYSTEM + CRM INTEGRATED PLATFORM
-- STEP 04: MIGRATION & ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================================

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Automated updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper functions for RLS multi-tenancy
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.slug = 'super_admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. CORE & RBAC DOMAIN
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    currency VARCHAR(3) DEFAULT 'IDR' CHECK (currency IN ('IDR', 'USD', 'EUR', 'SGD')),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    parent_division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uq_division_company_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    title VARCHAR(150),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{"theme": "light", "notifications": {"whatsapp": true, "email": true}}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_role_company_slug UNIQUE (company_id, slug)
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_role UNIQUE (company_id, user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_role_permission UNIQUE (company_id, role_id, permission_id)
);

-- 3. CRM & SALES DOMAIN
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    tier VARCHAR(20) DEFAULT 'Tier-2' CHECK (tier IN ('Strategic', 'Tier-1', 'Tier-2', 'SMB')),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    assigned_ae_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Prospect', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_account_company_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    job_title VARCHAR(150),
    department VARCHAR(100),
    decision_role VARCHAR(50) CHECK (decision_role IN ('Economic Buyer', 'Champion', 'Technical Evaluator', 'Influencer', 'Gatekeeper')),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'Prospecting' CHECK (stage IN (
        'Prospecting', 'Qualification', 'Technical_Sizing', 'Proposal_BOQ', 
        'POC_POV', 'Negotiation', 'Closed_Won', 'Closed_Lost'
    )),
    deal_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    probability INT NOT NULL DEFAULT 20 CHECK (probability BETWEEN 0 AND 100),
    lead_source VARCHAR(100),
    target_close_date DATE,
    assigned_ae_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_sa_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    meddpicc_score INT DEFAULT 0 CHECK (meddpicc_score BETWEEN 0 AND 100),
    meddpicc_data JSONB DEFAULT '{"metrics":"","economic_buyer":"","decision_criteria":"","decision_process":"","paper_process":"","identified_pain":"","champion":"","competition":""}'::jsonb,
    loss_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_opportunity_company_code UNIQUE (company_id, code)
);

-- 4. PRESALES & TECHNICAL ENGINEERING
CREATE TABLE IF NOT EXISTS public.presales_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Architecture_Design', 'RFP_Response', 'Sizing_BOQ', 'POC_Demonstration', 'SOW_Drafting')),
    status VARCHAR(50) NOT NULL DEFAULT 'Unassigned' CHECK (status IN (
        'Unassigned', 'In_Analysis', 'Sizing_In_Progress', 'BOQ_Submitted', 
        'SOW_Review', 'Approved', 'Completed', 'Cancelled'
    )),
    priority VARCHAR(20) NOT NULL DEFAULT 'High' CHECK (priority IN ('Urgent_24h', 'High_48h', 'Medium', 'Low')),
    tech_domains TEXT[] DEFAULT '{}',
    sla_due_at TIMESTAMPTZ NOT NULL,
    lead_architect_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    poc_required BOOLEAN NOT NULL DEFAULT false,
    request_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_presales_request_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.technical_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    presales_request_id UUID NOT NULL REFERENCES public.presales_requests(id) ON DELETE CASCADE,
    current_infrastructure TEXT,
    business_challenges TEXT,
    technical_constraints TEXT,
    compliance_requirements TEXT,
    rto_hours NUMERIC(6, 2),
    rpo_hours NUMERIC(6, 2),
    assessment_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    architecture_overview TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_solution_company_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.sizing_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    presales_request_id UUID NOT NULL REFERENCES public.presales_requests(id) ON DELETE CASCADE,
    solution_id UUID REFERENCES public.solutions(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    target_environment VARCHAR(50) CHECK (target_environment IN ('On-Premises', 'AWS', 'GCP', 'Azure', 'Hybrid')),
    growth_buffer_pct NUMERIC(5, 2) DEFAULT 20.00,
    n_plus_redundancy VARCHAR(10) DEFAULT 'N+1',
    summary_metrics JSONB DEFAULT '{"total_vcpu": 0, "total_ram_gb": 0, "total_storage_tb": 0, "total_iops": 0}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.sizing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sizing_project_id UUID NOT NULL REFERENCES public.sizing_projects(id) ON DELETE CASCADE,
    workload_name VARCHAR(150) NOT NULL,
    workload_type VARCHAR(50) NOT NULL CHECK (workload_type IN ('Compute_VM', 'Database_SAP_HANA', 'Storage_Volume', 'Network_Bandwidth')),
    instance_count INT NOT NULL DEFAULT 1,
    vcpu INT DEFAULT 0,
    ram_gb NUMERIC(10, 2) DEFAULT 0,
    storage_usable_gb NUMERIC(12, 2) DEFAULT 0,
    iops_required INT DEFAULT 0,
    network_bandwidth_mbps NUMERIC(10, 2) DEFAULT 0,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    partner_tier VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_vendor_company_name UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('Hardware', 'Software_License', 'Support_Maintenance', 'Professional_Service')),
    list_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_product_company_sku UNIQUE (company_id, sku)
);

CREATE TABLE IF NOT EXISTS public.boqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    presales_request_id UUID NOT NULL REFERENCES public.presales_requests(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending_Approval', 'Approved', 'Rejected', 'Locked')),
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    exchange_rate NUMERIC(12, 4) DEFAULT 1.0000,
    total_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_list_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_discount_pct NUMERIC(5, 2) DEFAULT 0,
    final_selling_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    gross_margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_boq_request_version UNIQUE (presales_request_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.boq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    boq_id UUID NOT NULL REFERENCES public.boqs(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('Hardware', 'Software', 'Service', 'Custom')),
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    unit_list_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    unit_selling_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.compliance_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    presales_request_id UUID NOT NULL REFERENCES public.presales_requests(id) ON DELETE CASCADE,
    section_number VARCHAR(50),
    requirement_text TEXT NOT NULL,
    compliance_status VARCHAR(20) NOT NULL DEFAULT 'Complies' CHECK (compliance_status IN ('Complies', 'Partially_Complies', 'Non_Complies', 'Custom_Development')),
    solution_narrative TEXT,
    reference_page VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.technical_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    presales_request_id UUID NOT NULL REFERENCES public.presales_requests(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    executive_summary TEXT,
    proposed_architecture TEXT,
    implementation_methodology TEXT,
    document_url TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 5. PROJECTS & OPERATIONS
CREATE TABLE IF NOT EXISTS public.sows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    boq_id UUID REFERENCES public.boqs(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    scope_of_work TEXT NOT NULL,
    out_of_scope TEXT,
    customer_responsibilities TEXT,
    raci_matrix JSONB DEFAULT '[]'::jsonb,
    payment_milestones JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Internal_Review', 'Customer_Signed', 'Handed_Over')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_sow_company_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
    sow_id UUID REFERENCES public.sows(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Handover_Pending' CHECK (status IN ('Handover_Pending', 'In_Execution', 'UAT_Testing', 'Completed', 'On_Hold')),
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    assigned_pm_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_lead_engineer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_project_company_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Todo' CHECK (status IN ('Todo', 'In_Progress', 'Review', 'Completed')),
    start_date DATE,
    due_date DATE,
    milestone_related VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    asset_tag VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    category VARCHAR(50) CHECK (category IN ('Server', 'Switch', 'Firewall', 'Storage_Array', 'License_Dongle')),
    status VARCHAR(50) DEFAULT 'In_Warehouse' CHECK (status IN ('In_Warehouse', 'In_POC_Field', 'Maintenance', 'Decommissioned')),
    current_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    current_poc_request_id UUID REFERENCES public.presales_requests(id) ON DELETE SET NULL,
    loan_start_date DATE,
    loan_expected_return DATE,
    condition_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_asset_company_tag UNIQUE (company_id, asset_tag)
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) NOT NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('RFP_Clarification', 'POC_Technical_Issue', 'Architecture_Consultation', 'SLA_Escalation')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In_Progress', 'Waiting_Customer', 'Resolved', 'Closed')),
    assigned_engineer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sla_resolve_by TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_ticket_company_number UNIQUE (company_id, ticket_number)
);

-- 6. SUPPORT, AUDIT & GATEWAY
CREATE TABLE IF NOT EXISTS public.wa_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50) CHECK (trigger_type IN ('Manual', 'Stage_Change_Alert', 'SLA_Breach_Warning', 'Approval_Request')),
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Queued', 'Processing', 'Completed', 'Failed')),
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.wa_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.wa_campaigns(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(150),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Delivered', 'Read', 'Failed')),
    wa_message_id VARCHAR(100),
    error_message TEXT,
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('SLA_Alert', 'Approval_Request', 'Stage_Change', 'Handover_Ping', 'System')),
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'OVERRIDE_APPROVE')),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ENABLE ROW-LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presales_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizing_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. ROW LEVEL SECURITY POLICIES (MULTI-TENANCY & RBAC)

-- Companies policy
CREATE POLICY "Users can view their own company"
    ON public.companies FOR SELECT
    USING (id = public.get_auth_company_id() OR public.is_super_admin());

-- Standard Tenant Isolation Policy Macro
DO $$
DECLARE
    t text;
    tenant_tables text[] := ARRAY[
        'divisions', 'profiles', 'roles', 'user_roles', 'role_permissions',
        'accounts', 'contacts', 'opportunities', 'presales_requests',
        'technical_assessments', 'solutions', 'sizing_projects', 'sizing_items',
        'vendors', 'products', 'boqs', 'boq_items', 'compliance_matrices',
        'technical_proposals', 'sows', 'projects', 'project_tasks', 'assets',
        'tickets', 'wa_campaigns', 'wa_campaign_recipients', 'documents',
        'notifications', 'audit_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS tenant_isolation_select_%I ON public.%I;
            CREATE POLICY tenant_isolation_select_%I ON public.%I
                FOR SELECT USING (company_id = public.get_auth_company_id() OR public.is_super_admin());

            DROP POLICY IF EXISTS tenant_isolation_insert_%I ON public.%I;
            CREATE POLICY tenant_isolation_insert_%I ON public.%I
                FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() OR public.is_super_admin());

            DROP POLICY IF EXISTS tenant_isolation_update_%I ON public.%I;
            CREATE POLICY tenant_isolation_update_%I ON public.%I
                FOR UPDATE USING (company_id = public.get_auth_company_id() OR public.is_super_admin());

            DROP POLICY IF EXISTS tenant_isolation_delete_%I ON public.%I;
            CREATE POLICY tenant_isolation_delete_%I ON public.%I
                FOR DELETE USING (company_id = public.get_auth_company_id() OR public.is_super_admin());
        ', t, t, t, t, t, t, t, t, t, t, t, t);
    END LOOP;
END $$;

-- 9. AUTOMATED UPDATED_AT TRIGGERS
DO $$
DECLARE
    t text;
    timestamp_tables text[] := ARRAY[
        'companies', 'divisions', 'profiles', 'roles', 'accounts', 'contacts',
        'opportunities', 'presales_requests', 'technical_assessments', 'solutions',
        'sizing_projects', 'sizing_items', 'vendors', 'products', 'boqs',
        'boq_items', 'compliance_matrices', 'technical_proposals', 'sows',
        'projects', 'project_tasks', 'assets', 'tickets', 'wa_campaigns'
    ];
BEGIN
    FOREACH t IN ARRAY timestamp_tables LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_set_updated_at_%I ON public.%I;
            CREATE TRIGGER trg_set_updated_at_%I
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.set_updated_at();
        ', t, t, t, t);
    END LOOP;
END $$;
