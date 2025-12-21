-- ============================================
-- SEVGI PRICING - Complete Database Schema
-- ============================================
-- Run this in Supabase SQL Editor (supabase.com/dashboard → SQL Editor)

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
create type user_role as enum ('admin', 'editor', 'viewer');

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role user_role not null default 'viewer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Admin can manage all profiles
create policy "Admins can insert profiles"
  on profiles for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can delete profiles"
  on profiles for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- ============================================
-- 2. WEBSITES TABLE
-- ============================================
create table websites (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text not null unique,
  price_selector text not null,
  is_required boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table websites enable row level security;

-- Everyone can view websites
create policy "Anyone can view websites"
  on websites for select
  using (auth.role() = 'authenticated');

-- Editors and admins can manage websites
create policy "Editors and admins can insert websites"
  on websites for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors and admins can update websites"
  on websites for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Admins can delete websites"
  on websites for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
create table products (
  id uuid default gen_random_uuid() primary key,
  brand text not null,
  name text not null,
  sku text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index idx_products_brand on products(brand);
create index idx_products_created_by on products(created_by);

-- Enable RLS
alter table products enable row level security;

-- Everyone can view products
create policy "Anyone can view products"
  on products for select
  using (auth.role() = 'authenticated');

-- Editors and admins can manage products
create policy "Editors and admins can insert products"
  on products for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors and admins can update products"
  on products for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors and admins can delete products"
  on products for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- ============================================
-- 4. PRODUCT_URLS TABLE (Junction Table)
-- ============================================
create table product_urls (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade not null,
  website_id uuid references websites(id) on delete cascade not null,
  url text not null,
  is_active boolean default true,
  last_price decimal(10, 2),
  last_scraped_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique product-website combination
  unique(product_id, website_id)
);

-- Create indexes
create index idx_product_urls_product on product_urls(product_id);
create index idx_product_urls_website on product_urls(website_id);
create index idx_product_urls_active on product_urls(is_active) where is_active = true;

-- Enable RLS
alter table product_urls enable row level security;

-- Everyone can view product_urls
create policy "Anyone can view product_urls"
  on product_urls for select
  using (auth.role() = 'authenticated');

-- Editors and admins can manage product_urls
create policy "Editors and admins can insert product_urls"
  on product_urls for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors and admins can update product_urls"
  on product_urls for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors and admins can delete product_urls"
  on product_urls for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- ============================================
-- 5. PRICE_HISTORY TABLE
-- ============================================
create table price_history (
  id uuid default gen_random_uuid() primary key,
  product_url_id uuid references product_urls(id) on delete cascade not null,
  price decimal(10, 2),
  error text,
  scraped_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for time-series queries
create index idx_price_history_product_url on price_history(product_url_id);
create index idx_price_history_scraped_at on price_history(scraped_at desc);
create index idx_price_history_product_url_date on price_history(product_url_id, scraped_at desc);

-- Enable RLS
alter table price_history enable row level security;

-- Everyone can view price_history
create policy "Anyone can view price_history"
  on price_history for select
  using (auth.role() = 'authenticated');

-- Only service role (scraper) can insert price_history
-- We'll use service_role key in GitHub Actions
create policy "Service role can insert price_history"
  on price_history for insert
  with check (true);

-- ============================================
-- 6. SCRAPE_JOBS TABLE
-- ============================================
create type scrape_status as enum ('pending', 'running', 'completed', 'failed');

create table scrape_jobs (
  id uuid default gen_random_uuid() primary key,
  status scrape_status default 'pending' not null,
  triggered_by uuid references profiles(id),
  total_products integer default 0,
  scraped_count integer default 0,
  error_count integer default 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index
create index idx_scrape_jobs_status on scrape_jobs(status);
create index idx_scrape_jobs_created_at on scrape_jobs(created_at desc);

-- Enable RLS
alter table scrape_jobs enable row level security;

-- Everyone can view scrape_jobs
create policy "Anyone can view scrape_jobs"
  on scrape_jobs for select
  using (auth.role() = 'authenticated');

-- Admins can trigger scrape jobs
create policy "Admins can insert scrape_jobs"
  on scrape_jobs for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Service role can update scrape_jobs (for the scraper)
create policy "Service role can update scrape_jobs"
  on scrape_jobs for update
  using (true);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_websites_updated_at
  before update on websites
  for each row execute procedure update_updated_at_column();

create trigger update_products_updated_at
  before update on products
  for each row execute procedure update_updated_at_column();

-- ============================================
-- 8. INITIAL DATA: Trendyol Website
-- ============================================
insert into websites (name, domain, price_selector, is_required, notes)
values (
  'Trendyol',
  'trendyol.com',
  'span.prc-dsc',
  true,
  'Main marketplace - required for all products. Selector targets the discounted/final price.'
);

-- ============================================
-- 9. VIEW: Products with latest prices
-- ============================================
create or replace view products_with_prices as
select 
  p.id,
  p.brand,
  p.name,
  p.sku,
  p.notes,
  p.created_at,
  p.updated_at,
  -- Aggregate URLs with their latest prices
  jsonb_agg(
    jsonb_build_object(
      'website_id', w.id,
      'website_name', w.name,
      'website_domain', w.domain,
      'url', pu.url,
      'is_active', pu.is_active,
      'last_price', pu.last_price,
      'last_scraped_at', pu.last_scraped_at
    )
  ) filter (where pu.id is not null) as urls
from products p
left join product_urls pu on p.id = pu.product_id
left join websites w on pu.website_id = w.id
group by p.id, p.brand, p.name, p.sku, p.notes, p.created_at, p.updated_at;

-- ============================================
-- DONE! 
-- ============================================
-- After running this, create your admin user:
-- 1. Go to Authentication → Users → Add User
-- 2. Create user with your email/password
-- 3. Then run this SQL (replace YOUR_USER_ID):
--
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
-- ============================================

