-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-organization access control
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE au_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE au_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE au_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE overhead_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_investors ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Get user's organizations
CREATE OR REPLACE FUNCTION public.user_orgs()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT org_id 
    FROM user_orgs 
    WHERE user_id = auth.uid();
$$;

-- Check if user has role in organization
CREATE OR REPLACE FUNCTION public.user_has_role(p_org_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_orgs 
        WHERE user_id = auth.uid() 
          AND org_id = p_org_id 
          AND role = p_role
    );
$$;

-- Check if user can modify (owner or manager)
CREATE OR REPLACE FUNCTION public.user_can_modify(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_orgs 
        WHERE user_id = auth.uid() 
          AND org_id = p_org_id 
          AND role IN ('owner', 'manager')
    );
$$;

-- =====================================================
-- 3. ORGANIZATIONS POLICIES
-- =====================================================

-- Users can see organizations they belong to
CREATE POLICY "Users can view their organizations" ON orgs
    FOR SELECT USING (id IN (SELECT public.user_orgs()));

-- Only owners can create organizations
CREATE POLICY "Owners can create organizations" ON orgs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can update their organizations
CREATE POLICY "Owners can update organizations" ON orgs
    FOR UPDATE USING (public.user_has_role(id, 'owner'));

-- =====================================================
-- 4. USER_ORGS POLICIES
-- =====================================================

-- Users can see their own organization memberships
CREATE POLICY "Users can view their org memberships" ON user_orgs
    FOR SELECT USING (user_id = auth.uid() OR org_id IN (SELECT public.user_orgs()));

-- Owners can manage organization memberships
CREATE POLICY "Owners can manage memberships" ON user_orgs
    FOR ALL USING (public.user_has_role(org_id, 'owner'));

-- =====================================================
-- 5. CARS POLICIES
-- =====================================================

-- Users can view cars in their organizations
CREATE POLICY "Users can view org cars" ON au_cars
    FOR SELECT USING (org_id IN (SELECT public.user_orgs()));

-- Owners and managers can insert cars
CREATE POLICY "Owners/managers can create cars" ON au_cars
    FOR INSERT WITH CHECK (public.user_can_modify(org_id));

-- Owners and managers can update cars
CREATE POLICY "Owners/managers can update cars" ON au_cars
    FOR UPDATE USING (public.user_can_modify(org_id));

-- Only owners can delete cars
CREATE POLICY "Owners can delete cars" ON au_cars
    FOR DELETE USING (public.user_has_role(org_id, 'owner'));

-- =====================================================
-- 6. EXPENSES POLICIES
-- =====================================================

-- Users can view expenses in their organizations
CREATE POLICY "Users can view org expenses" ON au_expenses
    FOR SELECT USING (org_id IN (SELECT public.user_orgs()));

-- Owners and managers can create expenses
CREATE POLICY "Owners/managers can create expenses" ON au_expenses
    FOR INSERT WITH CHECK (public.user_can_modify(org_id));

-- Owners and managers can update expenses
CREATE POLICY "Owners/managers can update expenses" ON au_expenses
    FOR UPDATE USING (public.user_can_modify(org_id));

-- Only owners can delete expenses
CREATE POLICY "Owners can delete expenses" ON au_expenses
    FOR DELETE USING (public.user_has_role(org_id, 'owner'));

-- =====================================================
-- 7. INCOMES POLICIES
-- =====================================================

-- Users can view incomes in their organizations
CREATE POLICY "Users can view org incomes" ON au_incomes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM au_cars c 
            WHERE c.id = car_id AND c.org_id IN (SELECT public.user_orgs())
        )
    );

-- Owners and managers can create incomes
CREATE POLICY "Owners/managers can create incomes" ON au_incomes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM au_cars c 
            WHERE c.id = car_id AND public.user_can_modify(c.org_id)
        )
    );

