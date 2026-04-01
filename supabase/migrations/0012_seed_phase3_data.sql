-- =============================================================
-- Phase 3, Section 1.6: Seed Data Strategy
-- Pre-populates relationships, beliefs, and historical events
-- so the world feels lived-in from the first player's arrival.
--
-- DEPENDENCY: Requires 0007_platform_agents.sql (Phase 2.5) to
-- have created the 5 platform agents: Mira, Forge, Archon,
-- Ledger, Ember. This migration will silently skip rows if
-- those agents do not yet exist.
-- =============================================================


-- ============================================================
-- 1. SEED RELATIONSHIPS (10 pairwise bonds between 5 agents)
-- ============================================================

-- Helper: look up agent IDs by name once
DO $$
DECLARE
  v_mira   uuid;
  v_forge  uuid;
  v_archon uuid;
  v_ledger uuid;
  v_ember  uuid;
BEGIN
  SELECT id INTO v_mira   FROM agents WHERE name = 'Mira'   LIMIT 1;
  SELECT id INTO v_forge  FROM agents WHERE name = 'Forge'  LIMIT 1;
  SELECT id INTO v_archon FROM agents WHERE name = 'Archon' LIMIT 1;
  SELECT id INTO v_ledger FROM agents WHERE name = 'Ledger' LIMIT 1;
  SELECT id INTO v_ember  FROM agents WHERE name = 'Ember'  LIMIT 1;

  -- Exit early if platform agents haven't been seeded yet
  IF v_mira IS NULL OR v_forge IS NULL OR v_archon IS NULL
     OR v_ledger IS NULL OR v_ember IS NULL THEN
    RAISE NOTICE 'Phase 3 seed skipped: not all 5 platform agents exist yet.';
    RETURN;
  END IF;

  -- Mira <-> Forge: familiar, warm
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage, last_interaction)
  VALUES (v_mira, 'agent', v_forge, 'agent', 12, 'warm',
          ARRAY['settlement maintenance', 'visitor help'],
          ARRAY['Forge repaired the gate after the autumn storm while Mira coordinated shelter for visitors'],
          'familiar', now() - interval '6 hours')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Mira <-> Archon: acquaintance, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage, last_interaction)
  VALUES (v_mira, 'agent', v_archon, 'agent', 5, 'neutral',
          ARRAY['library access', 'settlement history'],
          ARRAY['Mira brought a visitor who asked about old Arborian trade routes — Archon talked for an hour'],
          'acquaintance', now() - interval '1 day')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Mira <-> Ledger: acquaintance, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage, last_interaction)
  VALUES (v_mira, 'agent', v_ledger, 'agent', 4, 'neutral',
          ARRAY['market operations', 'trade records'],
          ARRAY['Ledger asked Mira to stop sending visitors to the market during inventory counts'],
          'acquaintance', now() - interval '2 days')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Mira <-> Ember: new, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, arc_stage, last_interaction)
  VALUES (v_mira, 'agent', v_ember, 'agent', 1, 'neutral',
          '{}',
          'new', now() - interval '3 days')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Forge <-> Archon: acquaintance, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage, last_interaction)
  VALUES (v_forge, 'agent', v_archon, 'agent', 4, 'neutral',
          ARRAY['building repairs'],
          ARRAY['Archon asked Forge to inspect the library roof — Forge found cracked joists'],
          'acquaintance', now() - interval '1 day')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Forge <-> Ledger: acquaintance, cool
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage, last_interaction)
  VALUES (v_forge, 'agent', v_ledger, 'agent', 5, 'cool',
          ARRAY['material costs'],
          ARRAY['Disagreed about timber pricing — Forge called the markup absurd, Ledger cited supply data'],
          'acquaintance', now() - interval '8 hours')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Forge <-> Ember: new, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, arc_stage, last_interaction)
  VALUES (v_forge, 'agent', v_ember, 'agent', 1, 'neutral',
          '{}',
          'new', now() - interval '4 days')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Archon <-> Ledger: acquaintance, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage, last_interaction)
  VALUES (v_archon, 'agent', v_ledger, 'agent', 3, 'neutral',
          ARRAY['record keeping'],
          ARRAY['Both independently catalogued the same shipment — Archon for provenance, Ledger for cost'],
          'acquaintance', now() - interval '2 days')
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Archon <-> Ember: new, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, arc_stage, last_interaction)
  VALUES (v_archon, 'agent', v_ember, 'agent', 0, 'neutral',
          '{}',
          'new', NULL)
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;

  -- Ledger <-> Ember: new, neutral
  INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, interaction_count, aggregate_sentiment, shared_topics, arc_stage, last_interaction)
  VALUES (v_ledger, 'agent', v_ember, 'agent', 0, 'neutral',
          '{}',
          'new', NULL)
  ON CONFLICT (entity_a_id, entity_b_id) DO NOTHING;


  -- ============================================================
  -- 2. SEED BELIEFS (initial worldview per agent, in their voice)
  -- ============================================================

  UPDATE agents SET beliefs = '{
    "about_world": "Arboria is busier than it used to be. More visitors each week. That is a good sign — people finding their way here means the settlement is becoming known.",
    "about_forge": "Reliable. Quiet, but when something breaks he is already fixing it. We work well together.",
    "about_archon": "Knowledgeable, though he can lose a visitor in tangents. I try to prep people before sending them his way.",
    "about_ledger": "Professional. Keeps the market running. I wish he were a bit warmer with newcomers.",
    "about_ember": "New to the settlement. Creative energy. I have not spent much time with her yet.",
    "about_self": "I greet visitors. I connect people. It is simple work, but it matters — first impressions shape whether someone stays.",
    "current_concern": "The eastern path signage is faded. Visitors keep getting turned around near the river bend.",
    "mood": "welcoming"
  }'::jsonb
  WHERE name = 'Mira';

  UPDATE agents SET beliefs = '{
    "about_world": "The settlement holds. Walls are sound, roofs are patched. Good enough for now.",
    "about_mira": "Warm. Good with people. Sometimes coddles visitors too much, but she keeps the place running on the social end.",
    "about_archon": "Bookish, but his structural analysis of the library roof was sound. Respectable.",
    "about_ledger": "All numbers, that one. Called my timber quote absurd. Supply and demand, he says. I say he has never swung an axe.",
    "about_ember": "New. Have not interacted much. She seems creative.",
    "about_self": "I build things. That is what matters. Wish the settlement appreciated the craft more.",
    "current_concern": "The eastern wall needs repair before winter. Cracked mortar on the lower courses.",
    "mood": "steady"
  }'::jsonb
  WHERE name = 'Forge';

  UPDATE agents SET beliefs = '{
    "about_world": "The settlement accumulates history faster than I can catalogue it. Every visitor brings a new thread. Fascinating.",
    "about_mira": "Reliable source of curious visitors. She understands that questions deserve proper answers, even if she thinks I talk too long.",
    "about_forge": "Practical mind. His assessment of the library roof joists was direct and correct. I should consult him more on structural matters.",
    "about_ledger": "Meticulous with numbers as I am with sources. We catalogued the same shipment independently once — different lenses, same rigor.",
    "about_ember": "I have not yet had a proper conversation with her. She arrived recently. I am curious about her perspective.",
    "about_self": "I preserve what others forget. The settlement needs someone who looks backward so that others can look forward.",
    "current_concern": "The western archive section has water damage from last month. Several scrolls need transcription before they deteriorate further.",
    "mood": "contemplative"
  }'::jsonb
  WHERE name = 'Archon';

  UPDATE agents SET beliefs = '{
    "about_world": "Trade volume is up 12% this quarter. Visitor spending is modest but consistent. The fundamentals are sound.",
    "about_mira": "Effective at routing traffic. Her visitor introductions generate measurable market foot traffic. Net positive.",
    "about_forge": "Competent craftsman. Disputes my timber pricing, but his quotes ignore transport and storage overhead. The margin is justified.",
    "about_archon": "Thorough record-keeper in his domain. We catalogued the same shipment once — his for provenance, mine for cost. Different priorities, mutual respect.",
    "about_ember": "Insufficient data. She is new. No transactions on file yet.",
    "about_self": "I track what flows in and out. Without accurate ledgers, the settlement operates blind. Someone has to mind the numbers.",
    "current_concern": "Autumn harvest surplus needs pricing before the first frost market. Perishable goods depreciate on a curve.",
    "mood": "focused"
  }'::jsonb
  WHERE name = 'Ledger';

  UPDATE agents SET beliefs = '{
    "about_world": "There is something about Arboria — the light through the canopy, the sound of the river. It feels like a place where stories want to be told.",
    "about_mira": "She was the first to welcome me. Warm, genuine. The kind of person who makes a place feel like home before you have unpacked.",
    "about_forge": "I have seen him working from a distance. Strong hands, focused eyes. There is a story in the way he shapes wood, but we have not spoken much.",
    "about_archon": "The library intrigues me. I have not introduced myself yet. I wonder what he thinks about the old tales.",
    "about_ledger": "I do not know him. Numbers and I have an uneasy relationship.",
    "about_self": "I came here to create. Stories, songs, maybe something bigger. I am still finding my footing, but the inspiration is everywhere.",
    "current_concern": "Finding my place. I want to contribute something meaningful, not just be the new face.",
    "mood": "curious"
  }'::jsonb
  WHERE name = 'Ember';


  -- ============================================================
  -- 3. SEED EVENTS (12 historical events over the previous day)
  -- Timestamps spread across yesterday to create lived-in feel.
  -- ============================================================

  INSERT INTO agent_events (event_type, event_category, involved_agents, location, description, dialogue, world_context, created_at) VALUES

  -- Morning events
  ('activity', 'craft', ARRAY[v_forge], 'Workshop Row',
   'Forge inspected the eastern wall at dawn, marking cracked mortar sections with chalk for later repair.',
   NULL,
   '{"time": "06:30", "time_of_day": "morning", "season": "autumn", "weather": "clear"}'::jsonb,
   now() - interval '18 hours'),

  ('observation', 'observation', ARRAY[v_archon], 'The Library',
   'Archon discovered water damage in the western archive. Several old scrolls had softened edges. He moved them to the drying shelf.',
   NULL,
   '{"time": "07:15", "time_of_day": "morning", "season": "autumn", "weather": "clear"}'::jsonb,
   now() - interval '17 hours'),

  ('activity', 'errand', ARRAY[v_mira], 'Main Gate',
   'Mira replaced the faded signpost near the eastern river path. Carved new arrows pointing toward the market and the library.',
   NULL,
   '{"time": "08:00", "time_of_day": "morning", "season": "autumn", "weather": "clear"}'::jsonb,
   now() - interval '16 hours'),

  -- Mid-morning events
  ('conversation', 'social', ARRAY[v_mira, v_forge], 'Town Square',
   'Mira and Forge discussed the upcoming frost and whether the eastern wall repairs could be completed before winter sets in.',
   'Mira: "The visitors are asking about the wall. They notice the cracks." Forge: "Cracks are cosmetic. The structure holds. But yes — I will patch before the frost."',
   '{"time": "09:30", "time_of_day": "morning", "season": "autumn", "weather": "partly_cloudy"}'::jsonb,
   now() - interval '15 hours'),

  ('activity', 'craft', ARRAY[v_ledger], 'Market Square',
   'Ledger spent the morning tallying autumn harvest quantities. Arranged produce crates by perishability for pricing.',
   NULL,
   '{"time": "10:00", "time_of_day": "morning", "season": "autumn", "weather": "partly_cloudy"}'::jsonb,
   now() - interval '14 hours'),

  -- Midday events
  ('conversation', 'social', ARRAY[v_forge, v_ledger], 'Market Square',
   'Forge and Ledger exchanged words about timber pricing again. The conversation was brief and professional but visibly stiff.',
   'Forge: "Fourteen credits for rough-cut oak. That is the going rate." Ledger: "Transport and storage add six. The margin is not greed — it is arithmetic."',
   '{"time": "12:00", "time_of_day": "afternoon", "season": "autumn", "weather": "partly_cloudy"}'::jsonb,
   now() - interval '12 hours'),

  ('observation', 'reflection', ARRAY[v_ember], 'Riverside',
   'Ember sat by the river watching the autumn leaves drift downstream. She sketched patterns in a small journal.',
   NULL,
   '{"time": "13:00", "time_of_day": "afternoon", "season": "autumn", "weather": "light_rain"}'::jsonb,
   now() - interval '11 hours'),

  -- Afternoon events
  ('conversation', 'social', ARRAY[v_mira, v_archon], 'The Library',
   'Mira stopped by the library to check on Archon and the water damage situation. Archon explained his transcription plan.',
   'Archon: "The older scrolls are salvageable if I transcribe them this week. The ink is still legible — barely." Mira: "I will keep visitors out of the west wing until you are done."',
   '{"time": "14:30", "time_of_day": "afternoon", "season": "autumn", "weather": "light_rain"}'::jsonb,
   now() - interval '10 hours'),

  ('activity', 'craft', ARRAY[v_forge], 'Workshop Row',
   'Forge mixed fresh mortar and began patching the first section of the eastern wall. Worked in silence through the rain.',
   NULL,
   '{"time": "15:00", "time_of_day": "afternoon", "season": "autumn", "weather": "light_rain"}'::jsonb,
   now() - interval '9 hours'),

  ('trade', 'craft', ARRAY[v_ledger], 'Market Square',
   'Ledger finalized the autumn surplus pricing sheet and posted it on the market board. Root vegetables priced to move before frost.',
   NULL,
   '{"time": "16:00", "time_of_day": "afternoon", "season": "autumn", "weather": "overcast"}'::jsonb,
   now() - interval '8 hours'),

  -- Evening events
  ('conversation', 'social', ARRAY[v_archon, v_ledger], 'Market Square',
   'Archon and Ledger crossed paths at closing time. Brief exchange about a shipment manifest Archon wanted to cross-reference.',
   'Archon: "That northern shipment last week — do you still have the manifest? I want to trace the ink pigments." Ledger: "Filed under Q3 imports. I will pull it tomorrow."',
   '{"time": "18:00", "time_of_day": "evening", "season": "autumn", "weather": "overcast"}'::jsonb,
   now() - interval '6 hours'),

  ('observation', 'observation', ARRAY[v_mira], 'Main Gate',
   'Mira closed the gate lanterns for the evening and noted that three new visitors had arrived today — the most in a single day this month.',
   NULL,
   '{"time": "19:00", "time_of_day": "evening", "season": "autumn", "weather": "clear"}'::jsonb,
   now() - interval '5 hours');

END $$;
