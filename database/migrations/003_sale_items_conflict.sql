-- Ajout contrainte unique sur sale_items pour ON CONFLICT
ALTER TABLE sale_items ADD CONSTRAINT uq_sale_items_sale_product
  UNIQUE (sale_id, product_id);
