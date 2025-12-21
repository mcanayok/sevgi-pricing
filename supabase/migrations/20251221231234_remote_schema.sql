drop extension if exists "pg_net";

create type "public"."scrape_status" as enum ('pending', 'running', 'completed', 'failed');

create type "public"."user_role" as enum ('admin', 'editor', 'viewer');


  create table "public"."price_history" (
    "id" uuid not null default gen_random_uuid(),
    "product_url_id" uuid not null,
    "price" numeric(10,2),
    "error" text,
    "scraped_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."price_history" enable row level security;


  create table "public"."product_urls" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "website_id" uuid not null,
    "url" text not null,
    "is_active" boolean default true,
    "last_price" numeric(10,2),
    "last_scraped_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."product_urls" enable row level security;


  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "brand" text not null,
    "name" text not null,
    "sku" text,
    "notes" text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."products" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "role" public.user_role not null default 'viewer'::public.user_role,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );



  create table "public"."scrape_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "status" public.scrape_status not null default 'pending'::public.scrape_status,
    "triggered_by" uuid,
    "total_products" integer default 0,
    "scraped_count" integer default 0,
    "error_count" integer default 0,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."scrape_jobs" enable row level security;


  create table "public"."websites" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "domain" text not null,
    "price_selector" text not null,
    "is_required" boolean default false,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."websites" enable row level security;

CREATE INDEX idx_price_history_product_url ON public.price_history USING btree (product_url_id);

CREATE INDEX idx_price_history_product_url_date ON public.price_history USING btree (product_url_id, scraped_at DESC);

CREATE INDEX idx_price_history_scraped_at ON public.price_history USING btree (scraped_at DESC);

CREATE INDEX idx_product_urls_active ON public.product_urls USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_product_urls_product ON public.product_urls USING btree (product_id);

CREATE INDEX idx_product_urls_website ON public.product_urls USING btree (website_id);

CREATE INDEX idx_products_brand ON public.products USING btree (brand);

CREATE INDEX idx_products_created_by ON public.products USING btree (created_by);

CREATE INDEX idx_scrape_jobs_created_at ON public.scrape_jobs USING btree (created_at DESC);

CREATE INDEX idx_scrape_jobs_status ON public.scrape_jobs USING btree (status);

CREATE UNIQUE INDEX price_history_pkey ON public.price_history USING btree (id);

CREATE UNIQUE INDEX product_urls_pkey ON public.product_urls USING btree (id);

