begin;
alter table public.daily_stats drop constraint daily_stats_event_check;
alter table public.daily_stats add constraint daily_stats_event_check
  check (event in ('session','page_view','product_view','whatsapp_click','trade_in'));
commit;
