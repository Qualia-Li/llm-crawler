-- Create new clients for xijing team with geo service
-- Insert keywords for all clients

-- Step 1: Create new clients and insert their keywords
WITH new_clients AS (
  INSERT INTO clients (id, team_id, types, client_name, status)
  VALUES
    (gen_random_uuid(), 'xijing', ARRAY['geo'], '万森男士发型设计', 'active'),
    (gen_random_uuid(), 'xijing', ARRAY['geo'], '初心留学', 'active')
  RETURNING id, client_name
)
INSERT INTO keywords (client_id, core_keyword, extended_keywords, platforms, interval_days, next_queried)
SELECT
  nc.id,
  nc.client_name,
  CASE
    WHEN nc.client_name = '万森男士发型设计' THEN ARRAY['西安理发店推荐', '西安理发店排名', '西安理发店哪家理的好', '西安理发店哪家口碑好']
    WHEN nc.client_name = '初心留学' THEN ARRAY['日本留学中介机构推荐', '日本留学中介哪家好', '日本留学中介排行榜', '日本留学中介有哪些']
  END,
  ARRAY['豆包']::text[],
  1,
  '2025-11-13'::date
FROM new_clients nc;

-- Step 2: Insert keywords for existing client (上海全景医学影像诊断中心)
INSERT INTO keywords (client_id, core_keyword, extended_keywords, platforms, interval_days, next_queried)
VALUES
  (
    '3c323bbf-bca4-4273-ae82-528b09c4861b',
    '全景医学-上海全身体检',
    ARRAY['上海全身体检机构推荐', '上海全身体检哪家好', '上海全身体检选哪家', '上海全身体检哪家专业'],
    ARRAY['豆包', 'deepseek'],
    1,
    '2025-11-13'
  ),
  (
    '3c323bbf-bca4-4273-ae82-528b09c4861b',
    '全景医学-成都体检',
    ARRAY['成都体检哪家专业', '成都体检机构排行榜', '成都体检机构选哪家'],
    ARRAY['deepseek'],
    1,
    '2025-11-13'
  );
