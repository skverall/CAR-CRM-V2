-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM public.users
    WHERE id = user_id;
    
    RETURN COALESCE(user_role_result, 'assistant'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Owners can view all users" ON public.users
    FOR SELECT USING (get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Owners can manage all users" ON public.users
    FOR ALL USING (get_user_role(auth.uid()) = 'owner');

-- Cars table policies
CREATE POLICY "All authenticated users can view cars" ON public.cars
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners and assistants can manage cars" ON public.cars
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('owner', 'assistant')
    );

CREATE POLICY "Investors can only view cars" ON public.cars
    FOR SELECT USING (get_user_role(auth.uid()) = 'investor');

-- Transactions table policies
CREATE POLICY "All authenticated users can view transactions" ON public.transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage all transactions" ON public.transactions
    FOR ALL USING (get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Assistants can create transactions" ON public.transactions
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'assistant' AND
        auth.uid() = user_id
    );

CREATE POLICY "Assistants can update their transactions" ON public.transactions
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'assistant' AND
        auth.uid() = user_id
    );

-- Capital table policies
CREATE POLICY "All authenticated users can view capital" ON public.capital
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only owners can update capital" ON public.capital
    FOR UPDATE USING (get_user_role(auth.uid()) = 'owner');

-- Exchange rates table policies
CREATE POLICY "All authenticated users can view exchange rates" ON public.exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can manage exchange rates" ON public.exchange_rates
    FOR ALL USING (get_user_role(auth.uid()) = 'owner');

-- Audit log policies
CREATE POLICY "Users can view their own audit logs" ON public.audit_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all audit logs" ON public.audit_log
    FOR SELECT USING (get_user_role(auth.uid()) = 'owner');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'assistant'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
