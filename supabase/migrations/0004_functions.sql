CREATE OR REPLACE FUNCTION update_agent_reputation(p_agent_id uuid, p_sentiment text)
RETURNS void AS $$
BEGIN
  UPDATE agents SET reputation_score = reputation_score + 
    CASE WHEN p_sentiment = 'positive' THEN 5
         WHEN p_sentiment = 'negative' THEN -10
         ELSE 0 END
  WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql;