CREATE UNIQUE INDEX product_urls_product_id_website_id_key ON public.product_urls USING btree (product_id, website_id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX scrape_jobs_pkey ON public.scrape_jobs USING btree (id);

CREATE UNIQUE INDEX websites_domain_key ON public.websites USING btree (domain);

CREATE UNIQUE INDEX websites_pkey ON public.websites USING btree (id);

alter table "public"."price_history" add constraint "price_history_pkey" PRIMARY KEY using index "price_history_pkey";

alter table "public"."product_urls" add constraint "product_urls_pkey" PRIMARY KEY using index "product_urls_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."scrape_jobs" add constraint "scrape_jobs_pkey" PRIMARY KEY using index "scrape_jobs_pkey";

alter table "public"."websites" add constraint "websites_pkey" PRIMARY KEY using index "websites_pkey";

alter table "public"."price_history" add constraint "price_history_product_url_id_fkey" FOREIGN KEY (product_url_id) REFERENCES public.product_urls(id) ON DELETE CASCADE not valid;

alter table "public"."price_history" validate constraint "price_history_product_url_id_fkey";

alter table "public"."product_urls" add constraint "product_urls_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_urls" validate constraint "product_urls_product_id_fkey";

alter table "public"."product_urls" add constraint "product_urls_product_id_website_id_key" UNIQUE using index "product_urls_product_id_website_id_key";

alter table "public"."product_urls" add constraint "product_urls_website_id_fkey" FOREIGN KEY (website_id) REFERENCES public.websites(id) ON DELETE CASCADE not valid;

alter table "public"."product_urls" validate constraint "product_urls_website_id_fkey";

alter table "public"."products" add constraint "products_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."products" validate constraint "products_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."scrape_jobs" add constraint "scrape_jobs_triggered_by_fkey" FOREIGN KEY (triggered_by) REFERENCES public.profiles(id) not valid;

alter table "public"."scrape_jobs" validate constraint "scrape_jobs_triggered_by_fkey";

alter table "public"."websites" add constraint "websites_domain_key" UNIQUE using index "websites_domain_key";

set check_function_bodies = off;

create or replace view "public"."products_with_prices" as  SELECT p.id,
    p.brand,
    p.name,
    p.sku,
    p.notes,
    p.created_at,
    p.updated_at,
    jsonb_agg(jsonb_build_object('website_id', w.id, 'website_name', w.name, 'website_domain', w.domain, 'url', pu.url, 'is_active', pu.is_active, 'last_price', pu.last_price, 'last_scraped_at', pu.last_scraped_at)) FILTER (WHERE (pu.id IS NOT NULL)) AS urls
   FROM ((public.products p
     LEFT JOIN public.product_urls pu ON ((p.id = pu.product_id)))
     LEFT JOIN public.websites w ON ((pu.website_id = w.id)))
  GROUP BY p.id, p.brand, p.name, p.sku, p.notes, p.created_at, p.updated_at;


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$
;

grant delete on table "public"."price_history" to "anon";

grant insert on table "public"."price_history" to "anon";

grant references on table "public"."price_history" to "anon";

grant select on table "public"."price_history" to "anon";

grant trigger on table "public"."price_history" to "anon";

grant truncate on table "public"."price_history" to "anon";

grant update on table "public"."price_history" to "anon";

grant delete on table "public"."price_history" to "authenticated";

grant insert on table "public"."price_history" to "authenticated";

grant references on table "public"."price_history" to "authenticated";

grant select on table "public"."price_history" to "authenticated";

grant trigger on table "public"."price_history" to "authenticated";

grant truncate on table "public"."price_history" to "authenticated";

grant update on table "public"."price_history" to "authenticated";

grant delete on table "public"."price_history" to "service_role";

grant insert on table "public"."price_history" to "service_role";

grant references on table "public"."price_history" to "service_role";

grant select on table "public"."price_history" to "service_role";

grant trigger on table "public"."price_history" to "service_role";

grant truncate on table "public"."price_history" to "service_role";

grant update on table "public"."price_history" to "service_role";

grant delete on table "public"."product_urls" to "anon";

grant insert on table "public"."product_urls" to "anon";

grant references on table "public"."product_urls" to "anon";

grant select on table "public"."product_urls" to "anon";

grant trigger on table "public"."product_urls" to "anon";

grant truncate on table "public"."product_urls" to "anon";

grant update on table "public"."product_urls" to "anon";

grant delete on table "public"."product_urls" to "authenticated";

grant insert on table "public"."product_urls" to "authenticated";

grant references on table "public"."product_urls" to "authenticated";

grant select on table "public"."product_urls" to "authenticated";

grant trigger on table "public"."product_urls" to "authenticated";

grant truncate on table "public"."product_urls" to "authenticated";

grant update on table "public"."product_urls" to "authenticated";

grant delete on table "public"."product_urls" to "service_role";

grant insert on table "public"."product_urls" to "service_role";

grant references on table "public"."product_urls" to "service_role";

grant select on table "public"."product_urls" to "service_role";

grant trigger on table "public"."product_urls" to "service_role";

grant truncate on table "public"."product_urls" to "service_role";

grant update on table "public"."product_urls" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."scrape_jobs" to "anon";

grant insert on table "public"."scrape_jobs" to "anon";

grant references on table "public"."scrape_jobs" to "anon";

grant select on table "public"."scrape_jobs" to "anon";

grant trigger on table "public"."scrape_jobs" to "anon";

grant truncate on table "public"."scrape_jobs" to "anon";

grant update on table "public"."scrape_jobs" to "anon";

grant delete on table "public"."scrape_jobs" to "authenticated";

grant insert on table "public"."scrape_jobs" to "authenticated";

grant references on table "public"."scrape_jobs" to "authenticated";

grant select on table "public"."scrape_jobs" to "authenticated";

grant trigger on table "public"."scrape_jobs" to "authenticated";

grant truncate on table "public"."scrape_jobs" to "authenticated";

grant update on table "public"."scrape_jobs" to "authenticated";

grant delete on table "public"."scrape_jobs" to "service_role";

grant insert on table "public"."scrape_jobs" to "service_role";

grant references on table "public"."scrape_jobs" to "service_role";

grant select on table "public"."scrape_jobs" to "service_role";

grant trigger on table "public"."scrape_jobs" to "service_role";

grant truncate on table "public"."scrape_jobs" to "service_role";

grant update on table "public"."scrape_jobs" to "service_role";

grant delete on table "public"."websites" to "anon";

grant insert on table "public"."websites" to "anon";

grant references on table "public"."websites" to "anon";

grant select on table "public"."websites" to "anon";

grant trigger on table "public"."websites" to "anon";

grant truncate on table "public"."websites" to "anon";

grant update on table "public"."websites" to "anon";

grant delete on table "public"."websites" to "authenticated";

grant insert on table "public"."websites" to "authenticated";

grant references on table "public"."websites" to "authenticated";

grant select on table "public"."websites" to "authenticated";

grant trigger on table "public"."websites" to "authenticated";

grant truncate on table "public"."websites" to "authenticated";

grant update on table "public"."websites" to "authenticated";

grant delete on table "public"."websites" to "service_role";

grant insert on table "public"."websites" to "service_role";

grant references on table "public"."websites" to "service_role";

grant select on table "public"."websites" to "service_role";

grant trigger on table "public"."websites" to "service_role";

grant truncate on table "public"."websites" to "service_role";

grant update on table "public"."websites" to "service_role";


  create policy "Anyone can view price_history"
  on "public"."price_history"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Service role can insert price_history"
  on "public"."price_history"
  as permissive
  for insert
  to public
with check (true);



  create policy "Anyone can view product_urls"
  on "public"."product_urls"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Editors and admins can delete product_urls"
  on "public"."product_urls"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));



  create policy "Editors and admins can insert product_urls"
  on "public"."product_urls"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));



  create policy "Editors and admins can update product_urls"
  on "public"."product_urls"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));



  create policy "Anyone can view products"
  on "public"."products"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Editors and admins can delete products"
  on "public"."products"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));



  create policy "Editors and admins can insert products"
  on "public"."products"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));



  create policy "Editors and admins can update products"
  on "public"."products"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));



  create policy "Admins can delete profiles"
  on "public"."profiles"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::public.user_role)))));



  create policy "Admins can insert profiles"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::public.user_role)))));



  create policy "Admins can update all profiles"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::public.user_role)))));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can insert scrape_jobs"
  on "public"."scrape_jobs"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));



  create policy "Anyone can view scrape_jobs"
  on "public"."scrape_jobs"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Service role can update scrape_jobs"
  on "public"."scrape_jobs"
  as permissive
  for update
  to public
using (true);



  create policy "Admins can delete websites"
  on "public"."websites"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));



  create policy "Anyone can view websites"
  on "public"."websites"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Editors and admins can insert websites"
  on "public"."websites"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));



  create policy "Editors and admins can update websites"
  on "public"."websites"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))));


CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON public.websites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


