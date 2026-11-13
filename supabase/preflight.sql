-- Read-only inspection. Review results BEFORE applying the migration.
select current_user, version();
select n.nspname as schema_name,c.relname as table_name,c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','your_city_private','supabase_migrations') and c.relkind='r'
order by 1,2;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname in ('public','your_city_private') order by 1,2,3;
select n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='your_city_private' or (n.nspname='public' and p.proname='complete_onboarding');
select tgname from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal;
select to_regclass('supabase_migrations.schema_migrations') as migration_history_table;
