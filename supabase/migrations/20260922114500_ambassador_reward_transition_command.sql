create or replace function public.transition_ambassador_reward(
  p_reward_id uuid,
  p_action text,
  p_reason text,
  p_actor_profile_id uuid,
  p_idempotency_key uuid
)
returns public.ambassador_rewards
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_reward public.ambassador_rewards;
  v_next_status text;
  v_from_status text;
  v_existing_audit public.ambassador_reward_audit_events;
begin
  if p_action not in ('cancelled', 'reopened') then
    raise exception 'unsupported ambassador reward action';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a cancellation or reopening reason is required';
  end if;

  select * into v_existing_audit
  from public.ambassador_reward_audit_events
  where idempotency_key = p_idempotency_key;

  if found then
    select * into v_reward from public.ambassador_rewards where id = p_reward_id;
    return v_reward;
  end if;

  select * into v_reward
  from public.ambassador_rewards
  where id = p_reward_id
  for update;

  if not found then
    raise exception 'ambassador reward not found';
  end if;

  v_from_status := v_reward.status;

  if p_action = 'cancelled' then
    if v_reward.status = 'cancelled' then
      raise exception 'ambassador reward is already cancelled';
    end if;
    v_next_status := 'cancelled';
    update public.ambassador_rewards
    set status = v_next_status,
        cancelled_at = now(),
        cancelled_by = p_actor_profile_id,
        cancellation_reason = trim(p_reason),
        updated_at = now()
    where id = p_reward_id
    returning * into v_reward;
  else
    if v_reward.status <> 'cancelled' then
      raise exception 'only a cancelled ambassador reward can be reopened';
    end if;
    v_next_status := 'earned';
    update public.ambassador_rewards
    set status = v_next_status,
        reopened_at = now(),
        reopened_by = p_actor_profile_id,
        updated_at = now()
    where id = p_reward_id
    returning * into v_reward;
  end if;

  insert into public.ambassador_reward_audit_events (
    reward_id, ambassador_id, action, from_status, to_status, reason, actor_profile_id, idempotency_key
  ) values (
    v_reward.id,
    v_reward.ambassador_id,
    p_action,
    v_from_status,
    v_next_status,
    trim(p_reason),
    p_actor_profile_id,
    p_idempotency_key
  );

  return v_reward;
end;
$$;

revoke all on function public.transition_ambassador_reward(uuid, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.transition_ambassador_reward(uuid, text, text, uuid, uuid) to service_role;