-- Owners and managers can update incomes
CREATE POLICY "Owners/managers can update incomes" ON au_incomes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM au_cars c 
            WHERE c.id = car_id AND public.user_can_modify(c.org_id)
        )
    );

-- =====================================================
-- 8. DEALS POLICIES
-- =====================================================

-- Users can view deals in their organizations
CREATE POLICY "Users can view org deals" ON deals
    FOR SELECT USING (org_id IN (SELECT public.user_orgs()));

-- Owners and managers can create deals
CREATE POLICY "Owners/managers can create deals" ON deals
    FOR INSERT WITH CHECK (public.user_can_modify(org_id));

-- Owners and managers can update deals
CREATE POLICY "Owners/managers can update deals" ON deals
    FOR UPDATE USING (public.user_can_modify(org_id));

-- =====================================================
-- 9. OVERHEAD RULES POLICIES
-- =====================================================

-- Users can view overhead rules in their organizations
CREATE POLICY "Users can view org overhead rules" ON overhead_rules
    FOR SELECT USING (org_id IN (SELECT public.user_orgs()));

-- Only owners can manage overhead rules
CREATE POLICY "Owners can manage overhead rules" ON overhead_rules
    FOR ALL USING (public.user_has_role(org_id, 'owner'));

-- =====================================================
-- 10. DOCUMENTS POLICIES
-- =====================================================

-- Users can view documents in their organizations
CREATE POLICY "Users can view org documents" ON documents
    FOR SELECT USING (org_id IN (SELECT public.user_orgs()));

-- Owners and managers can upload documents
CREATE POLICY "Owners/managers can upload documents" ON documents
    FOR INSERT WITH CHECK (public.user_can_modify(org_id));

-- Owners and managers can update documents
CREATE POLICY "Owners/managers can update documents" ON documents
    FOR UPDATE USING (public.user_can_modify(org_id));

-- Only owners can delete documents
CREATE POLICY "Owners can delete documents" ON documents
    FOR DELETE USING (public.user_has_role(org_id, 'owner'));

-- =====================================================
-- 11. INVESTORS POLICIES
-- =====================================================

-- Users can view investors in their organizations
CREATE POLICY "Users can view org investors" ON investors
    FOR SELECT USING (org_id IN (SELECT public.user_orgs()));

-- Only owners can manage investors
CREATE POLICY "Owners can manage investors" ON investors
    FOR ALL USING (public.user_has_role(org_id, 'owner'));

-- =====================================================
-- 12. CAR INVESTORS POLICIES
-- =====================================================

-- Users can view car investor relationships
CREATE POLICY "Users can view car investors" ON car_investors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM au_cars c 
            WHERE c.id = car_id AND c.org_id IN (SELECT public.user_orgs())
        )
    );

-- Only owners can manage car investor relationships
CREATE POLICY "Owners can manage car investors" ON car_investors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM au_cars c 
            WHERE c.id = car_id AND public.user_has_role(c.org_id, 'owner')
        )
    );

-- =====================================================
-- 13. STORAGE POLICIES (for documents)
-- =====================================================

-- Create storage bucket for documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-documents', 'car-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage objects
CREATE POLICY "Users can view org documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'car-documents' AND
        auth.uid() IS NOT NULL AND
        -- Extract org_id from path (assuming format: org_id/car_id/filename)
        (string_to_array(name, '/'))[1]::UUID IN (SELECT public.user_orgs())
    );

CREATE POLICY "Owners/managers can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'car-documents' AND
        auth.uid() IS NOT NULL AND
        public.user_can_modify((string_to_array(name, '/'))[1]::UUID)
    );

CREATE POLICY "Owners/managers can update documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'car-documents' AND
        auth.uid() IS NOT NULL AND
        public.user_can_modify((string_to_array(name, '/'))[1]::UUID)
    );

CREATE POLICY "Owners can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'car-documents' AND
        auth.uid() IS NOT NULL AND
        public.user_has_role((string_to_array(name, '/'))[1]::UUID, 'owner')
    );
